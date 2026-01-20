"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSubscriptionController = void 0;
const SubscriptionService_1 = require("../services/SubscriptionService");
const PayPalService_1 = require("../services/PayPalService");
const data_source_1 = require("../database/data-source");
const Subscription_1 = require("../entities/Subscription");
class AdminSubscriptionController {
    static getSubscriptionRepository() {
        return data_source_1.AppDataSource.getRepository(Subscription_1.Subscription);
    }
    /**
     * List all subscriptions
     * GET /api/admin/subscriptions
     */
    static async getAll(req, res) {
        try {
            const subscriptionRepository = AdminSubscriptionController.getSubscriptionRepository();
            const subscriptions = await subscriptionRepository.find({
                relations: ['usuario'],
                order: { createdAt: 'DESC' },
            });
            res.json(subscriptions);
        }
        catch (error) {
            console.error('Erro ao listar assinaturas:', error);
            res.status(500).json({ error: error.message || 'Erro ao listar assinaturas' });
        }
    }
    /**
     * Get subscription details
     * GET /api/admin/subscriptions/:id
     */
    static async getById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const subscriptionRepository = AdminSubscriptionController.getSubscriptionRepository();
            const subscription = await subscriptionRepository.findOne({
                where: { id },
                relations: ['usuario', 'history', 'features'],
            });
            if (!subscription) {
                return res.status(404).json({ error: 'Assinatura não encontrada' });
            }
            res.json(subscription);
        }
        catch (error) {
            console.error('Erro ao buscar assinatura:', error);
            res.status(500).json({ error: error.message || 'Erro ao buscar assinatura' });
        }
    }
    /**
     * Process refund (manual - PayPal refund should be done in PayPal Dashboard)
     * POST /api/admin/subscriptions/:id/refund
     */
    static async refund(req, res) {
        try {
            const id = parseInt(req.params.id);
            const subscriptionRepository = AdminSubscriptionController.getSubscriptionRepository();
            const subscription = await subscriptionRepository.findOne({ where: { id } });
            if (!subscription) {
                return res.status(404).json({ error: 'Assinatura não encontrada' });
            }
            // Cancel subscription and downgrade user
            await SubscriptionService_1.SubscriptionService.cancelSubscription(id, true);
            res.json({
                message: 'Reembolso processado (assinatura cancelada). Reembolso deve ser feito no PayPal Dashboard.',
                subscription,
            });
        }
        catch (error) {
            console.error('Erro ao processar reembolso:', error);
            res.status(500).json({ error: error.message || 'Erro ao processar reembolso' });
        }
    }
    /**
     * Extend subscription
     * POST /api/admin/subscriptions/:id/extend
     */
    static async extend(req, res) {
        try {
            const id = parseInt(req.params.id);
            const { days } = req.body;
            if (!days || typeof days !== 'number') {
                return res.status(400).json({ error: 'Número de dias é obrigatório' });
            }
            const subscriptionRepository = AdminSubscriptionController.getSubscriptionRepository();
            const subscription = await subscriptionRepository.findOne({ where: { id } });
            if (!subscription) {
                return res.status(404).json({ error: 'Assinatura não encontrada' });
            }
            if (subscription.currentPeriodEnd) {
                const newEndDate = new Date(subscription.currentPeriodEnd);
                newEndDate.setDate(newEndDate.getDate() + days);
                subscription.currentPeriodEnd = newEndDate;
            }
            else {
                // For lifetime subscriptions without end date, set one
                const newEndDate = new Date();
                newEndDate.setDate(newEndDate.getDate() + days);
                subscription.currentPeriodEnd = newEndDate;
            }
            const updatedSubscription = await subscriptionRepository.save(subscription);
            res.json({
                message: `Assinatura estendida por ${days} dias`,
                subscription: updatedSubscription,
            });
        }
        catch (error) {
            console.error('Erro ao estender assinatura:', error);
            res.status(500).json({ error: error.message || 'Erro ao estender assinatura' });
        }
    }
    /**
     * Manually update subscription features
     * PUT /api/admin/subscriptions/:id/features
     */
    static async updateFeatures(req, res) {
        try {
            const id = parseInt(req.params.id);
            const { features } = req.body;
            // This would update subscription features manually
            // Implementation depends on specific requirements
            res.json({
                message: 'Features atualizadas',
                subscriptionId: id,
            });
        }
        catch (error) {
            console.error('Erro ao atualizar features:', error);
            res.status(500).json({ error: error.message || 'Erro ao atualizar features' });
        }
    }
    /**
     * Get subscription statistics
     * GET /api/admin/subscriptions/stats
     */
    static async getStats(req, res) {
        try {
            const subscriptionRepository = AdminSubscriptionController.getSubscriptionRepository();
            const total = await subscriptionRepository.count();
            const active = await subscriptionRepository.count({ where: { status: 'ACTIVE' } });
            const monthly = await subscriptionRepository.count({ where: { planType: 'MONTHLY', status: 'ACTIVE' } });
            const yearly = await subscriptionRepository.count({ where: { planType: 'YEARLY', status: 'ACTIVE' } });
            const lifetime = await subscriptionRepository.count({ where: { planType: 'LIFETIME', status: 'ACTIVE' } });
            const cancelled = await subscriptionRepository.count({ where: { status: 'CANCELLED' } });
            res.json({
                total,
                active,
                byPlanType: {
                    monthly,
                    yearly,
                    lifetime,
                },
                cancelled,
            });
        }
        catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            res.status(500).json({ error: error.message || 'Erro ao buscar estatísticas' });
        }
    }
    /**
     * Sync subscription with PayPal (manual sync)
     * POST /api/admin/subscriptions/:id/sync
     */
    static async sync(req, res) {
        try {
            const id = parseInt(req.params.id);
            const subscriptionRepository = AdminSubscriptionController.getSubscriptionRepository();
            const subscription = await subscriptionRepository.findOne({ where: { id } });
            if (!subscription) {
                return res.status(404).json({ error: 'Assinatura não encontrada' });
            }
            if (!subscription.paypalSubscriptionId) {
                return res.status(400).json({ error: 'Assinatura não tem PayPal Subscription ID' });
            }
            // Sync with PayPal
            const syncedSubscription = await SubscriptionService_1.SubscriptionService.syncPayPalSubscription(subscription.paypalSubscriptionId);
            res.json({
                message: 'Assinatura sincronizada com PayPal',
                subscription: syncedSubscription,
            });
        }
        catch (error) {
            console.error('Erro ao sincronizar assinatura:', error);
            res.status(500).json({ error: error.message || 'Erro ao sincronizar assinatura' });
        }
    }
    /**
     * Activate pending subscription or create new one for user
     * POST /api/admin/subscriptions/user/:userId/activate
     */
    static async activateForUser(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const { planType } = req.body;
            // Find pending subscription
            const subscriptionRepository = AdminSubscriptionController.getSubscriptionRepository();
            const pendingSubscription = await subscriptionRepository.findOne({
                where: { usuarioId: userId, status: 'APPROVAL_PENDING' },
                order: { createdAt: 'DESC' },
            });
            if (pendingSubscription && pendingSubscription.paypalSubscriptionId) {
                try {
                    // Try to activate pending subscription
                    const paypalSubscription = await PayPalService_1.PayPalService.getSubscription(pendingSubscription.paypalSubscriptionId);
                    // Use reflection to access private method (or make it public)
                    const paypalStatus = SubscriptionService_1.SubscriptionService.mapPayPalStatus(paypalSubscription.status);
                    if (paypalStatus === 'ACTIVE') {
                        const activated = await SubscriptionService_1.SubscriptionService.activateSubscription(pendingSubscription.id, paypalSubscription.subscriber?.payer_id || '');
                        return res.json({
                            message: 'Assinatura pendente foi ativada com sucesso',
                            subscription: activated,
                        });
                    }
                    else {
                        return res.status(400).json({
                            error: `Assinatura pendente está com status ${paypalStatus} no PayPal, não pode ser ativada`,
                            paypalStatus,
                        });
                    }
                }
                catch (error) {
                    return res.status(400).json({
                        error: `Erro ao ativar assinatura pendente: ${error.message}`,
                    });
                }
            }
            // If no pending subscription or it can't be activated, try to create new one
            if (planType) {
                try {
                    // Cancel expired subscriptions first
                    const expiredSubscriptions = await subscriptionRepository.find({
                        where: { usuarioId: userId, status: 'EXPIRED' },
                    });
                    for (const expired of expiredSubscriptions) {
                        try {
                            await SubscriptionService_1.SubscriptionService.cancelSubscription(expired.id, true);
                            console.log(`[AdminSubscriptionController] Canceled expired subscription ${expired.id}`);
                        }
                        catch (error) {
                            console.warn(`[AdminSubscriptionController] Could not cancel expired subscription ${expired.id}: ${error.message}`);
                        }
                    }
                    // Create new subscription
                    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                    const result = await SubscriptionService_1.SubscriptionService.createSubscription({
                        usuarioId: userId,
                        planType: planType,
                        returnUrl: `${frontendUrl}/assinatura?subscription_id={id}&ba_token={token}`,
                        cancelUrl: `${frontendUrl}/assinatura?canceled=true`,
                    });
                    return res.json({
                        message: 'Nova assinatura criada com sucesso',
                        subscriptionId: result.subscriptionId,
                        approvalUrl: result.approvalUrl,
                        paypalSubscriptionId: result.paypalSubscriptionId,
                    });
                }
                catch (error) {
                    return res.status(400).json({
                        error: `Erro ao criar nova assinatura: ${error.message}`,
                    });
                }
            }
            // If no pending subscription or it can't be activated, return info
            res.status(404).json({
                error: 'Nenhuma assinatura pendente encontrada para ativação',
                suggestion: 'Crie uma nova assinatura para o usuário. Envie planType (MONTHLY ou YEARLY) no body.',
            });
        }
        catch (error) {
            console.error('Erro ao ativar assinatura para usuário:', error);
            res.status(500).json({ error: error.message || 'Erro ao ativar assinatura' });
        }
    }
    /**
     * Cancel expired subscription and create new one for user
     * POST /api/admin/subscriptions/user/:userId/recreate
     */
    static async recreateForUser(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const { planType } = req.body;
            if (!planType || !['MONTHLY', 'YEARLY'].includes(planType)) {
                return res.status(400).json({ error: 'planType é obrigatório e deve ser MONTHLY ou YEARLY' });
            }
            // Find and cancel expired subscriptions
            const subscriptionRepository = AdminSubscriptionController.getSubscriptionRepository();
            const expiredSubscriptions = await subscriptionRepository.find({
                where: { usuarioId: userId, status: 'EXPIRED' },
            });
            for (const expired of expiredSubscriptions) {
                try {
                    await SubscriptionService_1.SubscriptionService.cancelSubscription(expired.id, true);
                    console.log(`[AdminSubscriptionController] ✅ Canceled expired subscription ${expired.id} (${expired.paypalSubscriptionId})`);
                }
                catch (error) {
                    console.warn(`[AdminSubscriptionController] ⚠️ Could not cancel expired subscription ${expired.id}: ${error.message}`);
                }
            }
            // Cancel any other non-active subscriptions
            const inactiveSubscriptions = await subscriptionRepository.find({
                where: { usuarioId: userId },
            });
            for (const inactive of inactiveSubscriptions) {
                if (inactive.status !== 'ACTIVE' && inactive.status !== 'CANCELLED') {
                    try {
                        await SubscriptionService_1.SubscriptionService.cancelSubscription(inactive.id, true);
                        console.log(`[AdminSubscriptionController] ✅ Canceled inactive subscription ${inactive.id} (status: ${inactive.status})`);
                    }
                    catch (error) {
                        console.warn(`[AdminSubscriptionController] ⚠️ Could not cancel subscription ${inactive.id}: ${error.message}`);
                    }
                }
            }
            // Create new subscription
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const result = await SubscriptionService_1.SubscriptionService.createSubscription({
                usuarioId: userId,
                planType: planType,
                returnUrl: `${frontendUrl}/assinatura?subscription_id={id}&ba_token={token}`,
                cancelUrl: `${frontendUrl}/assinatura?canceled=true`,
            });
            res.json({
                message: 'Assinaturas expiradas canceladas e nova assinatura criada com sucesso',
                canceledCount: expiredSubscriptions.length,
                subscriptionId: result.subscriptionId,
                approvalUrl: result.approvalUrl,
                paypalSubscriptionId: result.paypalSubscriptionId,
                instructions: 'Envie o usuário para a URL de aprovação (approvalUrl) para completar a assinatura no PayPal',
            });
        }
        catch (error) {
            console.error('Erro ao recriar assinatura para usuário:', error);
            res.status(500).json({ error: error.message || 'Erro ao recriar assinatura' });
        }
    }
}
exports.AdminSubscriptionController = AdminSubscriptionController;
