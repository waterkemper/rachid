import { AppDataSource } from '../database/data-source';
import { Subscription, SubscriptionStatus, PlanType } from '../entities/Subscription';
import { SubscriptionHistory, EventType } from '../entities/SubscriptionHistory';
import { SubscriptionFeature, FeatureKey } from '../entities/SubscriptionFeature';
import { Usuario } from '../entities/Usuario';
import { Plan } from '../entities/Plan';
import { PayPalService } from './PayPalService';
import { EmailService } from './EmailService';
import { Email } from '../entities/Email';

export class SubscriptionService {
  private static subscriptionRepository = AppDataSource.getRepository(Subscription);
  private static subscriptionHistoryRepository = AppDataSource.getRepository(SubscriptionHistory);
  private static subscriptionFeatureRepository = AppDataSource.getRepository(SubscriptionFeature);
  private static usuarioRepository = AppDataSource.getRepository(Usuario);
  private static planRepository = AppDataSource.getRepository(Plan);
  
  // Cache for last sync time per subscription to prevent excessive API calls
  // Format: { paypalSubscriptionId: timestamp }
  private static lastSyncCache: Map<string, number> = new Map();
  private static readonly SYNC_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
    const existingActiveSubscription = await this.subscriptionRepository.findOne({
      where: { usuarioId: data.usuarioId, status: 'ACTIVE' },
    });

    if (existingActiveSubscription) {
      throw new Error('User already has an active subscription');
    }

    // Check for pending subscriptions that might need activation
    const pendingSubscription = await this.subscriptionRepository.findOne({
      where: { usuarioId: data.usuarioId, status: 'APPROVAL_PENDING' },
      order: { createdAt: 'DESC' },
    });

    if (pendingSubscription && pendingSubscription.paypalSubscriptionId) {
      // Try to activate the pending subscription first
      try {
        console.log(`[SubscriptionService] Found pending subscription ${pendingSubscription.paypalSubscriptionId}, attempting to activate...`);
        const paypalSubscription = await PayPalService.getSubscription(pendingSubscription.paypalSubscriptionId);
        const paypalStatus = this.mapPayPalStatus(paypalSubscription.status);
        
        if (paypalStatus === 'ACTIVE') {
          console.log(`[SubscriptionService] Pending subscription is ACTIVE in PayPal, activating...`);
          await this.activateSubscription(pendingSubscription.id, paypalSubscription.subscriber?.payer_id || '');
          throw new Error('Pending subscription was activated. Please refresh the page.');
        }
      } catch (error: any) {
        // If activation fails or subscription is not active, continue to create new one
        if (error.message.includes('activated')) {
          throw error; // Re-throw activation success message
        }
        console.log(`[SubscriptionService] Pending subscription cannot be activated, creating new one...`);
      }
    }

    // Get PayPal plan ID based on plan type from database
    const paypalPlanId = await this.getPayPalPlanId(data.planType);
    if (!paypalPlanId) {
      throw new Error(`PayPal plan ID not configured for plan type: ${data.planType}`);
    }

    // Log plan ID being used (for debugging)
    const paypalMode = process.env.PAYPAL_MODE || 'sandbox';
    console.log(`[SubscriptionService] Creating subscription with Plan ID: ${paypalPlanId} (Mode: ${paypalMode})`);

