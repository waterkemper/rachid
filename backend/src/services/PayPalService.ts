/**
 * PayPalService - Service for interacting with PayPal REST API
 * Handles subscriptions, orders, and webhooks
 * 
 * Requires environment variables:
 * - PAYPAL_CLIENT_ID
 * - PAYPAL_CLIENT_SECRET
 * - PAYPAL_MODE (sandbox or live)
 */

interface PayPalAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PayPalSubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  billing_cycles: Array<{
    frequency: { interval_unit: string; interval_count: number };
    tenure_type: string;
    sequence: number;
    total_cycles?: number;
    pricing_scheme: { fixed_price: { value: string; currency_code: string } };
  }>;
  payment_preferences?: {
    auto_bill_outstanding?: boolean;
    setup_fee?: { value: string; currency_code: string };
    setup_fee_failure_action?: string;
    payment_failure_threshold?: number;
  };
}

interface PayPalSubscription {
  id: string;
  plan_id: string;
  status: string;
  subscriber: any;
  billing_info?: any;
  links?: Array<{ href: string; rel: string; method: string }>;
}

interface PayPalOrder {
  id: string;
  status: string;
  purchase_units: Array<{
    amount: { currency_code: string; value: string };
  }>;
  links?: Array<{ href: string; rel: string; method: string }>;
}

export class PayPalService {
  private static baseUrl: string;
  private static accessToken: PayPalAccessToken | null = null;
  private static accessTokenExpiry: number = 0;

  private static getBaseUrl(): string {
    if (!this.baseUrl) {
      const mode = process.env.PAYPAL_MODE || 'sandbox';
      this.baseUrl = mode === 'live' 
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
    }
    return this.baseUrl;
  }

