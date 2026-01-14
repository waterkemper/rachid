"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSubscriptionController = void 0;
const SubscriptionService_1 = require("../services/SubscriptionService");
const data_source_1 = require("../database/data-source");
const Subscription_1 = require("../entities/Subscription");
class AdminSubscriptionController {
    /**
     * List all subscriptions
     * GET /api/admin/subscriptions
     */
    static async getAll(req, res) {
        try {
            const subscriptions = await this.subscriptionRepository.find({
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
            const subscription = await this.subscriptionRepository.findOne({
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
            const subscription = await this.subscriptionRepository.findOne({ where: { id } });
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
            const subscription = await this.subscriptionRepository.findOne({ where: { id } });
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
            const updatedSubscription = await this.subscriptionRepository.save(subscription);
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
            const total = await this.subscriptionRepository.count();
            const active = await this.subscriptionRepository.count({ where: { status: 'ACTIVE' } });
            const monthly = await this.subscriptionRepository.count({ where: { planType: 'MONTHLY', status: 'ACTIVE' } });
            const yearly = await this.subscriptionRepository.count({ where: { planType: 'YEARLY', status: 'ACTIVE' } });
            const lifetime = await this.subscriptionRepository.count({ where: { planType: 'LIFETIME', status: 'ACTIVE' } });
            const cancelled = await this.subscriptionRepository.count({ where: { status: 'CANCELLED' } });
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
}
exports.AdminSubscriptionController = AdminSubscriptionController;
AdminSubscriptionController.subscriptionRepository = data_source_1.AppDataSource.getRepository(Subscription_1.Subscription);