    // Create subscription in PayPal
    const paypalResult = await PayPalService.createSubscription({
      planId: paypalPlanId,
      returnUrl: data.returnUrl,
      cancelUrl: data.cancelUrl,
      subscriberEmail: usuario.email, // Pass user email to PayPal
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
    
    console.log(`[SubscriptionService] Activating subscription ${subscription.paypalSubscriptionId}, PayPal status: ${paypalSubscription.status}`);
    console.log(`[SubscriptionService] PayPal subscription details:`, {
      id: paypalSubscription.id,
      status: paypalSubscription.status,
      hasBillingInfo: !!paypalSubscription.billing_info,
      nextBillingTime: paypalSubscription.billing_info?.next_billing_time,
      hasSubscriber: !!paypalSubscription.subscriber,
      payerId: paypalSubscription.subscriber?.payer_id,
    });

    // Update in database
    const oldStatus = subscription.status;
    const paypalStatus = this.mapPayPalStatus(paypalSubscription.status);
    
    // If PayPal says EXPIRED but we have ba_token (user just approved), this is a problem
    // The subscription might have expired before approval, or there's a sync issue
    if (paypalStatus === 'EXPIRED' && baToken) {
      console.warn(`[SubscriptionService] ⚠️ PayPal subscription ${subscription.paypalSubscriptionId} is EXPIRED but user provided ba_token.`);
      console.warn(`[SubscriptionService] This usually means the subscription expired before user could approve it.`);
      
        // Check if subscription was just created (within last 48 hours)
        const hoursSinceCreation = (Date.now() - subscription.createdAt.getTime()) / (1000 * 60 * 60);
        const minutesSinceCreation = (Date.now() - subscription.createdAt.getTime()) / (1000 * 60);
        
        console.log(`[SubscriptionService] Subscription was created ${hoursSinceCreation.toFixed(2)} hours ago (${minutesSinceCreation.toFixed(1)} minutes).`);
        
        // If subscription was created very recently (less than 1 hour), this is likely a timing issue
        // PayPal might not have updated the status yet, or the start_time calculation was wrong
        if (hoursSinceCreation < 1) {
          console.warn(`[SubscriptionService] ⚠️ Subscription expired within 1 hour of creation - this is unusual.`);
          console.warn(`[SubscriptionService] This might be a PayPal timing issue. Waiting 5 seconds and retrying...`);
          
          // Wait longer and retry - PayPal might need time to process
          try {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            const retrySubscription = await PayPalService.getSubscription(subscription.paypalSubscriptionId);
            const retryStatus = this.mapPayPalStatus(retrySubscription.status);
            console.log(`[SubscriptionService] Retry check: PayPal status is now ${retryStatus}`);
            
            if (retryStatus === 'ACTIVE') {
              console.log(`[SubscriptionService] ✅ Status updated to ACTIVE on retry!`);
              subscription.status = 'ACTIVE';
            } else {
              // Still EXPIRED - check if it's really expired or if we need to wait more
              console.warn(`[SubscriptionService] ⚠️ Still EXPIRED after retry. This might be a PayPal issue.`);
              throw new Error(`Assinatura expirou no PayPal antes de ser aprovada. O tempo limite para aprovação foi excedido. Por favor, crie uma nova assinatura.`);
            }
          } catch (retryError: any) {
            if (retryError.message.includes('Assinatura expirou')) {
              throw retryError;
            }
            throw new Error(`Assinatura expirou no PayPal antes de ser aprovada. Status: ${paypalSubscription.status}. Por favor, crie uma nova assinatura.`);
          }
        } else if (hoursSinceCreation < 48) {
          console.log(`[SubscriptionService] PayPal may have expired it because start_time passed before approval.`);
          throw new Error(`Assinatura expirou no PayPal antes de ser aprovada. O tempo limite para aprovação foi excedido. Por favor, crie uma nova assinatura.`);
        } else {
          throw new Error(`Assinatura expirou no PayPal. Status: ${paypalSubscription.status}. Por favor, crie uma nova assinatura.`);
        }
    } else {
      subscription.status = paypalStatus;
    }
    
    // Extract payer ID from PayPal subscription if available
    if (paypalSubscription.subscriber?.payer_id) {
      subscription.paypalPayerId = paypalSubscription.subscriber.payer_id;
    } else {
      subscription.paypalPayerId = baToken; // Fallback to ba_token
    }
    
    // Update period dates from PayPal if available
    if (paypalSubscription.billing_info) {
      if (paypalSubscription.billing_info.next_billing_time) {
        subscription.nextBillingTime = new Date(paypalSubscription.billing_info.next_billing_time);
      }
      
      // Update period end based on next billing time
      if (subscription.nextBillingTime) {
        subscription.currentPeriodEnd = subscription.nextBillingTime;
        // Calculate period start based on plan type
        if (subscription.planType === 'MONTHLY') {
          const start = new Date(subscription.nextBillingTime);
          start.setMonth(start.getMonth() - 1);
          subscription.currentPeriodStart = start;
        } else if (subscription.planType === 'YEARLY') {
          const start = new Date(subscription.nextBillingTime);
          start.setFullYear(start.getFullYear() - 1);
          subscription.currentPeriodStart = start;
        }
      }
    } else if (subscription.status === 'ACTIVE') {
      // Fallback: Set next billing time based on plan type if not in PayPal response
      const now = new Date();
      if (subscription.planType === 'MONTHLY') {
        const nextBilling = new Date(now);
        nextBilling.setMonth(nextBilling.getMonth() + 1);
        subscription.nextBillingTime = nextBilling;
        subscription.currentPeriodEnd = nextBilling;
        subscription.currentPeriodStart = now;
      } else if (subscription.planType === 'YEARLY') {
        const nextBilling = new Date(now);
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
        subscription.nextBillingTime = nextBilling;
        subscription.currentPeriodEnd = nextBilling;
        subscription.currentPeriodStart = now;
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
      const newPaypalPlanId = await this.getPayPalPlanId(newPlanType);
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
   * Automatically syncs with PayPal if status is APPROVAL_PENDING or EXPIRED
   * CRITICAL: Also syncs if local is ACTIVE but PayPal is EXPIRED (inconsistency fix)
   */
  static async getSubscription(usuarioId: number): Promise<Subscription | null> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { usuarioId },
      relations: ['features'],
      order: { createdAt: 'DESC' },
    });

    // Auto-sync if subscription is pending approval or needs payer ID
    // CRITICAL: Also sync if local is ACTIVE but PayPal might be EXPIRED (inconsistency)
    // This ensures we always have the latest status from PayPal
    if (subscription && subscription.paypalSubscriptionId) {
      const now = Date.now();
      const lastSyncTime = this.lastSyncCache.get(subscription.paypalSubscriptionId) || 0;
      const timeSinceLastSync = now - lastSyncTime;
      
      // Determine if we need to sync:
      // 1. Pending approval (always sync - might have been activated)
      // 2. Missing payer ID (always sync - might have been activated)
      // 3. ACTIVE but expired (always sync - needs immediate update)
      // 4. ACTIVE but cache expired (sync only if cache TTL passed - prevents excessive calls)
      const isPending = subscription.status === 'APPROVAL_PENDING';
      const needsPayerId = !subscription.paypalPayerId && subscription.status !== 'CANCELLED';
      const isExpired = subscription.status === 'ACTIVE' && subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) < new Date();
      const cacheExpired = subscription.status === 'ACTIVE' && timeSinceLastSync > this.SYNC_CACHE_TTL;
      
      const needsSync = isPending || needsPayerId || isExpired || cacheExpired;
      
      if (needsSync) {
        try {
          console.log(`[SubscriptionService] 🔄 Auto-syncing subscription ${subscription.paypalSubscriptionId} for user ${usuarioId} (current status: ${subscription.status})`);
          
          // Update cache before making API call
          this.lastSyncCache.set(subscription.paypalSubscriptionId, now);
          
          const paypalSubscription = await PayPalService.getSubscription(subscription.paypalSubscriptionId);
          const paypalStatus = this.mapPayPalStatus(paypalSubscription.status);
          
          console.log(`[SubscriptionService] 📊 PayPal status: ${paypalSubscription.status} -> mapped to: ${paypalStatus}`);
          
          // CRITICAL: Always sync if PayPal shows ACTIVE but local doesn't (this fixes EXPIRED when PayPal is ACTIVE)
          // CRITICAL: Also sync if local is ACTIVE but PayPal is EXPIRED (inconsistency fix)
          // Also sync if status is different
          const shouldSync = paypalStatus !== subscription.status || 
                            (paypalStatus === 'ACTIVE' && subscription.status !== 'ACTIVE') ||
                            (subscription.status === 'ACTIVE' && paypalStatus === 'EXPIRED'); // Catch inconsistency
          
          if (shouldSync) {
            console.log(`[SubscriptionService] ✅ Status mismatch detected! Syncing from ${subscription.status} to ${paypalStatus}...`);
            const syncedSubscription = await this.syncPayPalSubscription(subscription.paypalSubscriptionId);
            console.log(`[SubscriptionService] ✅ Subscription synced successfully! New status: ${syncedSubscription.status}`);
            
            // If sync resulted in EXPIRED but user has payment, update user plan
            if (syncedSubscription.status === 'EXPIRED') {
              await this.updateUserPlan(syncedSubscription);
            }
            
            return syncedSubscription;
          } else {
            // Status matches, but update payer ID if missing
            if (!subscription.paypalPayerId && paypalSubscription.subscriber?.payer_id) {
              subscription.paypalPayerId = paypalSubscription.subscriber.payer_id;
              await this.subscriptionRepository.save(subscription);
              console.log(`[SubscriptionService] ✅ Updated payer ID for subscription ${subscription.paypalSubscriptionId}`);
            }
            console.log(`[SubscriptionService] ℹ️ Status matches PayPal (${paypalStatus}), no sync needed`);
          }
        } catch (error: any) {
          // Don't fail if sync fails, just log
          console.error(`[SubscriptionService] ❌ Failed to auto-sync subscription: ${error.message}`);
          if (error.stack) {
            console.error(`[SubscriptionService] Error stack:`, error.stack);
          }
          // Remove from cache on error so we can retry next time
          this.lastSyncCache.delete(subscription.paypalSubscriptionId);
        }
      } else if (subscription.status === 'ACTIVE') {
        // Cache hit - skip sync but log for debugging
        console.log(`[SubscriptionService] ⏭️ Skipping auto-sync for ACTIVE subscription ${subscription.paypalSubscriptionId} (cached, last sync ${Math.round(timeSinceLastSync / 1000)}s ago)`);
      }
    } else if (subscription && !subscription.paypalSubscriptionId) {
      console.log(`[SubscriptionService] ⚠️ Subscription found but no PayPal ID for user ${usuarioId}`);
    }

    return subscription;
  }