  /**
   * Get OAuth access token from PayPal
   */
  private static async getAccessToken(): Promise<string> {
    const now = Date.now();
    
    // Return cached token if still valid (with 5 minute buffer)
    if (this.accessToken && now < this.accessTokenExpiry - 300000) {
      return this.accessToken.access_token;
    }

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set');
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const baseUrl = this.getBaseUrl();

    try {
      const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get PayPal access token: ${error}`);
      }

      const tokenData = await response.json() as PayPalAccessToken;
      this.accessToken = tokenData;
      this.accessTokenExpiry = now + (tokenData.expires_in * 1000);
      
      return tokenData.access_token;
    } catch (error) {
      console.error('PayPal getAccessToken error:', error);
      throw error;
    }
  }

  /**
   * Make authenticated request to PayPal API
   */
  private static async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAccessToken();
    const baseUrl = this.getBaseUrl();

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PayPal API error: ${response.status} ${error}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  }

  /**
   * Create a subscription plan
   */
  static async createSubscriptionPlan(data: {
    name: string;
    description?: string;
    billingCycle: { frequency: { interval_unit: string; interval_count: number }; pricing: { value: string; currency_code: string } };
  }): Promise<PayPalSubscriptionPlan> {
    const plan = {
      product_id: process.env.PAYPAL_PRODUCT_ID || 'PROD_DEFAULT',
      name: data.name,
      description: data.description || '',
      billing_cycles: [{
        frequency: data.billingCycle.frequency,
        tenure_type: 'REGULAR',
        sequence: 1,
        pricing_scheme: {
          fixed_price: {
            value: data.billingCycle.pricing.value,
            currency_code: data.billingCycle.pricing.currency_code || 'BRL',
          },
        },
      }],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    };

    return await this.makeRequest('/v1/billing/plans', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  }

  /**
   * Create a subscription and return approval URL
   */
  static async createSubscription(data: {
    planId: string;
    returnUrl: string;
    cancelUrl: string;
  }): Promise<{ id: string; approvalUrl: string }> {
    const subscription = {
      plan_id: data.planId,
      start_time: new Date(Date.now() + 60000).toISOString(), // Start 1 minute from now
      subscriber: {
        email_address: '', // Will be set by PayPal during approval
      },
      application_context: {
        brand_name: 'Rachid',
        locale: 'pt-BR',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
        // PayPal will replace {id} with subscription_id and {token} with ba_token
        return_url: data.returnUrl,
        cancel_url: data.cancelUrl,
      },
    };

    const result = await this.makeRequest('/v1/billing/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscription),
    });

    // Find approval URL from links
    const approvalLink = result.links?.find((link: any) => link.rel === 'approve' || link.rel === 'approval_url');
    
    if (!approvalLink) {
      console.error('PayPal subscription result:', JSON.stringify(result, null, 2));
      throw new Error('No approval URL found in PayPal response');
    }

    return {
      id: result.id,
      approvalUrl: approvalLink.href,
    };
  }

  /**
   * Activate subscription after PayPal approval
   */
  static async activateSubscription(subscriptionId: string): Promise<PayPalSubscription> {
    return await this.makeRequest(`/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify([
        {
          op: 'replace',
          path: '/billing_info/outstanding_balance',
          value: {
            value: '0.00',
            currency_code: 'BRL',
          },
        },
      ]),
    });
  }

  /**
   * Get subscription details
   */
  static async getSubscription(subscriptionId: string): Promise<PayPalSubscription> {
    return await this.makeRequest(`/v1/billing/subscriptions/${subscriptionId}`);
  }

  /**
   * Update subscription
   */
  static async updateSubscription(subscriptionId: string, updates: Array<{ op: string; path: string; value: any }>): Promise<void> {
    await this.makeRequest(`/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: string, reason?: string): Promise<void> {
    await this.makeRequest(`/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({
        reason: reason || 'User requested cancellation',
      }),
    });
  }

  /**
   * Suspend subscription
   */
  static async suspendSubscription(subscriptionId: string, reason?: string): Promise<void> {
    await this.makeRequest(`/v1/billing/subscriptions/${subscriptionId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({
        reason: reason || 'Suspended by admin',
      }),
    });
  }

  /**
   * Create order for one-time payment (lifetime)
   */
  static async createOrder(data: {
    amount: { value: string; currency_code: string };
    description?: string;
    returnUrl: string;
    cancelUrl: string;
  }): Promise<{ id: string; approvalUrl: string }> {
    const order = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: data.amount,
        description: data.description || 'Lifetime subscription',
      }],
      application_context: {
        brand_name: 'Rachid',
        locale: 'pt-BR',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        // PayPal will replace {token} with order ID and {PayerID} with payer ID
        return_url: data.returnUrl,
        cancel_url: data.cancelUrl,
      },
    };

    const result = await this.makeRequest('/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });

    // Find approval URL
    const approvalLink = result.links?.find((link: any) => link.rel === 'approve');
    
    if (!approvalLink) {
      throw new Error('No approval URL found in PayPal response');
    }

    return {
      id: result.id,
      approvalUrl: approvalLink.href,
    };
  }

  /**
   * Capture order payment
   */
  static async captureOrder(orderId: string): Promise<PayPalOrder> {
    return await this.makeRequest(`/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
    });
  }

  /**
   * Verify webhook signature
   */
  static async verifyWebhookSignature(headers: Record<string, string>, body: string): Promise<boolean> {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    
    if (!webhookId) {
      console.warn('PAYPAL_WEBHOOK_ID not set, skipping webhook verification');
      return true; // Allow in development
    }

    const authAlgo = headers['paypal-auth-algo'];
    const transmissionId = headers['paypal-transmission-id'];
    const certUrl = headers['paypal-cert-url'];
    const transmissionSig = headers['paypal-transmission-sig'];
    const transmissionTime = headers['paypal-transmission-time'];

    if (!authAlgo || !transmissionId || !certUrl || !transmissionSig || !transmissionTime) {
      return false;
    }

    try {
      const token = await this.getAccessToken();
      const baseUrl = this.getBaseUrl();

      const verification = {
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      };

      const response = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verification),
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json() as { verification_status?: string };
      return result.verification_status === 'SUCCESS';
    } catch (error) {
      console.error('Webhook verification error:', error);
      return false;
    }
  }

  /**
   * Handle webhook event
   */
  static async handleWebhook(event: any): Promise<void> {
    // This method processes webhook events
    // The actual handling is done in the controller
    // This is just a placeholder for any common processing
    console.log('Processing PayPal webhook event:', event.event_type);
  }
}