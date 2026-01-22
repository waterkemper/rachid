"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionController = void 0;
const SubscriptionService_1 = require("../services/SubscriptionService");
const AsaasService_1 = require("../services/AsaasService");
const FeatureService_1 = require("../services/FeatureService");
const SubscriptionPlanService_1 = require("../services/SubscriptionPlanService");
class SubscriptionController {
    /**
     * Create subscription with Asaas (PIX or Credit Card)
     * POST /api/subscriptions
     */
    static async create(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const { planType, paymentMethod, creditCard, creditCardHolderInfo, userCpfCnpj } = req.body;
            if (!planType || !paymentMethod) {
                return res.status(400).json({ error: 'planType e paymentMethod são obrigatórios' });
            }
            if (!['MONTHLY', 'YEARLY'].includes(planType)) {
                return res.status(400).json({ error: 'planType deve ser MONTHLY ou YEARLY' });
            }
            if (!['PIX', 'CREDIT_CARD'].includes(paymentMethod)) {
                return res.status(400).json({ error: 'paymentMethod deve ser PIX ou CREDIT_CARD' });
            }
            // Validate credit card data if payment method is CREDIT_CARD
            if (paymentMethod === 'CREDIT_CARD' && (!creditCard || !creditCardHolderInfo)) {
                return res.status(400).json({ error: 'creditCard e creditCardHolderInfo são obrigatórios para pagamento com cartão' });
            }
            const result = await SubscriptionService_1.SubscriptionService.createSubscription({
                usuarioId,
                planType,
                paymentMethod,
                creditCard,
                creditCardHolderInfo,
                userCpfCnpj, // CPF do usuário para PIX
            });
            res.json({
                subscriptionId: result.subscriptionId,
                asaasSubscriptionId: result.asaasSubscriptionId,
                pixQrCode: result.pixQrCode,
                status: result.status,
            });
        }
        catch (error) {
            console.error('Erro ao criar assinatura:', error);
            res.status(500).json({ error: error.message || 'Erro ao criar assinatura' });
        }
    }
    /**
     * Get installment options for a plan
     * GET /api/subscriptions/installment-options
     */
    static async getInstallmentOptions(req, res) {
        try {
            const { planType } = req.query;
            if (!planType || !['MONTHLY', 'YEARLY', 'LIFETIME'].includes(planType)) {
                return res.status(400).json({ error: 'planType deve ser MONTHLY, YEARLY ou LIFETIME' });
            }
            const options = await SubscriptionService_1.SubscriptionService.getInstallmentOptions(planType);
            res.json({ options });
        }
        catch (error) {
            console.error('Erro ao buscar opções de parcelamento:', error);
            res.status(500).json({ error: error.message || 'Erro ao buscar opções de parcelamento' });
        }
    }
    /**
     * (Apenas sandbox) Simular confirmação de pagamento PIX da assinatura atual.
     * POST /api/subscriptions/confirm-pix-sandbox
     * @see https://docs.asaas.com/reference/confirmar-pagamento
     */
    static async confirmPixSandbox(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const subscription = await SubscriptionService_1.SubscriptionService.getSubscription(usuarioId);
            if (!subscription || subscription.paymentMethod !== 'PIX' || subscription.status !== 'APPROVAL_PENDING' || !subscription.asaasPaymentId) {
                return res.status(400).json({
                    error: 'Nenhuma assinatura PIX pendente encontrada. Gere o QR Code PIX primeiro.',
                });
            }
            await AsaasService_1.AsaasService.confirmPaymentSandbox(subscription.asaasPaymentId);
            res.json({
                message: 'Pagamento PIX simulado com sucesso (sandbox). O polling detectará a ativação em instantes.',
            });
        }
        catch (error) {
            if (error.message?.includes('sandbox')) {
                return res.status(400).json({ error: error.message });
            }
            console.error('Erro ao confirmar PIX sandbox:', error);
            res.status(500).json({ error: error.message || 'Erro ao confirmar pagamento sandbox' });
        }
    }
    /**
     * Get current subscription
     * GET /api/subscriptions/me
     */
    static async getMe(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const subscription = await SubscriptionService_1.SubscriptionService.getSubscription(usuarioId);
            const limits = await SubscriptionService_1.SubscriptionService.getUsageLimits(usuarioId);
            const usage = {
                events: await FeatureService_1.FeatureService.getCurrentUsage(usuarioId, 'max_events'),
            };
            // Get PIX QR Code if subscription is pending PIX payment
            let pixQrCode = undefined;
            if (subscription && subscription.status === 'APPROVAL_PENDING' && subscription.paymentMethod === 'PIX' && subscription.asaasPaymentId) {
                try {
                    pixQrCode = await AsaasService_1.AsaasService.getPixQrCode(subscription.asaasPaymentId);
                }
                catch (error) {
                    console.warn('Could not get PIX QR Code:', error.message);
                }
            }
            res.json({
                subscription,
                limits,
                usage,
                pixQrCode, // Include PIX QR Code if subscription is pending PIX payment
            });
        }
        catch (error) {
            console.error('Erro ao buscar assinatura:', error);
            res.status(500).json({ error: error.message || 'Erro ao buscar assinatura' });
        }
    }
    /**
     * Update subscription (upgrade/downgrade)
     * PUT /api/subscriptions/:id
     */
    static async update(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const subscriptionId = parseInt(req.params.id);
            const { planType } = req.body;
            if (!planType || !['MONTHLY', 'YEARLY'].includes(planType)) {
                return res.status(400).json({ error: 'planType inválido' });
            }
            // Verify subscription belongs to user
            const subscription = await SubscriptionService_1.SubscriptionService.getSubscription(usuarioId);
            if (!subscription || subscription.id !== subscriptionId) {
                return res.status(403).json({ error: 'Assinatura não encontrada ou não pertence ao usuário' });
            }
            const updatedSubscription = await SubscriptionService_1.SubscriptionService.updateSubscription(subscriptionId, planType);
            res.json({
                subscription: updatedSubscription,
                message: 'Assinatura atualizada com sucesso',
            });
        }
        catch (error) {
            console.error('Erro ao atualizar assinatura:', error);
            res.status(500).json({ error: error.message || 'Erro ao atualizar assinatura' });
        }
    }
    /**
     * Cancel subscription
     * POST /api/subscriptions/:id/cancel
     */
    static async cancel(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const subscriptionId = parseInt(req.params.id);
            const { immediately } = req.body;
            // Verify subscription belongs to user
            const subscription = await SubscriptionService_1.SubscriptionService.getSubscription(usuarioId);
            if (!subscription || subscription.id !== subscriptionId) {
                return res.status(403).json({ error: 'Assinatura não encontrada ou não pertence ao usuário' });
            }
            const canceledSubscription = await SubscriptionService_1.SubscriptionService.cancelSubscription(subscriptionId, immediately === true);
            res.json({
                subscription: canceledSubscription,
                message: immediately ? 'Assinatura cancelada imediatamente' : 'Assinatura será cancelada ao final do período',
            });
        }
        catch (error) {
            console.error('Erro ao cancelar assinatura:', error);
            res.status(500).json({ error: error.message || 'Erro ao cancelar assinatura' });
        }
    }
    /**
     * Resume subscription
     * POST /api/subscriptions/:id/resume
     */
    static async resume(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const subscriptionId = parseInt(req.params.id);
            // Verify subscription belongs to user
            const subscription = await SubscriptionService_1.SubscriptionService.getSubscription(usuarioId);
            if (!subscription || subscription.id !== subscriptionId) {
                return res.status(403).json({ error: 'Assinatura não encontrada ou não pertence ao usuário' });
            }
            const resumedSubscription = await SubscriptionService_1.SubscriptionService.resumeSubscription(subscriptionId);
            res.json({
                subscription: resumedSubscription,
                message: 'Assinatura retomada com sucesso',
            });
        }
        catch (error) {
            console.error('Erro ao retomar assinatura:', error);
            res.status(500).json({ error: error.message || 'Erro ao retomar assinatura' });
        }
    }
    /**
     * Get available plans/pricing
     * GET /api/subscriptions/plans
     */
    static async getPlans(req, res) {
        try {
            const plans = await SubscriptionPlanService_1.SubscriptionPlanService.getPublicPlans();
            res.json({ plans });
        }
        catch (error) {
            console.error('Erro ao buscar planos:', error);
            res.status(500).json({ error: error.message || 'Erro ao buscar planos' });
        }
    }
    /**
     * Create lifetime payment
     * POST /api/subscriptions/lifetime
     */
    static async createLifetime(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const { paymentMethod, installmentCount, creditCard, creditCardHolderInfo, userCpfCnpj } = req.body;
            if (!paymentMethod) {
                return res.status(400).json({ error: 'paymentMethod é obrigatório' });
            }
            if (!['PIX', 'CREDIT_CARD'].includes(paymentMethod)) {
                return res.status(400).json({ error: 'paymentMethod deve ser PIX ou CREDIT_CARD' });
            }
            // Validate credit card data if payment method is CREDIT_CARD
            if (paymentMethod === 'CREDIT_CARD' && (!creditCard || !creditCardHolderInfo)) {
                return res.status(400).json({ error: 'creditCard e creditCardHolderInfo são obrigatórios para pagamento com cartão' });
            }
            const result = await SubscriptionService_1.SubscriptionService.createLifetimePayment({
                usuarioId,
                paymentMethod,
                installmentCount,
                creditCard,
                creditCardHolderInfo,
                userCpfCnpj, // CPF do usuário para PIX
            });
            res.json({
                subscriptionId: result.subscriptionId,
                asaasPaymentId: result.asaasPaymentId,
                pixQrCode: result.pixQrCode,
                status: result.status,
            });
        }
        catch (error) {
            console.error('Erro ao criar pagamento lifetime:', error);
            res.status(500).json({ error: error.message || 'Erro ao criar pagamento lifetime' });
        }
    }
    /**
     * Get usage statistics
     * GET /api/subscriptions/usage
     */
    static async getUsage(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const subscription = await SubscriptionService_1.SubscriptionService.getSubscription(usuarioId);
            const planType = await FeatureService_1.FeatureService.getUserPlanType(usuarioId);
            const limits = await FeatureService_1.FeatureService.getFeatureLimits(planType);
            const usage = {
                events: await FeatureService_1.FeatureService.getCurrentUsage(usuarioId, 'max_events'),
                // Add more usage metrics as needed
            };
            res.json({
                subscription,
                planType,
                limits,
                usage,
            });
        }
        catch (error) {
            console.error('Erro ao buscar uso:', error);
            res.status(500).json({ error: error.message || 'Erro ao buscar uso' });
        }
    }
    /**
     * Asaas webhook endpoint
     * POST /api/subscriptions/webhook
     */
    static async webhook(req, res) {
        try {
            const headers = req.headers;
            // Verify webhook signature
            const isValid = AsaasService_1.AsaasService.verifyWebhook(headers);
            if (!isValid) {
                console.warn('Invalid webhook signature');
                return res.status(400).json({ error: 'Invalid signature' });
            }
            const event = req.body;
            // Asaas webhook format
            // event.event = 'PAYMENT_RECEIVED', 'PAYMENT_CREATED', etc.
            // event.payment = payment object (if payment event)
            // event.subscription = subscription object (if subscription event)
            const resourceId = event.payment?.id || event.subscription?.id;
            if (!resourceId) {
                console.warn('No resource ID in webhook event');
                return res.status(400).json({ error: 'No resource ID' });
            }
            // Handle different event types
            switch (event.event) {
                case 'PAYMENT_CREATED':
                    // New payment created (for subscriptions, this is when a new billing cycle starts)
                    if (event.payment?.subscription) {
                        await SubscriptionService_1.SubscriptionService.syncAsaasSubscription(event.payment.subscription, event);
                    }
                    break;
                case 'PAYMENT_RECEIVED':
                    // Payment confirmed (PIX paid or card approved)
                    if (event.payment?.subscription) {
                        // For subscription payments
                        await SubscriptionService_1.SubscriptionService.syncAsaasSubscription(event.payment.subscription, event);
                    }
                    else if (event.payment?.id) {
                        // For one-time payments (LIFETIME)
                        const subscription = await SubscriptionService_1.SubscriptionService.getSubscriptionByAsaasPaymentId(event.payment.id);
                        if (subscription) {
                            await SubscriptionService_1.SubscriptionService.activateSubscription(subscription.id);
                        }
                    }
                    break;
                case 'PAYMENT_OVERDUE':
                    // Payment overdue - handled by syncAsaasSubscription
                    if (event.payment?.subscription) {
                        await SubscriptionService_1.SubscriptionService.syncAsaasSubscription(event.payment.subscription, event);
                    }
                    else if (event.payment?.id) {
                        // For one-time payments, just sync
                        const subscription = await SubscriptionService_1.SubscriptionService.getSubscriptionByAsaasPaymentId(event.payment.id);
                        if (subscription) {
                            subscription.status = 'EXPIRED';
                            // Let syncAsaasSubscription handle the update
                            await SubscriptionService_1.SubscriptionService.syncAsaasSubscription(event.payment.id, event);
                        }
                    }
                    break;
                case 'PAYMENT_REFUNDED':
                    // Payment refunded - handled by syncAsaasSubscription
                    if (event.payment?.subscription) {
                        await SubscriptionService_1.SubscriptionService.syncAsaasSubscription(event.payment.subscription, event);
                    }
                    else if (event.payment?.id) {
                        // For one-time payments, just sync
                        await SubscriptionService_1.SubscriptionService.syncAsaasSubscription(event.payment.id, event);
                    }
                    break;
                default:
                    console.log('Unhandled webhook event type:', event.event);
            }
            res.status(200).json({ received: true });
        }
        catch (error) {
            console.error('Erro ao processar webhook:', error);
            res.status(500).json({ error: 'Erro ao processar webhook' });
        }
    }
}
exports.SubscriptionController = SubscriptionController;