  /**
   * Verifica assinaturas próximas do vencimento e envia emails de aviso
   * Busca assinaturas que expiram em 3 dias e envia email se ainda não foi enviado
   */
  static async verificarVencimentosProximos(diasAntecedencia: number = 3): Promise<number> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Data de vencimento alvo (diasAntecedencia dias a partir de hoje)
    const dataVencimento = new Date(hoje);
    dataVencimento.setDate(hoje.getDate() + diasAntecedencia);
    dataVencimento.setHours(23, 59, 59, 999);

    // Buscar assinaturas que expiram entre hoje e dataVencimento
    // e que estão ACTIVE e não são LIFETIME
    const assinaturasProximasVencimento = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .where('subscription.status = :status', { status: 'ACTIVE' })
      .andWhere('subscription.planType IN (:...planTypes)', { planTypes: ['MONTHLY', 'YEARLY'] })
      .andWhere('subscription.currentPeriodEnd IS NOT NULL')
      .andWhere('subscription.currentPeriodEnd >= :hoje', { hoje })
      .andWhere('subscription.currentPeriodEnd <= :dataVencimento', { dataVencimento })
      .getMany();

    let emailsEnviados = 0;
    const emailRepository = AppDataSource.getRepository(Email);
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(hoje.getDate() - 7);

