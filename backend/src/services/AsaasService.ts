/**
 * AsaasService - Service for interacting with Asaas API v3
 * Handles subscriptions, payments, customers, and webhooks
 * 
 * Requires environment variables:
 * - ASAAS_API_KEY
 * - ASAAS_ENVIRONMENT (sandbox or production)
 * - ASAAS_WEBHOOK_TOKEN (optional, for webhook verification)
 * - MIN_INSTALLMENT_VALUE (minimum installment value)
 */

interface AsaasCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  externalReference?: string;
}

interface AsaasPayment {
  id: string;
  customer: string;
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED';
  value: number;
  netValue?: number;
  originalValue?: number;
  interestValue?: number;
  description?: string;
  dueDate: string;
  installmentCount?: number;
  installmentValue?: number;
  status: 'PENDING' | 'CONFIRMED' | 'RECEIVED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
  paymentDate?: string;
  clientPaymentDate?: string;
  pixTransactionId?: string;
  pixQrCodeId?: string;
  subscription?: string;
}

interface AsaasSubscription {
  id: string;
  customer: string;
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED';
  value: number;
  nextDueDate: string;
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
  endDate?: string;
}

interface AsaasPixQrCode {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

interface AsaasWebhookEvent {
  event: string;
  payment?: AsaasPayment;
  subscription?: AsaasSubscription;
}

export class AsaasService {
  private static getBaseUrl(): string {
    const environment = process.env.ASAAS_ENVIRONMENT || 'sandbox';
    return environment === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://api-sandbox.asaas.com/v3';
  }

  private static getApiKey(): string {
    const apiKey = process.env.ASAAS_API_KEY;
    if (!apiKey) {
      throw new Error('ASAAS_API_KEY must be set');
    }
    return apiKey;
  }

  /**
   * Make authenticated request to Asaas API
   */
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const apiKey = this.getApiKey();

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'Rachid/1.0.0',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[AsaasService] API error ${response.status}:`, error);
      throw new Error(`Asaas API error: ${response.status} ${error}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    return await response.json() as T;
  }

