"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const data_source_1 = require("../database/data-source");
const Subscription_1 = require("../entities/Subscription");
const SubscriptionHistory_1 = require("../entities/SubscriptionHistory");
const SubscriptionFeature_1 = require("../entities/SubscriptionFeature");
const Usuario_1 = require("../entities/Usuario");
const Plan_1 = require("../entities/Plan");
const AsaasService_1 = require("./AsaasService");
const EmailService_1 = require("./EmailService");
const Email_1 = require("../entities/Email");
class SubscriptionService {
    /**
     * Get or create Asaas customer for user
     */
    static async getOrCreateAsaasCustomer(usuarioId, cpfCnpj) {
        const usuario = await this.usuarioRepository.findOne({ where: { id: usuarioId } });
        if (!usuario) {
            throw new Error('User not found');
        }
        // Se CPF foi fornecido e usuário não tem, atualizar no banco
        if (cpfCnpj && !usuario.cpfCnpj) {
            usuario.cpfCnpj = cpfCnpj.replace(/\D/g, ''); // Remover formatação
            await this.usuarioRepository.save(usuario);
        }
        // Usar CPF do usuário ou o fornecido
        const finalCpfCnpj = cpfCnpj?.replace(/\D/g, '') || usuario.cpfCnpj?.replace(/\D/g, '');
        // Build phone number
        const phone = usuario.ddd && usuario.telefone
            ? `${usuario.ddd}${usuario.telefone.replace(/\D/g, '')}`
            : undefined;
        // Create customer in Asaas
        const customer = await AsaasService_1.AsaasService.createCustomer({
            name: usuario.nome,
            email: usuario.email,
            mobilePhone: phone,
            cpfCnpj: finalCpfCnpj,
            externalReference: usuarioId.toString(),
        });
        return customer.id;
    }
    /**
     * Create a new subscription
     * Returns checkout data for PIX or processes card payment
     */
    static async createSubscription(data) {
        const usuario = await this.usuarioRepository.findOne({ where: { id: data.usuarioId } });
        if (!usuario) {
            throw new Error('User not found');
        }
        if (!['MONTHLY', 'YEARLY'].includes(data.planType)) {
            throw new Error('Plan type must be MONTHLY or YEARLY for subscriptions');
        }
        // Check if user already has an active subscription (only for new subscriptions)
        // Allow upgrading/downgrading if needed, but prevent duplicate active subscriptions
        const existingActiveSubscription = await this.subscriptionRepository.findOne({
            where: { usuarioId: data.usuarioId, status: 'ACTIVE' },
        });
        if (existingActiveSubscription && existingActiveSubscription.status === 'ACTIVE') {
            // Verificar se é o mesmo plano - se sim, não permitir criar outra
            if (existingActiveSubscription.planType === data.planType) {
                throw new Error('Você já possui uma assinatura ativa deste plano. Para alterar, cancele a atual primeiro.');
            }
            // Se for plano diferente, permitir criar (será tratado como upgrade/downgrade)
            // A assinatura anterior será cancelada automaticamente ou o usuário pode cancelar manualmente
        }
        // PIX: cancelar assinaturas pendentes (mesmo usuário + mesmo plano) antes de criar nova.
        // Evita acúmulo de cobranças "Aguardando" / "Vencidas" no Asaas quando o usuário gera QR de novo.
        if (data.paymentMethod === 'PIX') {
            const pendingPix = await this.subscriptionRepository.find({
                where: {
                    usuarioId: data.usuarioId,
                    planType: data.planType,
                    status: 'APPROVAL_PENDING',
                    paymentMethod: 'PIX',
                },
            });
            for (const sub of pendingPix) {
                try {
                    await this.cancelSubscription(sub.id, true);
                    console.log(`[SubscriptionService] Cancelled pending PIX subscription ${sub.id} (Asaas: ${sub.asaasSubscriptionId || 'N/A'}) before creating new one`);
                }
                catch (e) {
                    console.warn(`[SubscriptionService] Failed to cancel pending PIX ${sub.id}: ${e?.message || e}`);
                }
            }
        }
        // Get plan details
        const plan = await this.planRepository.findOne({
            where: { planType: data.planType, enabled: true },
        });
        if (!plan) {
            throw new Error(`Plan ${data.planType} not found or disabled`);
        }
        // Para PIX, CPF é obrigatório. Validar antes de continuar
        let cpfCnpj;
        if (data.paymentMethod === 'PIX') {
            // CPF pode vir do creditCardHolderInfo (se fornecido) ou userCpfCnpj
            cpfCnpj = data.userCpfCnpj?.replace(/\D/g, '') || data.creditCardHolderInfo?.cpfCnpj?.replace(/\D/g, '');
            // Se ainda não tem CPF, verificar se usuário tem no banco
            if (!cpfCnpj) {
                if (!usuario.cpfCnpj) {
                    throw new Error('CPF/CNPJ é obrigatório para pagamentos PIX. Por favor, informe seu CPF/CNPJ.');
                }
                cpfCnpj = usuario.cpfCnpj.replace(/\D/g, '');
            }
        }
        else if (data.creditCardHolderInfo?.cpfCnpj) {
            // Para cartão, usar CPF do titular
            cpfCnpj = data.creditCardHolderInfo.cpfCnpj.replace(/\D/g, '');
        }
        // Get or create Asaas customer (com CPF se disponível)
        const asaasCustomerId = await this.getOrCreateAsaasCustomer(data.usuarioId, cpfCnpj);
        // Calculate next due date (today)
        const nextDueDate = new Date().toISOString().split('T')[0];
        // Create subscription in Asaas
        const asaasSubscription = await AsaasService_1.AsaasService.createSubscription({
            customer: asaasCustomerId,
            billingType: data.paymentMethod,
            value: parseFloat(plan.price.toString()),
            cycle: data.planType === 'MONTHLY' ? 'MONTHLY' : 'YEARLY',
            nextDueDate,
            description: `Assinatura ${plan.name}`,
            creditCard: data.creditCard,
            creditCardHolderInfo: data.creditCardHolderInfo,
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
        // Determine status - if CREDIT_CARD and payment processed immediately, status might be CONFIRMED
        let status = 'APPROVAL_PENDING';
        if (data.paymentMethod === 'CREDIT_CARD' && asaasSubscription.status === 'ACTIVE') {
            status = 'ACTIVE';
        }
        // Create subscription in database
        const subscription = this.subscriptionRepository.create({
            usuarioId: data.usuarioId,
            asaasSubscriptionId: asaasSubscription.id,
            asaasCustomerId,
            planType: data.planType,
            paymentMethod: data.paymentMethod,
            status,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
        });
        const savedSubscription = await this.subscriptionRepository.save(subscription);
        // Get PIX QR Code if payment method is PIX
        let pixQrCode;
        if (data.paymentMethod === 'PIX') {
            try {
                // Get first payment from subscription to get QR Code
                const payments = await AsaasService_1.AsaasService.getSubscriptionPayments(asaasSubscription.id);
                if (payments?.data && payments.data.length > 0) {
                    const firstPayment = payments.data[0];
                    if (firstPayment.id) {
                        pixQrCode = await AsaasService_1.AsaasService.getPixQrCode(firstPayment.id);
                        savedSubscription.asaasPaymentId = firstPayment.id;
                        await this.subscriptionRepository.save(savedSubscription);
                    }
                }
            }
            catch (error) {
                console.error('[SubscriptionService] Error getting PIX QR Code:', error);
            }
        }
        // Create history entry
        await this.createHistoryEntry({
            subscriptionId: savedSubscription.id,
            eventType: 'created',
            newValue: savedSubscription,
        });
        // Link subscription to user
        usuario.subscriptionId = savedSubscription.id;
        await this.usuarioRepository.save(usuario);
        // Update user plan if already active
        if (status === 'ACTIVE') {
            await this.updateUserPlan(savedSubscription);
        }
        return {
            subscriptionId: savedSubscription.id,
            asaasSubscriptionId: asaasSubscription.id,
            pixQrCode,
            status: status === 'ACTIVE' ? 'CONFIRMED' : 'PENDING',
        };
    }
    /**
     * Get subscription by Asaas subscription ID
     */
    static async getSubscriptionByAsaasId(asaasSubscriptionId) {
        return await this.subscriptionRepository.findOne({
            where: { asaasSubscriptionId },
        });
    }
    /**
     * Get subscription by Asaas payment ID
     */
    static async getSubscriptionByAsaasPaymentId(asaasPaymentId) {
        return await this.subscriptionRepository.findOne({
            where: { asaasPaymentId },
        });
    }
    /**
     * Create lifetime payment
     */
    static async createLifetimePayment(data) {
        const usuario = await this.usuarioRepository.findOne({ where: { id: data.usuarioId } });
        if (!usuario) {
            throw new Error('User not found');
        }
        // Get plan details
        const plan = await this.planRepository.findOne({
            where: { planType: 'LIFETIME', enabled: true },
        });
        if (!plan) {
            throw new Error('LIFETIME plan not found or disabled');
        }
        // PIX: cancelar assinaturas LIFETIME pendentes (mesmo usuário) antes de criar nova
        if (data.paymentMethod === 'PIX') {
            const pendingLifetimePix = await this.subscriptionRepository.find({
                where: {
                    usuarioId: data.usuarioId,
                    planType: 'LIFETIME',
                    status: 'APPROVAL_PENDING',
                    paymentMethod: 'PIX',
                },
            });
            for (const sub of pendingLifetimePix) {
                try {
                    await this.cancelSubscription(sub.id, true);
                    console.log(`[SubscriptionService] Cancelled pending LIFETIME PIX subscription ${sub.id} (payment ${sub.asaasPaymentId || 'N/A'}) before creating new one`);
                }
                catch (e) {
                    console.warn(`[SubscriptionService] Failed to cancel pending LIFETIME PIX ${sub.id}: ${e?.message || e}`);
                }
            }
        }
        // Para PIX, CPF é obrigatório. Validar antes de continuar
        let cpfCnpj;
        if (data.paymentMethod === 'PIX') {
            // CPF pode vir do creditCardHolderInfo (se fornecido) ou userCpfCnpj
            cpfCnpj = data.userCpfCnpj?.replace(/\D/g, '') || data.creditCardHolderInfo?.cpfCnpj?.replace(/\D/g, '');
            // Se ainda não tem CPF, verificar se usuário tem no banco
            if (!cpfCnpj) {
                if (!usuario.cpfCnpj) {
                    throw new Error('CPF/CNPJ é obrigatório para pagamentos PIX. Por favor, informe seu CPF/CNPJ.');
                }
                cpfCnpj = usuario.cpfCnpj.replace(/\D/g, '');
            }
        }
        else if (data.creditCardHolderInfo?.cpfCnpj) {
            // Para cartão, usar CPF do titular
            cpfCnpj = data.creditCardHolderInfo.cpfCnpj.replace(/\D/g, '');
        }
        // Get or create Asaas customer (com CPF se disponível)
        const asaasCustomerId = await this.getOrCreateAsaasCustomer(data.usuarioId, cpfCnpj);
        const totalValue = parseFloat(plan.price.toString());
        const dueDate = new Date().toISOString().split('T')[0];
        // Validate installment if provided
        if (data.installmentCount && data.installmentCount > 1) {
            const minInstallmentValue = parseFloat(process.env.MIN_INSTALLMENT_VALUE || '10.00');
            const installmentValue = parseFloat((totalValue / data.installmentCount).toFixed(2));
            if (installmentValue < minInstallmentValue) {
                throw new Error(`Valor mínimo por parcela é R$ ${minInstallmentValue.toFixed(2)}`);
            }
        }
        // Create payment in Asaas
        const asaasPayment = await AsaasService_1.AsaasService.createPayment({
            customer: asaasCustomerId,
            billingType: data.paymentMethod,
            value: totalValue,
            dueDate,
            description: `Assinatura ${plan.name}`,
            installmentCount: data.installmentCount && data.installmentCount > 1 ? data.installmentCount : undefined,
            installmentValue: data.installmentCount && data.installmentCount > 1
                ? parseFloat((totalValue / data.installmentCount).toFixed(2))
                : undefined,
            creditCard: data.creditCard,
            creditCardHolderInfo: data.creditCardHolderInfo,
        });
        // Determine status
        let status = 'APPROVAL_PENDING';
        if (data.paymentMethod === 'CREDIT_CARD' && asaasPayment.status === 'CONFIRMED') {
            status = 'ACTIVE';
        }
        // Create subscription in database
        const now = new Date();
        const subscription = this.subscriptionRepository.create({
            usuarioId: data.usuarioId,
            asaasPaymentId: asaasPayment.id,
            asaasCustomerId,
            planType: 'LIFETIME',
            paymentMethod: data.paymentMethod,
            installmentCount: data.installmentCount && data.installmentCount > 1 ? data.installmentCount : undefined,
            status,
            currentPeriodStart: now,
            currentPeriodEnd: undefined, // Never expires
            cancelAtPeriodEnd: false,
        });
        const savedSubscription = await this.subscriptionRepository.save(subscription);
        // Get PIX QR Code if payment method is PIX
        let pixQrCode;
        if (data.paymentMethod === 'PIX') {
            try {
                pixQrCode = await AsaasService_1.AsaasService.getPixQrCode(asaasPayment.id);
            }
            catch (error) {
                console.error('[SubscriptionService] Error getting PIX QR Code:', error);
            }
        }
        // Create history entry
        await this.createHistoryEntry({
            subscriptionId: savedSubscription.id,
            eventType: 'created',
            newValue: savedSubscription,
        });
        // Link subscription to user
        usuario.subscriptionId = savedSubscription.id;
        if (status === 'ACTIVE') {
            usuario.plano = 'LIFETIME';
            usuario.planoValidoAte = undefined;
        }
        await this.usuarioRepository.save(usuario);
        // Update user plan if already active
        if (status === 'ACTIVE') {
            await this.updateUserPlan(savedSubscription);
        }
        return {
            subscriptionId: savedSubscription.id,
            asaasPaymentId: asaasPayment.id,
            pixQrCode,
            status: status === 'ACTIVE' ? 'CONFIRMED' : 'PENDING',
        };
    }
    /**
     * Get installment options for a plan type
     */
    static async getInstallmentOptions(planType) {
        const plan = await this.planRepository.findOne({
            where: { planType, enabled: true },
        });
        if (!plan) {
            throw new Error(`Plan ${planType} not found or disabled`);
        }
        const totalValue = parseFloat(plan.price.toString());
        const minInstallmentValue = parseFloat(process.env.MIN_INSTALLMENT_VALUE || '10.00');
        return AsaasService_1.AsaasService.calculateInstallmentOptions(totalValue, minInstallmentValue, 3);
    }
    /**
     * Activate subscription (called by webhook when payment is confirmed)
     */
    static async activateSubscription(subscriptionId) {
        const subscription = await this.subscriptionRepository.findOne({ where: { id: subscriptionId } });
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        const oldStatus = subscription.status;
        // Update subscription status to ACTIVE
        subscription.status = 'ACTIVE';
        // Update period dates
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
        // Update in Asaas if not lifetime
        // Note: Asaas doesn't support changing plan type directly
        // Would need to cancel old subscription and create new one
        // For now, just update in database
        // TODO: Implement proper plan change with Asaas
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
        if (immediately) {
            // Cancel immediately in Asaas
            if (subscription.asaasSubscriptionId) {
                await AsaasService_1.AsaasService.cancelSubscription(subscription.asaasSubscriptionId);
            }
            // LIFETIME PIX: só tem asaasPaymentId (pagamento avulso), sem subscription
            if (!subscription.asaasSubscriptionId && subscription.asaasPaymentId) {
                try {
                    await AsaasService_1.AsaasService.cancelPayment(subscription.asaasPaymentId);
                }
                catch (e) {
                    console.warn(`[SubscriptionService] Could not cancel Asaas payment ${subscription.asaasPaymentId}: ${e?.message || e}`);
                }
            }
            subscription.status = 'CANCELLED';
            subscription.canceledAt = new Date();
        }
        else {
            // Cancel at period end
            subscription.cancelAtPeriodEnd = true;
            // Cancel subscription in Asaas (it will cancel after current period)
            if (subscription.asaasSubscriptionId) {
                await AsaasService_1.AsaasService.cancelSubscription(subscription.asaasSubscriptionId);
            }
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
        // Asaas doesn't have suspend, just cancel
        if (subscription.asaasSubscriptionId) {
            await AsaasService_1.AsaasService.cancelSubscription(subscription.asaasSubscriptionId);
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
        // Re-activate in Asaas if needed
        // Note: Asaas doesn't have a direct "resume" API
        // Would need to create new subscription
        // For now, just update status in database
        subscription.status = 'ACTIVE';
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
    static async getSubscription(usuarioId) {
        const subscription = await this.subscriptionRepository.findOne({
            where: { usuarioId },
            relations: ['features'],
            order: { createdAt: 'DESC' },
        });
        // Auto-sync if subscription is pending approval (for PIX payments)
        // For Asaas, sync if status is APPROVAL_PENDING (waiting for PIX payment)
        if (subscription && subscription.asaasSubscriptionId) {
            const now = Date.now();
            const lastSyncTime = this.lastSyncCache.get(subscription.asaasSubscriptionId) || 0;
            const timeSinceLastSync = now - lastSyncTime;
            // Determine if we need to sync:
            // 1. Pending approval (always sync - might have been activated by webhook)
            // 2. ACTIVE but expired (always sync - needs immediate update)
            // 3. ACTIVE but cache expired (sync only if cache TTL passed - prevents excessive calls)
            const isPending = subscription.status === 'APPROVAL_PENDING';
            const isExpired = subscription.status === 'ACTIVE' && subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) < new Date();
            const cacheExpired = subscription.status === 'ACTIVE' && timeSinceLastSync > this.SYNC_CACHE_TTL;
            const needsSync = isPending || isExpired || cacheExpired;
            if (needsSync) {
                try {
                    // PIX em APPROVAL_PENDING: só ativar quando o PAGAMENTO estiver pago, não o status da assinatura.
                    // No sandbox o Asaas pode retornar subscription ACTIVE antes do PIX ser pago; isso causaria
                    // redirecionamento imediato para /assinatura sem pagamento. Evitamos checando o payment.
                    // Usamos cache para não chamar getPaymentStatus a cada poll (frontend a cada 5s); com muitos
                    // usuários isso geraria excesso de chamadas ao Asaas e log repetitivo.
                    if (isPending && subscription.paymentMethod === 'PIX' && subscription.asaasPaymentId) {
                        const pid = subscription.asaasPaymentId;
                        const cached = this.pixPaymentCheckCache.get(pid);
                        const cacheValid = cached && (now - cached.lastCheck) < this.PIX_PAYMENT_CHECK_TTL;
                        let paid = false;
                        if (cacheValid) {
                            paid = cached.status === 'RECEIVED' || cached.status === 'CONFIRMED';
                            if (!paid) {
                                return subscription;
                            }
                        }
                        if (!cacheValid) {
                            const payment = await AsaasService_1.AsaasService.getPaymentStatus(pid);
                            paid = payment.status === 'RECEIVED' || payment.status === 'CONFIRMED';
                            this.pixPaymentCheckCache.set(pid, { lastCheck: now, status: payment.status });
                            if (!paid) {
                                console.log(`[SubscriptionService] ⏳ PIX pending: payment ${pid} status=${payment.status}, next check in ${this.PIX_PAYMENT_CHECK_TTL / 1000}s`);
                                return subscription;
                            }
                            this.pixPaymentCheckCache.delete(pid);
                            console.log(`[SubscriptionService] ✅ PIX payment confirmed (${payment.status}), proceeding with sync`);
                        }
                    }
                    console.log(`[SubscriptionService] 🔄 Auto-syncing subscription ${subscription.asaasSubscriptionId} for user ${usuarioId} (current status: ${subscription.status})`);
                    // Update cache before making API call
                    this.lastSyncCache.set(subscription.asaasSubscriptionId, now);
                    const asaasSubscription = await AsaasService_1.AsaasService.getSubscriptionStatus(subscription.asaasSubscriptionId);
                    const asaasStatus = this.mapAsaasSubscriptionStatus(asaasSubscription.status);
                    console.log(`[SubscriptionService] 📊 Asaas status: ${asaasSubscription.status} -> mapped to: ${asaasStatus}`);
                    // Sync if status is different
                    if (asaasStatus !== subscription.status) {
                        console.log(`[SubscriptionService] ✅ Status mismatch detected! Syncing from ${subscription.status} to ${asaasStatus}...`);
                        const syncedSubscription = await this.syncAsaasSubscription(subscription.asaasSubscriptionId);
                        console.log(`[SubscriptionService] ✅ Subscription synced successfully! New status: ${syncedSubscription.status}`);
                        // If sync resulted in EXPIRED, update user plan
                        if (syncedSubscription.status === 'EXPIRED') {
                            await this.updateUserPlan(syncedSubscription);
                        }
                        return syncedSubscription;
                    }
                    else {
                        console.log(`[SubscriptionService] ℹ️ Status matches Asaas (${asaasStatus}), no sync needed`);
                    }
                }
                catch (error) {
                    // Don't fail if sync fails, just log
                    console.error(`[SubscriptionService] ❌ Failed to auto-sync subscription: ${error.message}`);
                    if (error.stack) {
                        console.error(`[SubscriptionService] Error stack:`, error.stack);
                    }
                    // Remove from cache on error so we can retry next time
                    this.lastSyncCache.delete(subscription.asaasSubscriptionId);
                }
            }
            else if (subscription.status === 'ACTIVE') {
                // Cache hit - skip sync but log for debugging
                console.log(`[SubscriptionService] ⏭️ Skipping auto-sync for ACTIVE subscription ${subscription.asaasSubscriptionId} (cached, last sync ${Math.round(timeSinceLastSync / 1000)}s ago)`);
            }
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
     * Sync subscription from Asaas webhook
     */
    static async syncAsaasSubscription(asaasResourceId, asaasEvent) {
        // Try to find by subscription ID first
        let subscription = await this.subscriptionRepository.findOne({
            where: { asaasSubscriptionId: asaasResourceId },
        });
        // If not found, try payment ID (for LIFETIME)
        if (!subscription) {
            subscription = await this.subscriptionRepository.findOne({
                where: { asaasPaymentId: asaasResourceId },
            });
        }
        if (!subscription) {
            throw new Error(`Subscription not found for Asaas ID: ${asaasResourceId}`);
        }
        const oldStatus = subscription.status;
        // If we have subscription ID, sync from subscription
        if (subscription.asaasSubscriptionId) {
            const asaasSubscription = await AsaasService_1.AsaasService.getSubscriptionStatus(subscription.asaasSubscriptionId);
            subscription.status = this.mapAsaasSubscriptionStatus(asaasSubscription.status);
            // Update next billing time
            if (subscription.status === 'ACTIVE' && subscription.planType !== 'LIFETIME') {
                const nextBilling = new Date(asaasSubscription.nextDueDate);
                subscription.nextBillingTime = nextBilling;
                // Update period dates
                if (subscription.planType === 'MONTHLY') {
                    subscription.currentPeriodEnd = nextBilling;
                    const start = new Date(nextBilling);
                    start.setMonth(start.getMonth() - 1);
                    subscription.currentPeriodStart = start;
                }
                else if (subscription.planType === 'YEARLY') {
                    subscription.currentPeriodEnd = nextBilling;
                    const start = new Date(nextBilling);
                    start.setFullYear(start.getFullYear() - 1);
                    subscription.currentPeriodStart = start;
                }
            }
        }
        // If payment was received, activate subscription
        if (asaasEvent?.event === 'PAYMENT_RECEIVED') {
            if (subscription.status !== 'ACTIVE') {
                subscription.status = 'ACTIVE';
            }
        }
        const updatedSubscription = await this.subscriptionRepository.save(subscription);
        // Create history entry
        await this.createHistoryEntry({
            subscriptionId: updatedSubscription.id,
            eventType: asaasEvent ? this.mapAsaasEventType(asaasEvent.event) : 'updated',
            paypalEventId: asaasEvent?.id,
            paypalResourceId: asaasResourceId,
            oldValue: { status: oldStatus },
            newValue: { status: updatedSubscription.status },
            metadata: asaasEvent || { manual_sync: true },
        });
        // Detect status changes and send emails (only if event provided)
        if (asaasEvent) {
            await this.handleStatusChange(oldStatus, updatedSubscription, asaasEvent);
        }
        await this.updateUserPlan(updatedSubscription);
        return updatedSubscription;
    }
    /**
     * Sync subscription from PayPal webhook (DEPRECATED - kept for backward compatibility)
     * NOTE: This method is deprecated. Use syncAsaasSubscription instead.
     */
    static async syncPayPalSubscription(paypalSubscriptionId, paypalEvent) {
        // This method is deprecated and no longer supported
        // Migrate to Asaas - use syncAsaasSubscription instead
        throw new Error('PayPal integration is deprecated. Please use Asaas integration.');
        /* DEPRECATED CODE - PayPal no longer supported
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
        */
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
     * Check and handle expired subscriptions
     * Called by middleware to ensure expired subscriptions are properly marked
     * Also handles trial expiration
     */
    static async checkAndHandleExpiredSubscription(subscription) {
        const now = new Date();
        // Check trial end first (if in trial period)
        if (subscription.trialEnd && new Date(subscription.trialEnd) < now && subscription.status === 'ACTIVE') {
            // Trial ended - check if it was marked for cancellation
            if (subscription.cancelAtPeriodEnd) {
                subscription.status = 'CANCELLED';
                subscription.canceledAt = now;
            }
            else {
                // Trial ended but not cancelled - check if there's a currentPeriodEnd (paid period)
                if (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > now) {
                    // Still has paid period, keep ACTIVE
                    return;
                }
                else {
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
                }
                else {
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
     * Helper: Map Asaas subscription status to our status
     */
    static mapAsaasSubscriptionStatus(asaasStatus) {
        const statusMap = {
            'ACTIVE': 'ACTIVE',
            'EXPIRED': 'EXPIRED',
            'INACTIVE': 'CANCELLED',
        };
        return statusMap[asaasStatus.toUpperCase()] || 'APPROVAL_PENDING';
    }
    /**
     * Helper: Map Asaas payment status to our status
     */
    static mapAsaasPaymentStatus(asaasStatus) {
        const statusMap = {
            'PENDING': 'APPROVAL_PENDING',
            'CONFIRMED': 'ACTIVE',
            'RECEIVED': 'ACTIVE',
            'OVERDUE': 'EXPIRED',
            'REFUNDED': 'CANCELLED',
        };
        return statusMap[asaasStatus.toUpperCase()] || 'APPROVAL_PENDING';
    }
    /**
     * Helper: Map Asaas event type to our event type
     */
    static mapAsaasEventType(asaasEventType) {
        if (asaasEventType.includes('CREATED'))
            return 'created';
        if (asaasEventType.includes('RECEIVED'))
            return 'activated';
        if (asaasEventType.includes('CONFIRMED'))
            return 'activated';
        if (asaasEventType.includes('OVERDUE'))
            return 'payment_failed';
        if (asaasEventType.includes('REFUNDED'))
            return 'refunded';
        if (asaasEventType.includes('DELETED'))
            return 'canceled';
        return 'updated';
    }
    /**
     * Helper: Handle status changes and send appropriate emails
     */
    static async handleStatusChange(oldStatus, subscription, asaasEvent) {
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
                    paypalEventId: asaasEvent?.id,
                },
            });
            if (existingHistory) {
                // Email already sent for this event
                return;
            }
            // Send emails based on status change
            if (newStatus === 'SUSPENDED') {
                // Assinatura foi suspensa (provavelmente por pagamento falho)
                if (asaasEvent?.event === 'PAYMENT_OVERDUE') {
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
// Cache for last sync time per subscription to prevent excessive API calls
// Format: { asaasSubscriptionId: timestamp }
SubscriptionService.lastSyncCache = new Map();
SubscriptionService.SYNC_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
// Cache para checagem do status do pagamento PIX (evitar getPaymentStatus a cada poll)
// Formato: { asaasPaymentId: { lastCheck: number; status: string } }
SubscriptionService.pixPaymentCheckCache = new Map();
SubscriptionService.PIX_PAYMENT_CHECK_TTL = 15 * 1000; // 15 segundos