    for (const subscription of assinaturasProximasVencimento) {
      try {
        // Verificar se já foi enviado email de vencimento próximo recentemente
        const emailJaEnviado = await emailRepository
          .createQueryBuilder('email')
          .where('email.usuarioId = :usuarioId', { usuarioId: subscription.usuarioId })
          .andWhere('email.tipoEmail = :tipoEmail', { tipoEmail: 'vencimento-proximo' })
          .andWhere('email.status = :status', { status: 'enviado' })
          .andWhere('email.enviadoEm >= :seteDiasAtras', { seteDiasAtras })
          .orderBy('email.enviadoEm', 'DESC')
          .getOne();

        if (emailJaEnviado) {
          // Já foi enviado recentemente, pular
          continue;
        }

        // Calcular dias restantes
        const diasRestantes = Math.ceil(
          (subscription.currentPeriodEnd!.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diasRestantes > 0 && diasRestantes <= diasAntecedencia) {
          // Enviar email de vencimento próximo
          await EmailService.enviarEmailVencimentoProximo(
            subscription.usuarioId,
            subscription.planType,
            subscription.currentPeriodEnd!,
            diasRestantes
          );

          emailsEnviados++;
        }
      } catch (error: any) {
        console.error(
          `Erro ao processar aviso de vencimento para assinatura ${subscription.id}:`,
          error
        );
        // Continuar com próxima assinatura mesmo se houver erro
      }
    }

    if (emailsEnviados > 0) {
      console.log(`📧 ${emailsEnviados} email(s) de vencimento próximo enviado(s)`);
    }

    return emailsEnviados;
  }

