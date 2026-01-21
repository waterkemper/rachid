"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const data_source_1 = require("../database/data-source");
const Subscription_1 = require("../entities/Subscription");
const SubscriptionHistory_1 = require("../entities/SubscriptionHistory");
const SubscriptionFeature_1 = require("../entities/SubscriptionFeature");
const Usuario_1 = require("../entities/Usuario");
const Plan_1 = require("../entities/Plan");
const PayPalService_1 = require("./PayPalService");
const EmailService_1 = require("./EmailService");
const Email_1 = require("../entities/Email");
class SubscriptionService {
    /**
     * Create a new subscription
     */
    static async createSubscription(data) {
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
                const paypalSubscription = await PayPalService_1.PayPalService.getSubscription(pendingSubscription.paypalSubscriptionId);
                const paypalStatus = this.mapPayPalStatus(paypalSubscription.status);
                if (paypalStatus === 'ACTIVE') {
                    console.log(`[SubscriptionService] Pending subscription is ACTIVE in PayPal, activating...`);
                    await this.activateSubscription(pendingSubscription.id, paypalSubscription.subscriber?.payer_id || '');
                    throw new Error('Pending subscription was activated. Please refresh the page.');
                }
            }
            catch (error) {
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
        const paypalResult = await PayPalService_1.PayPalService.createSubscription({
            planId: paypalPlanId,
            returnUrl: data.returnUrl,
            cancelUrl: data.cancelUrl,
            subscriberEmail: usuario.email, // Pass user email to PayPal
        });
        // Calculate period dates
        const now = new Date();
        const periodStart = now;
        let periodEnd;
        if (data.planType === 'MONTHLY') {
            periodEnd = new Date(now);
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }
        else if (data.planType === 'YEARLY') {
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
    static async getSubscriptionByPayPalId(paypalSubscriptionId) {
        return await this.subscriptionRepository.findOne({
            where: { paypalSubscriptionId },
        });
    }
    /**
     * Activate subscription after PayPal approval
     */
    static async activateSubscription(subscriptionId, baToken) {
        const subscription = await this.subscriptionRepository.findOne({ where: { id: subscriptionId } });
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        if (!subscription.paypalSubscriptionId) {
            throw new Error('PayPal subscription ID not found');
        }
        // Get updated subscription from PayPal (should be ACTIVE after user approval)
        const paypalSubscription = await PayPalService_1.PayPalService.getSubscription(subscription.paypalSubscriptionId);
        // Update in database
        const oldStatus = subscription.status;
        subscription.status = this.mapPayPalStatus(paypalSubscription.status);
        // Extract payer ID from PayPal subscription if available
        if (paypalSubscription.subscriber?.payer_id) {
            subscription.paypalPayerId = paypalSubscription.subscriber.payer_id;
        }
        else {
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
                }
                else if (subscription.planType === 'YEARLY') {
                    const start = new Date(subscription.nextBillingTime);
                    start.setFullYear(start.getFullYear() - 1);
                    subscription.currentPeriodStart = start;
                }
            }
        }
        else if (subscription.status === 'ACTIVE') {
            // Fallback: Set next billing time based on plan type if not in PayPal response
            const now = new Date();
            if (subscription.planType === 'MONTHLY') {
                const nextBilling = new Date(now);
                nextBilling.setMonth(nextBilling.getMonth() + 1);
                subscription.nextBillingTime = nextBilling;
                subscription.currentPeriodEnd = nextBilling;
                subscription.currentPeriodStart = now;
            }
            else if (subscription.planType === 'YEARLY') {
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
    static async updateSubscription(subscriptionId, newPlanType) {
        const subscription = await this.subscriptionRepository.findOne({ where: { id: subscriptionId } });
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        const oldPlanType = subscription.planType;
        // Update in PayPal if not lifetime
        if (subscription.paypalSubscriptionId && subscription.planType !== 'LIFETIME') {
            const newPaypalPlanId = await this.getPayPalPlanId(newPlanType);
            if (newPaypalPlanId) {
                await PayPalService_1.PayPalService.updateSubscription(subscription.paypalSubscriptionId, [
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
            }
            else {
                subscription.currentPeriodEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
            }
        }
        else {
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
    static async cancelSubscription(subscriptionId, immediately = false) {
        const subscription = await this.subscriptionRepository.findOne({ where: { id: subscriptionId } });
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        if (immediately && subscription.paypalSubscriptionId) {
            // Cancel immediately in PayPal
            await PayPalService_1.PayPalService.cancelSubscription(subscription.paypalSubscriptionId);
            subscription.status = 'CANCELLED';
            subscription.canceledAt = new Date();
        }
        else {
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
    static async suspendSubscription(subscriptionId) {
        const subscription = await this.subscriptionRepository.findOne({ where: { id: subscriptionId } });
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        if (subscription.paypalSubscriptionId) {
            await PayPalService_1.PayPalService.suspendSubscription(subscription.paypalSubscriptionId);
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
    static async resumeSubscription(subscriptionId) {
        const subscription = await this.subscriptionRepository.findOne({ where: { id: subscriptionId } });
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        // Re-activate in PayPal if needed
        if (subscription.paypalSubscriptionId) {
            // PayPal doesn't have a direct "resume" API, so we update the subscription
            const paypalSubscription = await PayPalService_1.PayPalService.getSubscription(subscription.paypalSubscriptionId);
            subscription.status = this.mapPayPalStatus(paypalSubscription.status);
        }
        else {
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
     */
    static async getSubscription(usuarioId) {
        const subscription = await this.subscriptionRepository.findOne({
            where: { usuarioId },
            relations: ['features'],
            order: { createdAt: 'DESC' },
        });
        // Auto-sync if subscription is pending approval or expired (common in localhost testing)
        // This ensures we always have the latest status from PayPal
        if (subscription && subscription.paypalSubscriptionId) {
            const needsSync = subscription.status === 'APPROVAL_PENDING' ||
                subscription.status === 'EXPIRED' ||
                !subscription.paypalPayerId; // Also sync if missing payer ID
            if (needsSync) {
                try {
                    console.log(`[SubscriptionService] 🔄 Auto-syncing subscription ${subscription.paypalSubscriptionId} for user ${usuarioId} (current status: ${subscription.status})`);
                    const paypalSubscription = await PayPalService_1.PayPalService.getSubscription(subscription.paypalSubscriptionId);
                    const paypalStatus = this.mapPayPalStatus(paypalSubscription.status);
                    console.log(`[SubscriptionService] 📊 PayPal status: ${paypalSubscription.status} -> mapped to: ${paypalStatus}`);
                    // Always sync if status is different OR if PayPal shows ACTIVE but local doesn't
                    const shouldSync = paypalStatus !== subscription.status ||
                        (paypalStatus === 'ACTIVE' && subscription.status !== 'ACTIVE');
                    if (shouldSync) {
                        console.log(`[SubscriptionService] ✅ Status mismatch detected! Syncing from ${subscription.status} to ${paypalStatus}...`);
                        const syncedSubscription = await this.syncPayPalSubscription(subscription.paypalSubscriptionId);
                        console.log(`[SubscriptionService] ✅ Subscription synced successfully! New status: ${syncedSubscription.status}`);
                        return syncedSubscription;
                    }
                    else {
                        console.log(`[SubscriptionService] ℹ️ Status matches PayPal (${paypalStatus}), no sync needed`);
                    }
                }
                catch (error) {
                    // Don't fail if sync fails, just log
                    console.error(`[SubscriptionService] ❌ Failed to auto-sync subscription: ${error.message}`);
                    if (error.stack) {
                        console.error(`[SubscriptionService] Error stack:`, error.stack);
                    }
                }
            }
            else {
                console.log(`[SubscriptionService] ℹ️ Subscription ${subscription.paypalSubscriptionId} status is ${subscription.status}, no auto-sync needed`);
            }
        }
        else if (subscription && !subscription.paypalSubscriptionId) {
            console.log(`[SubscriptionService] ⚠️ Subscription found but no PayPal ID for user ${usuarioId}`);
        }
        return subscription;
    }
    /**
     * Verifica assinaturas próximas do vencimento e envia emails de aviso
     * Busca assinaturas que expiram em 3 dias e envia email se ainda não foi enviado
     */
    static async verificarVencimentosProximos(diasAntecedencia = 3) {
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
        const emailRepository = data_source_1.AppDataSource.getRepository(Email_1.Email);
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
                const diasRestantes = Math.ceil((subscription.currentPeriodEnd.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                if (diasRestantes > 0 && diasRestantes <= diasAntecedencia) {
                    // Enviar email de vencimento próximo
                    await EmailService_1.EmailService.enviarEmailVencimentoProximo(subscription.usuarioId, subscription.planType, subscription.currentPeriodEnd, diasRestantes);
                    emailsEnviados++;
                }
            }
            catch (error) {
                console.error(`Erro ao processar aviso de vencimento para assinatura ${subscription.id}:`, error);
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
    static async syncPayPalSubscription(paypalSubscriptionId, paypalEvent) {
        const subscription = await this.subscriptionRepository.findOne({
            where: { paypalSubscriptionId },
        });
        if (!subscription) {
            throw new Error(`Subscription not found for PayPal ID: ${paypalSubscriptionId}`);
        }
        // Get latest from PayPal
        const paypalSubscription = await PayPalService_1.PayPalService.getSubscription(paypalSubscriptionId);
        const oldStatus = subscription.status;
        subscription.status = this.mapPayPalStatus(paypalSubscription.status);
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
                }
                else {
                    console.warn(`[SubscriptionService] Payer ID ${newPayerId} already exists in subscription ${existingWithPayerId.id}, skipping update for subscription ${subscription.id}`);
                }
            }
        }
        // Update period dates if available
        if (paypalSubscription.billing_info?.cycle_executions) {
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
                    }
                    else if (subscription.planType === 'YEARLY') {
                        const start = new Date(nextBilling);
                        start.setFullYear(start.getFullYear() - 1);
                        subscription.currentPeriodStart = start;
                    }
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
    static async applyLifetimePromo(usuarioId, promoCode, orderId) {
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
    static async checkFeatureAccess(usuarioId, featureKey) {
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
    static async getUsageLimits(usuarioId) {
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
    static async createHistoryEntry(data) {
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
    static async updateUserPlan(subscription) {
        const usuario = await this.usuarioRepository.findOne({ where: { id: subscription.usuarioId } });
        if (!usuario)
            return;
        if (subscription.status === 'ACTIVE') {
            if (subscription.planType === 'LIFETIME') {
                usuario.plano = 'LIFETIME';
                usuario.planoValidoAte = undefined;
            }
            else {
                usuario.plano = 'PRO';
                usuario.planoValidoAte = subscription.currentPeriodEnd;
            }
            // Enable features
            await this.enableProFeatures(subscription.id);
        }
        else {
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
    static async enableProFeatures(subscriptionId) {
        const features = [
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
            }
            else {
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
    static async getPayPalPlanId(planType) {
        try {
            // First, try to get from database (plans table)
            const plan = await this.planRepository.findOne({
                where: { planType, enabled: true },
            });
            if (plan && plan.paypalPlanId) {
                return plan.paypalPlanId;
            }
        }
        catch (error) {
            console.error('Erro ao buscar plano do banco de dados:', error);
            // Fall through to environment variable fallback
        }
        // Fallback to environment variables (for backwards compatibility)
        if (planType === 'MONTHLY') {
            return process.env.PAYPAL_PLAN_ID_MONTHLY || null;
        }
        else if (planType === 'YEARLY') {
            return process.env.PAYPAL_PLAN_ID_YEARLY || null;
        }
        return null; // LIFETIME doesn't use PayPal subscriptions
    }
    /**
     * Helper: Map PayPal status to our status
     */
    static mapPayPalStatus(paypalStatus) {
        const statusMap = {
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
    static mapPayPalEventType(paypalEventType) {
        if (paypalEventType.includes('CREATED'))
            return 'created';
        if (paypalEventType.includes('UPDATED'))
            return 'updated';
        if (paypalEventType.includes('CANCELLED'))
            return 'canceled';
        if (paypalEventType.includes('SUSPENDED'))
            return 'suspended';
        if (paypalEventType.includes('ACTIVATED'))
            return 'activated';
        if (paypalEventType.includes('PAYMENT') && paypalEventType.includes('FAILED'))
            return 'payment_failed';
        if (paypalEventType.includes('REFUNDED'))
            return 'refunded';
        return 'updated';
    }
    /**
     * Helper: Handle status changes and send appropriate emails
     */
    static async handleStatusChange(oldStatus, subscription, paypalEvent) {
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
                    await EmailService_1.EmailService.enviarEmailPagamentoFalho(subscription.usuarioId, subscription.planType, subscription.currentPeriodEnd, subscription.nextBillingTime);
                }
                else {
                    // Suspensa por outro motivo - enviar email genérico de suspensão
                    await EmailService_1.EmailService.enviarEmailAssinaturaSuspensa(subscription.usuarioId, subscription.planType, subscription.currentPeriodEnd);
                }
            }
            else if (newStatus === 'EXPIRED') {
                // Assinatura expirou
                if (subscription.currentPeriodEnd) {
                    await EmailService_1.EmailService.enviarEmailAssinaturaExpirada(subscription.usuarioId, subscription.planType, subscription.currentPeriodEnd);
                }
            }
            // Note: We don't send emails for ACTIVATED status here because
            // that should be handled separately when subscription is first activated
        }
        catch (error) {
            // Log error but don't throw - email failures shouldn't break subscription sync
            console.error('Erro ao enviar email de mudança de status:', error);
        }
    }
}
exports.SubscriptionService = SubscriptionService;
SubscriptionService.subscriptionRepository = data_source_1.AppDataSource.getRepository(Subscription_1.Subscription);
SubscriptionService.subscriptionHistoryRepository = data_source_1.AppDataSource.getRepository(SubscriptionHistory_1.SubscriptionHistory);
SubscriptionService.subscriptionFeatureRepository = data_source_1.AppDataSource.getRepository(SubscriptionFeature_1.SubscriptionFeature);
SubscriptionService.usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
SubscriptionService.planRepository = data_source_1.AppDataSource.getRepository(Plan_1.Plan);
