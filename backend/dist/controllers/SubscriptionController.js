"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionController = void 0;
const SubscriptionService_1 = require("../services/SubscriptionService");
const PayPalService_1 = require("../services/PayPalService");
const FeatureService_1 = require("../services/FeatureService");
const SubscriptionPlanService_1 = require("../services/SubscriptionPlanService");
class SubscriptionController {
    /**
     * Create subscription (returns PayPal approval URL)
     * POST /api/subscriptions
     */
    static async create(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const { planType, returnUrl, cancelUrl } = req.body;
            if (!planType || !returnUrl || !cancelUrl) {
                return res.status(400).json({ error: 'planType, returnUrl e cancelUrl são obrigatórios' });
            }
            if (!['MONTHLY', 'YEARLY'].includes(planType)) {
                return res.status(400).json({ error: 'planType deve ser MONTHLY ou YEARLY' });
            }
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const fullReturnUrl = returnUrl.startsWith('http') ? returnUrl : `${frontendUrl}${returnUrl}`;
            const fullCancelUrl = cancelUrl.startsWith('http') ? cancelUrl : `${frontendUrl}${cancelUrl}`;
            const result = await SubscriptionService_1.SubscriptionService.createSubscription({
                usuarioId,
                planType,
                returnUrl: fullReturnUrl,
                cancelUrl: fullCancelUrl,
            });
            res.json({
                subscriptionId: result.subscriptionId,
                approvalUrl: result.approvalUrl,
            });
        }
        catch (error) {
            console.error('Erro ao criar assinatura:', error);
            res.status(500).json({ error: error.message || 'Erro ao criar assinatura' });
        }
    }
    /**
     * Activate subscription after PayPal approval
     * POST /api/subscriptions/activate
     */
    static async activate(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const { subscriptionId, payerId, subscription_id, ba_token } = req.body;
            const { subscription_id: subscriptionIdQuery, ba_token: baTokenQuery, PayerID, token } = req.query; // PayPal return params
            // PayPal returns: subscription_id (PayPal subscription ID) and ba_token (billing agreement token)
            // Priority: query params (from PayPal redirect) > body params
            const paypalSubscriptionId = subscription_id || subscriptionIdQuery || subscriptionId || token;
            const baToken = ba_token || baTokenQuery || payerId || PayerID;
            if (!paypalSubscriptionId || !baToken) {
                return res.status(400).json({ error: 'subscription_id (PayPal) e ba_token são obrigatórios' });
            }
            // Find subscription by PayPal subscription ID
            const subscription = await SubscriptionService_1.SubscriptionService.getSubscriptionByPayPalId(paypalSubscriptionId);
            if (!subscription || subscription.usuarioId !== usuarioId) {
                return res.status(403).json({ error: 'Assinatura não encontrada ou não pertence ao usuário' });
            }
            // Activate subscription
            const activatedSubscription = await SubscriptionService_1.SubscriptionService.activateSubscription(subscription.id, baToken);
            res.json({
                subscription: activatedSubscription,
                message: 'Assinatura ativada com sucesso',
            });
        }
        catch (error) {
            console.error('Erro ao ativar assinatura:', error);
            res.status(500).json({ error: error.message || 'Erro ao ativar assinatura' });
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
            // If subscription is pending, try to get approval URL from PayPal
            let approvalUrl = undefined;
            if (subscription && subscription.status === 'APPROVAL_PENDING' && subscription.paypalSubscriptionId) {
                try {
                    const paypalSubscription = await PayPalService_1.PayPalService.getSubscription(subscription.paypalSubscriptionId);
                    // PayPal subscriptions in APPROVAL_PENDING status have approval links
                    const approvalLink = paypalSubscription.links?.find((link) => link.rel === 'approve' || link.rel === 'approval_url');
                    if (approvalLink) {
                        approvalUrl = approvalLink.href;
                    }
                }
                catch (error) {
                    console.warn('Could not get approval URL from PayPal:', error.message);
                }
            }
            res.json({
                subscription,
                limits,
                usage,
                approvalUrl, // Include approval URL if subscription is pending
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
     * Create lifetime order
     * POST /api/subscriptions/lifetime
     */
    static async createLifetime(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const { promoCode, returnUrl, cancelUrl } = req.body;
            const lifetimePlan = await SubscriptionPlanService_1.SubscriptionPlanService.getPlanByType('LIFETIME');
            if (!lifetimePlan || !lifetimePlan.enabled) {
                return res.status(400).json({ error: 'Plano lifetime não disponível' });
            }
            const lifetimeAmount = parseFloat(lifetimePlan.price.toString());
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const fullReturnUrl = returnUrl.startsWith('http') ? returnUrl : `${frontendUrl}${returnUrl}`;
            const fullCancelUrl = cancelUrl.startsWith('http') ? cancelUrl : `${frontendUrl}${cancelUrl}`;
            // TODO: Validate promo code if provided
            let finalAmount = lifetimeAmount;
            if (promoCode) {
                // Apply discount if promo code is valid
                // This will be implemented when promo code system is ready
            }
            const order = await PayPalService_1.PayPalService.createOrder({
                amount: {
                    value: finalAmount.toFixed(2),
                    currency_code: 'BRL',
                },
                description: 'Assinatura PRO Vitalício - Rachid',
                returnUrl: fullReturnUrl,
                cancelUrl: fullCancelUrl,
            });
            res.json({
                orderId: order.id,
                approvalUrl: order.approvalUrl,
                amount: finalAmount,
            });
        }
        catch (error) {
            console.error('Erro ao criar pedido lifetime:', error);
            res.status(500).json({ error: error.message || 'Erro ao criar pedido lifetime' });
        }
    }
    /**
     * Capture lifetime payment
     * POST /api/subscriptions/lifetime/capture
     */
    static async captureLifetime(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const { orderId, promoCode } = req.body;
            if (!orderId) {
                return res.status(400).json({ error: 'orderId é obrigatório' });
            }
            // Capture order in PayPal
            const capturedOrder = await PayPalService_1.PayPalService.captureOrder(orderId);
            if (capturedOrder.status !== 'COMPLETED') {
                return res.status(400).json({ error: 'Pagamento não foi completado' });
            }
            // Create lifetime subscription
            const subscription = await SubscriptionService_1.SubscriptionService.applyLifetimePromo(usuarioId, promoCode || '', orderId);
            res.json({
                subscription,
                order: capturedOrder,
                message: 'Assinatura lifetime ativada com sucesso',
            });
        }
        catch (error) {
            console.error('Erro ao capturar pagamento lifetime:', error);
            res.status(500).json({ error: error.message || 'Erro ao capturar pagamento lifetime' });
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
     * PayPal webhook endpoint
     * POST /api/subscriptions/webhook
     */
    static async webhook(req, res) {
        try {
            const body = JSON.stringify(req.body);
            const headers = req.headers;
            // Verify webhook signature
            const isValid = await PayPalService_1.PayPalService.verifyWebhookSignature(headers, body);
            if (!isValid) {
                console.warn('Invalid webhook signature');
                return res.status(400).json({ error: 'Invalid signature' });
            }
            const event = req.body;
            // Handle different event types
            switch (event.event_type) {
                case 'BILLING.SUBSCRIPTION.CREATED':
                case 'BILLING.SUBSCRIPTION.UPDATED':
                case 'BILLING.SUBSCRIPTION.ACTIVATED':
                case 'BILLING.SUBSCRIPTION.SUSPENDED':
                case 'BILLING.SUBSCRIPTION.CANCELLED':
                    if (event.resource?.id) {
                        await SubscriptionService_1.SubscriptionService.syncPayPalSubscription(event.resource.id, event);
                    }
                    break;
                case 'PAYMENT.SALE.COMPLETED':
                    // Handle successful payment
                    if (event.resource?.billing_agreement_id) {
                        await SubscriptionService_1.SubscriptionService.syncPayPalSubscription(event.resource.billing_agreement_id, event);
                    }
                    break;
                case 'PAYMENT.SALE.DENIED':
                    // Handle failed payment
                    if (event.resource?.billing_agreement_id) {
                        await SubscriptionService_1.SubscriptionService.syncPayPalSubscription(event.resource.billing_agreement_id, event);
                    }
                    break;
                default:
                    console.log('Unhandled webhook event type:', event.event_type);
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