  /**
   * Sync subscription from PayPal webhook
   */
  static async syncPayPalSubscription(paypalSubscriptionId: string, paypalEvent?: any): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { paypalSubscriptionId },
    });

    if (!subscription) {
      throw new Error(`Subscription not found for PayPal ID: ${paypalSubscriptionId}`);
    }

    // Get latest from PayPal
    const paypalSubscription = await PayPalService.getSubscription(paypalSubscriptionId);
    
    console.log(`[SubscriptionService] Syncing subscription ${paypalSubscriptionId}: PayPal status = ${paypalSubscription.status}, Local status = ${subscription.status}`);
    console.log(`[SubscriptionService] PayPal subscription details:`, {
      id: paypalSubscription.id,
      status: paypalSubscription.status,
      hasBillingInfo: !!paypalSubscription.billing_info,
      nextBillingTime: paypalSubscription.billing_info?.next_billing_time,
      hasSubscriber: !!paypalSubscription.subscriber,
      payerId: paypalSubscription.subscriber?.payer_id,
    });

    const oldStatus = subscription.status;
    const paypalStatus = this.mapPayPalStatus(paypalSubscription.status);
    
    // CRITICAL: If PayPal says ACTIVE but local says EXPIRED, this is a sync issue - force update to ACTIVE
    if (paypalStatus === 'ACTIVE' && subscription.status === 'EXPIRED') {
      console.warn(`[SubscriptionService] ⚠️ CRITICAL: PayPal shows ACTIVE but local shows EXPIRED for ${paypalSubscriptionId}. This is a sync issue - forcing update to ACTIVE.`);
      subscription.status = 'ACTIVE';
    } else if (paypalStatus === 'EXPIRED' && subscription.status === 'ACTIVE') {
      // CRITICAL: Local says ACTIVE but PayPal says EXPIRED - this is a serious inconsistency
      // Check if payment was processed before marking as EXPIRED
      console.error(`[SubscriptionService] 🚨 CRITICAL INCONSISTENCY: Local subscription ${subscription.id} is ACTIVE but PayPal ${paypalSubscriptionId} is EXPIRED!`);
      console.log(`[SubscriptionService] Checking if payment was processed...`);
      
      let paymentWasProcessed = false;
      let paymentDetails: any = null;
      
      try {
        // Check transactions to see if payment was made
        const endTime = new Date().toISOString();
        const startTime = new Date(subscription.createdAt.getTime() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours before creation
        const transactions = await PayPalService.getSubscriptionTransactions(paypalSubscriptionId, startTime, endTime);
        
        console.log(`[SubscriptionService] Transactions found:`, JSON.stringify(transactions, null, 2));
        
        // Check if there are any completed transactions
        if (transactions && Array.isArray(transactions) && transactions.length > 0) {
          const completedPayments = transactions.filter((t: any) => 
            t.status === 'COMPLETED' || t.status === 'SUCCESS' || t.transaction_status === 'S' || 
            (t.amount && (t.amount.value !== '0.00' && t.amount.value !== '0'))
          );
          
          if (completedPayments.length > 0) {
            paymentWasProcessed = true;
            paymentDetails = completedPayments[0];
            console.warn(`[SubscriptionService] ⚠️💳 PAYMENT WAS PROCESSED (${completedPayments.length} transaction(s)) but subscription is EXPIRED!`);
            console.warn(`[SubscriptionService] Payment details:`, JSON.stringify(paymentDetails, null, 2));
            console.warn(`[SubscriptionService] This indicates the subscription expired before approval, but payment was captured.`);
            console.warn(`[SubscriptionService] ⚠️ ACTION REQUIRED: User paid but subscription expired. Consider creating new subscription or manual refund.`);
          }
        } else if (paypalSubscription.billing_info?.last_payment) {
          paymentWasProcessed = true;
          paymentDetails = paypalSubscription.billing_info.last_payment;
          console.warn(`[SubscriptionService] ⚠️💳 Last payment found in billing_info:`, JSON.stringify(paymentDetails, null, 2));
          console.warn(`[SubscriptionService] Payment was processed but subscription expired.`);
        }
      } catch (error: any) {
        console.error(`[SubscriptionService] Error checking transactions: ${error.message}`);
      }
      
      // Store payment info in subscription metadata or log for admin review
      if (paymentWasProcessed) {
        console.error(`[SubscriptionService] 🚨 PAYMENT PROCESSED BUT SUBSCRIPTION EXPIRED - Admin action required!`);
        console.error(`[SubscriptionService] User ID: ${subscription.usuarioId}, Subscription ID: ${subscription.id}`);
        console.error(`[SubscriptionService] PayPal Subscription ID: ${paypalSubscriptionId}`);
        console.error(`[SubscriptionService] Payment Details:`, JSON.stringify(paymentDetails, null, 2));
        console.error(`[SubscriptionService] ⚠️ RECOMMENDATION: Create new subscription for user or process manual refund.`);
      }
      
      console.error(`[SubscriptionService] Setting local status to EXPIRED to match PayPal.`);
      subscription.status = 'EXPIRED';
    } else if (paypalStatus === 'EXPIRED' && subscription.paypalPayerId) {
      // If PayPal says EXPIRED but we have a payer ID and it was recently created, check for payments
      const hoursSinceCreation = (Date.now() - subscription.createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreation < 24) {
        console.warn(`[SubscriptionService] ⚠️ Subscription ${paypalSubscriptionId} is EXPIRED in PayPal but was created ${hoursSinceCreation.toFixed(2)} hours ago and has payer ID.`);
        
        // Check if payment was processed
        try {
          const endTime = new Date().toISOString();
          const startTime = new Date(subscription.createdAt.getTime() - 24 * 60 * 60 * 1000).toISOString();
          const transactions = await PayPalService.getSubscriptionTransactions(paypalSubscriptionId, startTime, endTime);
          
          if (transactions && Array.isArray(transactions) && transactions.length > 0) {
            const completedPayments = transactions.filter((t: any) => 
              t.status === 'COMPLETED' || t.status === 'SUCCESS' || t.transaction_status === 'S'
            );
            
            if (completedPayments.length > 0) {
              console.warn(`[SubscriptionService] ⚠️ Payment was processed (${completedPayments.length} transaction(s)) but subscription expired before approval!`);
              console.warn(`[SubscriptionService] User should create a new subscription. Payment may need manual adjustment.`);
            }
          }
        } catch (error: any) {
          console.error(`[SubscriptionService] Error checking transactions: ${error.message}`);
        }
      }
      subscription.status = paypalStatus;
    } else {
      subscription.status = paypalStatus;
    }

    // Update billing info if available
    if (paypalSubscription.billing_info) {
      if (paypalSubscription.billing_info.next_billing_time) {
        subscription.nextBillingTime = new Date(paypalSubscription.billing_info.next_billing_time);
      }
    }

    // Update payer ID if available (only if not already set or different)
    if (paypalSubscription.subscriber?.payer_id) {
      const newPayerId = paypalSubscription.subscriber.payer_id;
      // Only update if different or not set, and check if it would cause duplicate
      if (newPayerId && newPayerId !== subscription.paypalPayerId) {
        // Check if another subscription already has this payer_id
        const existingWithPayerId = await this.subscriptionRepository.findOne({
          where: { paypalPayerId: newPayerId },
        });
        
        // Only update if no other subscription has it, or if it's the same subscription
        if (!existingWithPayerId || existingWithPayerId.id === subscription.id) {
          subscription.paypalPayerId = newPayerId;
        } else {
          console.warn(`[SubscriptionService] Payer ID ${newPayerId} already exists in subscription ${existingWithPayerId.id}, skipping update for subscription ${subscription.id}`);
        }
      }
    }

    // Update period dates if available
    if (paypalSubscription.billing_info) {
      // Update next billing time
      if (paypalSubscription.billing_info.next_billing_time) {
        subscription.nextBillingTime = new Date(paypalSubscription.billing_info.next_billing_time);
      }
      
      // Update period dates based on cycle executions or next billing time
      if (paypalSubscription.billing_info.cycle_executions && paypalSubscription.billing_info.cycle_executions.length > 0) {
        const lastCycle = paypalSubscription.billing_info.cycle_executions[paypalSubscription.billing_info.cycle_executions.length - 1];
        if (lastCycle?.cycle_executed) {
          // Update period dates based on PayPal data
          if (paypalSubscription.billing_info.next_billing_time) {
            const nextBilling = new Date(paypalSubscription.billing_info.next_billing_time);
            subscription.currentPeriodEnd = nextBilling;
            // Calculate start based on plan type
            if (subscription.planType === 'MONTHLY') {
              const start = new Date(nextBilling);
              start.setMonth(start.getMonth() - 1);
              subscription.currentPeriodStart = start;
            } else if (subscription.planType === 'YEARLY') {
              const start = new Date(nextBilling);
              start.setFullYear(start.getFullYear() - 1);
              subscription.currentPeriodStart = start;
            }
          }
        }
      } else if (paypalSubscription.billing_info.next_billing_time && subscription.status === 'ACTIVE') {
        // If no cycle_executions but we have next_billing_time and status is ACTIVE, use it
        const nextBilling = new Date(paypalSubscription.billing_info.next_billing_time);
        subscription.currentPeriodEnd = nextBilling;
        // Calculate start based on plan type
        if (subscription.planType === 'MONTHLY') {
          const start = new Date(nextBilling);
          start.setMonth(start.getMonth() - 1);
          subscription.currentPeriodStart = start;
        } else if (subscription.planType === 'YEARLY') {
          const start = new Date(nextBilling);
          start.setFullYear(start.getFullYear() - 1);
          subscription.currentPeriodStart = start;
        }
      }
    }

    const updatedSubscription = await this.subscriptionRepository.save(subscription);

    // Create history entry
    await this.createHistoryEntry({
      subscriptionId: updatedSubscription.id,
      eventType: paypalEvent ? this.mapPayPalEventType(paypalEvent.event_type) : 'updated',
      paypalEventId: paypalEvent?.id,
      paypalResourceId: paypalSubscriptionId,
      oldValue: { status: oldStatus },
      newValue: { status: updatedSubscription.status },
      metadata: paypalEvent || { manual_sync: true },
    });

    // Detect status changes and send emails (only if event provided)
    if (paypalEvent) {
      await this.handleStatusChange(oldStatus, updatedSubscription, paypalEvent);
    }

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
   * Check and handle expired subscriptions
   * Called by middleware to ensure expired subscriptions are properly marked
   * Also handles trial expiration
   */
  static async checkAndHandleExpiredSubscription(subscription: Subscription): Promise<void> {
    const now = new Date();
    
    // Check trial end first (if in trial period)
    if (subscription.trialEnd && new Date(subscription.trialEnd) < now && subscription.status === 'ACTIVE') {
      // Trial ended - check if it was marked for cancellation
      if (subscription.cancelAtPeriodEnd) {
        subscription.status = 'CANCELLED';
        subscription.canceledAt = now;
      } else {
        // Trial ended but not cancelled - check if there's a currentPeriodEnd (paid period)
        if (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > now) {
          // Still has paid period, keep ACTIVE
          return;
        } else {
          // No paid period, mark as EXPIRED
          subscription.status = 'EXPIRED';
        }
      }
      
      await this.subscriptionRepository.save(subscription);
      await this.updateUserPlan(subscription);
      return;
    }
    
    // Check regular period end (if not in trial)
    if (subscription.currentPeriodEnd) {
      const periodEnd = new Date(subscription.currentPeriodEnd);
      
      // If period ended and subscription is still ACTIVE
      if (periodEnd < now && subscription.status === 'ACTIVE') {
        // Check if it was marked for cancellation
        if (subscription.cancelAtPeriodEnd) {
          subscription.status = 'CANCELLED';
          subscription.canceledAt = now;
        } else {
          subscription.status = 'EXPIRED';
        }
        
        await this.subscriptionRepository.save(subscription);
        await this.updateUserPlan(subscription);
      }
    }
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
   * First tries to get from database (plans table), then falls back to environment variables
   */
  private static async getPayPalPlanId(planType: PlanType): Promise<string | null> {
    try {
      // First, try to get from database (plans table)
      const plan = await this.planRepository.findOne({
        where: { planType, enabled: true },
      });

      if (plan && plan.paypalPlanId) {
        return plan.paypalPlanId;
      }
    } catch (error) {
      console.error('Erro ao buscar plano do banco de dados:', error);
      // Fall through to environment variable fallback
    }

    // Fallback to environment variables (for backwards compatibility)
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

  /**
   * Helper: Handle status changes and send appropriate emails
   */
  private static async handleStatusChange(
    oldStatus: SubscriptionStatus,
    subscription: Subscription,
    paypalEvent: any
  ): Promise<void> {
    const newStatus = subscription.status;

    // Only send emails if status actually changed
    if (oldStatus === newStatus) {
      return;
    }

    try {
      // Check if email was already sent for this event (avoid duplicates)
      const existingHistory = await this.subscriptionHistoryRepository.findOne({
        where: {
          subscriptionId: subscription.id,
          paypalEventId: paypalEvent.id,
        },
      });

      if (existingHistory) {
        // Email already sent for this event
        return;
      }

      // Send emails based on status change
      if (newStatus === 'SUSPENDED') {
        // Assinatura foi suspensa (provavelmente por pagamento falho)
        if (paypalEvent.event_type === 'PAYMENT.SALE.DENIED') {
          // Pagamento foi negado - enviar email de pagamento falho
          await EmailService.enviarEmailPagamentoFalho(
            subscription.usuarioId,
            subscription.planType,
            subscription.currentPeriodEnd,
            subscription.nextBillingTime
          );
        } else {
          // Suspensa por outro motivo - enviar email genérico de suspensão
          await EmailService.enviarEmailAssinaturaSuspensa(
            subscription.usuarioId,
            subscription.planType,
            subscription.currentPeriodEnd
          );
        }
      } else if (newStatus === 'EXPIRED') {
        // Assinatura expirou
        if (subscription.currentPeriodEnd) {
          await EmailService.enviarEmailAssinaturaExpirada(
            subscription.usuarioId,
            subscription.planType,
            subscription.currentPeriodEnd
          );
        }
      }
      // Note: We don't send emails for ACTIVATED status here because
      // that should be handled separately when subscription is first activated
    } catch (error: any) {
      // Log error but don't throw - email failures shouldn't break subscription sync
      console.error('Erro ao enviar email de mudança de status:', error);
    }
  }
}