  /**
   * Update customer in Asaas
   */
  static async updateCustomer(customerId: string, data: Partial<AsaasCustomer>): Promise<AsaasCustomer> {
    const customer = await this.makeRequest<AsaasCustomer>(`/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    console.log(`[AsaasService] Updated customer: ${customer.id}`);
    return customer;
  }

  /**
   * Create or find customer in Asaas
   */
  static async createCustomer(data: {
    name: string;
    email?: string;
    phone?: string;
    mobilePhone?: string;
    cpfCnpj?: string;
    postalCode?: string;
    address?: string;
    addressNumber?: string;
    complement?: string;
    province?: string;
    externalReference?: string;
  }): Promise<AsaasCustomer> {
    // Try to find existing customer by CPF/email first
    if (data.cpfCnpj || data.email) {
      try {
        const existing = await this.findCustomer(data.cpfCnpj, data.email);
        if (existing) {
          console.log(`[AsaasService] Found existing customer: ${existing.id}`);
          
          // Se cliente existe mas não tem CPF e estamos fornecendo, atualizar
          if (data.cpfCnpj && !existing.cpfCnpj) {
            console.log(`[AsaasService] Updating customer ${existing.id} with CPF/CNPJ`);
            return await this.updateCustomer(existing.id, { cpfCnpj: data.cpfCnpj });
          }
          
          return existing;
        }
      } catch (error) {
        // Customer not found, continue to create
        console.log('[AsaasService] Customer not found, creating new one...');
      }
    }

    // Create new customer
    const customer = await this.makeRequest<AsaasCustomer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    console.log(`[AsaasService] Created customer: ${customer.id}`);
    return customer;
  }

  /**
   * Find customer by CPF or email
   */
  private static async findCustomer(
    cpfCnpj?: string,
    email?: string
  ): Promise<AsaasCustomer | null> {
    if (!cpfCnpj && !email) {
      return null;
    }

    try {
      const params = new URLSearchParams();
      if (cpfCnpj) params.append('cpfCnpj', cpfCnpj);
      if (email) params.append('email', email);

      const result = await this.makeRequest<{ data: AsaasCustomer[] }>(
        `/customers?${params.toString()}`
      );

      if (result.data && result.data.length > 0) {
        return result.data[0];
      }
    } catch (error) {
      // Customer not found
      return null;
    }

    return null;
  }

  /**
   * Create subscription (recurring payment)
   */
  static async createSubscription(data: {
    customer: string;
    billingType: 'PIX' | 'CREDIT_CARD';
    value: number;
    cycle: 'MONTHLY' | 'YEARLY';
    nextDueDate: string;
    description?: string;
    creditCard?: {
      holderName: string;
      number: string;
      expiryMonth: string;
      expiryYear: string;
      ccv: string;
    };
    creditCardHolderInfo?: {
      name: string;
      email: string;
      cpfCnpj: string;
      postalCode: string;
      addressNumber: string;
      addressComplement?: string;
      phone?: string;
      mobilePhone?: string;
    };
  }): Promise<AsaasSubscription> {
    const payload: any = {
      customer: data.customer,
      billingType: data.billingType,
      value: data.value,
      cycle: data.cycle,
      nextDueDate: data.nextDueDate,
      description: data.description || `Assinatura ${data.cycle}`,
    };

    // Add card data if provided (for CREDIT_CARD)
    if (data.billingType === 'CREDIT_CARD') {
      if (data.creditCard) {
        payload.creditCard = data.creditCard;
      }
      if (data.creditCardHolderInfo) {
        payload.creditCardHolderInfo = data.creditCardHolderInfo;
        payload.remoteIp = '127.0.0.1'; // Should be actual client IP
      }
    }

    const subscription = await this.makeRequest<AsaasSubscription>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    console.log(`[AsaasService] Created subscription: ${subscription.id}`);
    return subscription;
  }

  /**
   * Create one-time payment
   */
  static async createPayment(data: {
    customer: string;
    billingType: 'PIX' | 'CREDIT_CARD';
    value: number;
    dueDate: string;
    description?: string;
    installmentCount?: number;
    installmentValue?: number;
    creditCard?: {
      holderName: string;
      number: string;
      expiryMonth: string;
      expiryYear: string;
      ccv: string;
    };
    creditCardHolderInfo?: {
      name: string;
      email: string;
      cpfCnpj: string;
      postalCode: string;
      addressNumber: string;
      addressComplement?: string;
      phone?: string;
      mobilePhone?: string;
    };
  }): Promise<AsaasPayment> {
    const payload: any = {
      customer: data.customer,
      billingType: data.billingType,
      value: data.value,
      dueDate: data.dueDate,
      description: data.description || 'Pagamento',
    };

    // Add installment data if provided
    if (data.installmentCount && data.installmentCount > 1) {
      payload.installmentCount = data.installmentCount;
      payload.installmentValue = data.installmentValue;
    }

    // Add card data if provided (for CREDIT_CARD)
    if (data.billingType === 'CREDIT_CARD') {
      if (data.creditCard) {
        payload.creditCard = data.creditCard;
      }
      if (data.creditCardHolderInfo) {
        payload.creditCardHolderInfo = data.creditCardHolderInfo;
        payload.remoteIp = '127.0.0.1'; // Should be actual client IP
      }
    }

    const payment = await this.makeRequest<AsaasPayment>('/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    console.log(`[AsaasService] Created payment: ${payment.id}`);
    return payment;
  }

  /**
   * Get PIX QR Code for payment
   */
  static async getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
    const qrCode = await this.makeRequest<AsaasPixQrCode>(
      `/payments/${paymentId}/pixQrCode`
    );

    return qrCode;
  }

  /**
   * Get payment status
   */
  static async getPaymentStatus(paymentId: string): Promise<AsaasPayment> {
    const payment = await this.makeRequest<AsaasPayment>(`/payments/${paymentId}`);
    return payment;
  }

  /**
   * Get subscription status
   */
  static async getSubscriptionStatus(subscriptionId: string): Promise<AsaasSubscription> {
    const subscription = await this.makeRequest<AsaasSubscription>(
      `/subscriptions/${subscriptionId}`
    );
    return subscription;
  }

  /**
   * Get subscription payments
   */
  static async getSubscriptionPayments(subscriptionId: string): Promise<{ data: AsaasPayment[] }> {
    const payments = await this.makeRequest<{ data: AsaasPayment[] }>(
      `/subscriptions/${subscriptionId}/payments`
    );
    return payments;
  }

  /**
   * Cancel payment
   */
  static async cancelPayment(paymentId: string): Promise<void> {
    await this.makeRequest(`/payments/${paymentId}`, {
      method: 'DELETE',
    });
    console.log(`[AsaasService] Canceled payment: ${paymentId}`);
  }

  /**
   * (Apenas sandbox) Confirmar o pagamento de uma cobrança.
   * Simula o recebimento do PIX no ambiente de testes.
   * @see https://docs.asaas.com/reference/confirmar-pagamento
   */
  static async confirmPaymentSandbox(paymentId: string): Promise<void> {
    const env = process.env.ASAAS_ENVIRONMENT || 'sandbox';
    if (env === 'production') {
      throw new Error('confirmPaymentSandbox só está disponível em ambiente sandbox');
    }
    await this.makeRequest(`/sandbox/payment/${paymentId}/confirm`, {
      method: 'POST',
    });
    console.log(`[AsaasService] Sandbox: payment ${paymentId} confirmed`);
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.makeRequest(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    });
    console.log(`[AsaasService] Canceled subscription: ${subscriptionId}`);
  }

  /**
   * Update subscription credit card
   */
  static async updateSubscriptionCard(
    subscriptionId: string,
    creditCard: {
      holderName: string;
      number: string;
      expiryMonth: string;
      expiryYear: string;
      ccv: string;
    },
    creditCardHolderInfo: {
      name: string;
      email: string;
      cpfCnpj: string;
      postalCode: string;
      addressNumber: string;
      addressComplement?: string;
      phone?: string;
      mobilePhone?: string;
    }
  ): Promise<void> {
    await this.makeRequest(`/subscriptions/${subscriptionId}/creditCard`, {
      method: 'PUT',
      body: JSON.stringify({
        creditCard,
        creditCardHolderInfo,
        remoteIp: '127.0.0.1', // Should be actual client IP
      }),
    });
    console.log(`[AsaasService] Updated subscription card: ${subscriptionId}`);
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhook(headers: Record<string, string>): boolean {
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
    
    if (!webhookToken) {
      console.warn('[AsaasService] ASAAS_WEBHOOK_TOKEN not set, skipping webhook verification');
      return true; // Allow in development
    }

    // Asaas sends token in header 'asaas-access-token'
    const receivedToken = headers['asaas-access-token'] || headers['Asaas-Access-Token'];
    
    if (!receivedToken) {
      console.warn('[AsaasService] No webhook token in headers');
      return false;
    }

    const isValid = receivedToken === webhookToken;
    
    if (!isValid) {
      console.warn('[AsaasService] Invalid webhook token');
    }

    return isValid;
  }

  /**
   * Calculate maximum installments based on minimum installment value
   */
  static calculateMaxInstallments(
    totalValue: number,
    minInstallmentValue: number,
    maxInstallments: number = 3
  ): number {
    const calculatedMax = Math.floor(totalValue / minInstallmentValue);
    return Math.min(calculatedMax, maxInstallments);
  }

  /**
   * Calculate installment options
   */
  static calculateInstallmentOptions(
    totalValue: number,
    minInstallmentValue: number,
    maxInstallments: number = 3
  ): Array<{ count: number; value: number; total: number }> {
    const calculatedMax = Math.floor(totalValue / minInstallmentValue);
    const actualMax = Math.min(calculatedMax, maxInstallments);

    const options = [];
    for (let i = 1; i <= actualMax; i++) {
      const installmentValue = parseFloat((totalValue / i).toFixed(2));
      // Validate if installment meets minimum value
      if (installmentValue >= minInstallmentValue) {
        options.push({
          count: i,
          value: installmentValue,
          total: totalValue,
        });
      }
    }
    return options;
  }
}
