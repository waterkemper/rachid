import { AppDataSource } from '../database/data-source';
import { Subscription, SubscriptionStatus, PlanType } from '../entities/Subscription';
import { SubscriptionHistory, EventType } from '../entities/SubscriptionHistory';
import { SubscriptionFeature, FeatureKey } from '../entities/SubscriptionFeature';
import { Usuario } from '../entities/Usuario';
import { PayPalService } from './PayPalService';

export class SubscriptionService {
  private static subscriptionRepository = AppDataSource.getRepository(Subscription);
  private static subscriptionHistoryRepository = AppDataSource.getRepository(SubscriptionHistory);
  private static subscriptionFeatureRepository = AppDataSource.getRepository(SubscriptionFeature);
  private static usuarioRepository = AppDataSource.getRepository(Usuario);

  /**
   * Create a new subscription
   */
  static async createSubscription(data: {
    usuarioId: number;
    planType: PlanType;
    returnUrl: string;
    cancelUrl: string;
  }): Promise<{ subscriptionId: number; approvalUrl: string; paypalSubscriptionId: string }> {
    const usuario = await this.usuarioRepository.findOne({ where: { id: data.usuarioId } });
    if (!usuario) {
      throw new Error('User not found');
    }

    // Check if user already has an active subscription
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: { usuarioId: data.usuarioId, status: 'ACTIVE' },
    });

    if (existingSubscription) {
      throw new Error('User already has an active subscription');
    }

    // Get PayPal plan ID based on plan type
    const paypalPlanId = this.getPayPalPlanId(data.planType);
    if (!paypalPlanId) {
      throw new Error(`PayPal plan ID not configured for plan type: ${data.planType}`);
    }

    // Create subscription in PayPal
    const paypalResult = await PayPalService.createSubscription({
      planId: paypalPlanId,
      returnUrl: data.returnUrl,
      cancelUrl: data.cancelUrl,
    });

    // Calculate period dates
    const now = new Date();
    const periodStart = now;
    let periodEnd: Date | undefined;

    if (data.planType === 'MONTHLY') {
      periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else if (data.planType === 'YEARLY') {
      periodEnd = new Date(now);
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }
    // LIFETIME has no end date

    // Create subscription in database
    const subscription = this.subscriptionRepository.create({
      usuarioId: data.usuarioId,
      paypalSubscriptionId: paypalResult.id,
      planType: data.planType,
      status: 'APPROVAL_PENDING',
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    });

    const savedSubscription = await this.subscriptionRepository.save(subscription);

    // Create history entry
    await this.createHistoryEntry({
      subscriptionId: savedSubscription.id,
      eventType: 'created',
      newValue: savedSubscription,
    });

    // Link subscription to user
    usuario.subscriptionId = savedSubscription.id;
    await this.usuarioRepository.save(usuario);

    return {
      subscriptionId: savedSubscription.id,
      approvalUrl: paypalResult.approvalUrl,
      paypalSubscriptionId: paypalResult.id,
    };
  }

  /**
   * Get subscription by PayPal subscription ID
   */
  static async getSubscriptionByPayPalId(paypalSubscriptionId: string): Promise<Subscription | null> {
    return await this.subscriptionRepository.findOne({
      where: { paypalSubscriptionId },
    });
  }

  /**
   * Activate subscription after PayPal approval
   */
  static async activateSubscription(subscriptionId: number, baToken: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({ where: { id: subscriptionId } });
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (!subscription.paypalSubscriptionId) {
      throw new Error('PayPal subscription ID not found');
    }

    // Get updated subscription from PayPal (should be ACTIVE after user approval)
    const paypalSubscription = await PayPalService.getSubscription(subscription.paypalSubscriptionId);

    // Update in database
    const oldStatus = subscription.status;
    subscription.status = this.mapPayPalStatus(paypalSubscription.status);
    
    // Extract payer ID from PayPal subscription if available
    if (paypalSubscription.subscriber?.payer_id) {
      subscription.paypalPayerId = paypalSubscription.subscriber.payer_id;
    } else {
      subscription.paypalPayerId = baToken; // Fallback to ba_token
    }
    
    if (subscription.status === 'ACTIVE') {
      // Set next billing time based on plan type
      if (subscription.planType === 'MONTHLY') {
        const nextBilling = new Date();
        nextBilling.setMonth(nextBilling.getMonth() + 1);
        subscription.nextBillingTime = nextBilling;
      } else if (subscription.planType === 'YEARLY') {
        const nextBilling = new Date();
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
        subscription.nextBillingTime = nextBilling;
      }
    }

    const updatedSubscription = await this.subscriptionRepository.save(subscription);

    // Create history entry
    await this.createHistoryEntry({
      subscriptionId: updatedSubscription.id,
      eventType: 'activated',
      oldValue: { status: oldStatus },
      newValue: { status: updatedSubscription.status },
    });

    // Update user plan
    await this.updateUserPlan(updatedSubscription);

    return updatedSubscription;
  }

  /**
   * Update subscription (upgrade/downgrade)
   */
  static async updateSubscription(subscriptionId: number, newPlanType: PlanType): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({ where: { id: subscriptionId } });
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const oldPlanType = subscription.planType;

    // Update in PayPal if not lifetime
    if (subscription.paypalSubscriptionId && subscription.planType !== 'LIFETIME') {
      const newPaypalPlanId = this.getPayPalPlanId(newPlanType);
      if (newPaypalPlanId) {
        await PayPalService.updateSubscription(subscription.paypalSubscriptionId, [
          {
            op: 'replace',
            path: '/plan_id',
            value: newPaypalPlanId,
          },
        ]);
      }
    }

    // Update in database
    subscription.planType = newPlanType;

    // Recalculate period end if needed
    if (newPlanType === 'MONTHLY' || newPlanType === 'YEARLY') {
      const now = new Date();
      if (newPlanType === 'MONTHLY') {
        subscription.currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      } else {
        subscription.currentPeriodEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      }
    } else {
      subscription.currentPeriodEnd = undefined;
    }

    const updatedSubscription = await this.subscriptionRepository.save(subscription);

    // Create history entry
    await this.createHistoryEntry({
      subscriptionId: updatedSubscription.id,
      eventType: 'updated',
      oldValue: { planType: oldPlanType },
      newValue: { planType: newPlanType },
    });

    // Update user plan
    await this.updateUserPlan(updatedSubscription);

    return updatedSubscription;
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: number, immediately: boolean = false): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({ where: { id: subscriptionId } });
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (immediately && subscription.paypalSubscriptionId) {
      // Cancel immediately in PayPal
      await PayPalService.cancelSubscription(subscription.paypalSubscriptionId);
      subscription.status = 'CANCELLED';
      subscription.canceledAt = new Date();
    } else {
      // Cancel at period end
      subscription.cancelAtPeriodEnd = true;
    }

    const updatedSubscription = await this.subscriptionRepository.save(subscription);

    // Create history entry
    await this.createHistoryEntry({
      subscriptionId: updatedSubscription.id,
      eventType: 'canceled',
      newValue: { canceled: true, immediately },
    });

    return updatedSubscription;
  }

  /**
   * Suspend subscription
   */
  static async suspendSubscription(subscriptionId: number): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({ where: { id: subscriptionId } });
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.paypalSubscriptionId) {
      await PayPalService.suspendSubscription(subscription.paypalSubscriptionId);
    }

    subscription.status = 'SUSPENDED';
    const updatedSubscription = await this.subscriptionRepository.save(subscription);

    // Create history entry
    await this.createHistoryEntry({
      subscriptionId: updatedSubscription.id,
      eventType: 'suspended',
      newValue: { status: 'SUSPENDED' },
    });

    await this.updateUserPlan(updatedSubscription);

    return updatedSubscription;
  }

  /**
   * Resume subscription
   */
  static async resumeSubscription(subscriptionId: number): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({ where: { id: subscriptionId } });
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Re-activate in PayPal if needed
    if (subscription.paypalSubscriptionId) {
      // PayPal doesn't have a direct "resume" API, so we update the subscription
      const paypalSubscription = await PayPalService.getSubscription(subscription.paypalSubscriptionId);
      subscription.status = this.mapPayPalStatus(paypalSubscription.status);
    } else {
      subscription.status = 'ACTIVE';
    }

    subscription.cancelAtPeriodEnd = false;
    const updatedSubscription = await this.subscriptionRepository.save(subscription);

    // Create history entry
    await this.createHistoryEntry({
      subscriptionId: updatedSubscription.id,
      eventType: 'updated',
      newValue: { status: updatedSubscription.status, resumed: true },
    });

    await this.updateUserPlan(updatedSubscription);

    return updatedSubscription;
  }

  /**
   * Get user's active subscription
   */
  static async getSubscription(usuarioId: number): Promise<Subscription | null> {
    return await this.subscriptionRepository.findOne({
      where: { usuarioId },
      relations: ['features'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Sync subscription from PayPal webhook
   */
  static async syncPayPalSubscription(paypalSubscriptionId: string, paypalEvent: any): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { paypalSubscriptionId },
    });

    if (!subscription) {
      throw new Error(`Subscription not found for PayPal ID: ${paypalSubscriptionId}`);
    }

    // Get latest from PayPal
    const paypalSubscription = await PayPalService.getSubscription(paypalSubscriptionId);

    const oldStatus = subscription.status;
    subscription.status = this.mapPayPalStatus(paypalSubscription.status);

    // Update billing info if available
    if (paypalSubscription.billing_info) {
      if (paypalSubscription.billing_info.next_billing_time) {
        subscription.nextBillingTime = new Date(paypalSubscription.billing_info.next_billing_time);
      }
    }

    const updatedSubscription = await this.subscriptionRepository.save(subscription);

    // Create history entry
    await this.createHistoryEntry({
      subscriptionId: updatedSubscription.id,
      eventType: this.mapPayPalEventType(paypalEvent.event_type),
      paypalEventId: paypalEvent.id,
      paypalResourceId: paypalSubscriptionId,
      newValue: { status: updatedSubscription.status },
      metadata: paypalEvent,
    });

    await this.updateUserPlan(updatedSubscription);

    return updatedSubscription;
  }

  /**
   * Apply lifetime promo code and create lifetime subscription
   */
  static async applyLifetimePromo(usuarioId: number, promoCode: string, orderId: string): Promise<Subscription> {
    // This will be handled by the lifetime purchase flow
    // For now, create a lifetime subscription directly
    const usuario = await this.usuarioRepository.findOne({ where: { id: usuarioId } });
    if (!usuario) {
      throw new Error('User not found');
    }

    const now = new Date();

    const subscription = this.subscriptionRepository.create({
      usuarioId,
      planType: 'LIFETIME',
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: undefined, // Never expires
      cancelAtPeriodEnd: false,
    });

    const savedSubscription = await this.subscriptionRepository.save(subscription);

    // Update user
    usuario.subscriptionId = savedSubscription.id;
    usuario.plano = 'LIFETIME';
    usuario.planoValidoAte = undefined;
    await this.usuarioRepository.save(usuario);

    // Enable all features
    await this.enableProFeatures(savedSubscription.id);

    return savedSubscription;
  }

  /**
   * Check if user has feature access
   */
  static async checkFeatureAccess(usuarioId: number, featureKey: FeatureKey): Promise<boolean> {
    const subscription = await this.getSubscription(usuarioId);
    if (!subscription || subscription.status !== 'ACTIVE') {
      return false;
    }

    // For lifetime and active subscriptions, check feature
    if (subscription.planType === 'LIFETIME' || subscription.planType === 'MONTHLY' || subscription.planType === 'YEARLY') {
      const feature = await this.subscriptionFeatureRepository.findOne({
        where: { subscriptionId: subscription.id, featureKey },
      });
      return feature?.enabled ?? false;
    }

    return false;
  }

  /**
   * Get usage limits for user
   */
  static async getUsageLimits(usuarioId: number): Promise<Record<string, any>> {
    const subscription = await this.getSubscription(usuarioId);
    
    if (!subscription) {
      // Return FREE plan limits (will be handled by FeatureService)
      return {};
    }

    // This will be enhanced by FeatureService
    return {
      subscriptionId: subscription.id,
      planType: subscription.planType,
      status: subscription.status,
    };
  }

  /**
   * Helper: Create history entry
   */
  private static async createHistoryEntry(data: {
    subscriptionId: number;
    eventType: EventType;
    oldValue?: any;
    newValue?: any;
    paypalEventId?: string;
    paypalResourceId?: string;
    metadata?: any;
  }): Promise<SubscriptionHistory> {
    const history = this.subscriptionHistoryRepository.create({
      subscriptionId: data.subscriptionId,
      eventType: data.eventType,
      oldValue: data.oldValue,
      newValue: data.newValue,
      paypalEventId: data.paypalEventId,
      paypalResourceId: data.paypalResourceId,
      metadata: data.metadata,
    });

    return await this.subscriptionHistoryRepository.save(history);
  }

  /**
   * Helper: Update user plan based on subscription
   */
  private static async updateUserPlan(subscription: Subscription): Promise<void> {
    const usuario = await this.usuarioRepository.findOne({ where: { id: subscription.usuarioId } });
    if (!usuario) return;

    if (subscription.status === 'ACTIVE') {
      if (subscription.planType === 'LIFETIME') {
        usuario.plano = 'LIFETIME';
        usuario.planoValidoAte = undefined;
      } else {
        usuario.plano = 'PRO';
        usuario.planoValidoAte = subscription.currentPeriodEnd;
      }

      // Enable features
      await this.enableProFeatures(subscription.id);
    } else {
      // Downgrade to FREE
      usuario.plano = 'FREE';
      usuario.planoValidoAte = undefined;
    }

    usuario.subscriptionId = subscription.id;
    await this.usuarioRepository.save(usuario);
  }

  /**
   * Helper: Enable PRO features for subscription
   */
  private static async enableProFeatures(subscriptionId: number): Promise<void> {
    const features: FeatureKey[] = [
      'unlimited_events',
      'unlimited_participants',
      'pdf_export',
      'public_sharing',
      'templates',
      'email_notifications',
      'analytics',
    ];

    for (const featureKey of features) {
      const existing = await this.subscriptionFeatureRepository.findOne({
        where: { subscriptionId, featureKey },
      });

      if (existing) {
        existing.enabled = true;
        await this.subscriptionFeatureRepository.save(existing);
      } else {
        const feature = this.subscriptionFeatureRepository.create({
          subscriptionId,
          featureKey,
          enabled: true,
        });
        await this.subscriptionFeatureRepository.save(feature);
      }
    }
  }

  /**
   * Helper: Get PayPal plan ID from plan type
   */
  private static getPayPalPlanId(planType: PlanType): string | null {
    if (planType === 'MONTHLY') {
      return process.env.PAYPAL_PLAN_ID_MONTHLY || null;
    } else if (planType === 'YEARLY') {
      return process.env.PAYPAL_PLAN_ID_YEARLY || null;
    }
    return null; // LIFETIME doesn't use PayPal subscriptions
  }

  /**
   * Helper: Map PayPal status to our status
   */
  private static mapPayPalStatus(paypalStatus: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      'APPROVAL_PENDING': 'APPROVAL_PENDING',
      'APPROVED': 'APPROVED',
      'ACTIVE': 'ACTIVE',
      'SUSPENDED': 'SUSPENDED',
      'CANCELLED': 'CANCELLED',
      'EXPIRED': 'EXPIRED',
    };

    return statusMap[paypalStatus.toUpperCase()] || 'APPROVAL_PENDING';
  }

  /**
   * Helper: Map PayPal event type to our event type
   */
  private static mapPayPalEventType(paypalEventType: string): EventType {
    if (paypalEventType.includes('CREATED')) return 'created';
    if (paypalEventType.includes('UPDATED')) return 'updated';
    if (paypalEventType.includes('CANCELLED')) return 'canceled';
    if (paypalEventType.includes('SUSPENDED')) return 'suspended';
    if (paypalEventType.includes('ACTIVATED')) return 'activated';
    if (paypalEventType.includes('PAYMENT') && paypalEventType.includes('FAILED')) return 'payment_failed';
    if (paypalEventType.includes('REFUNDED')) return 'refunded';
    return 'updated';
  }
}