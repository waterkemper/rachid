"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminFeatureLimitsController = void 0;
const FeatureService_1 = require("../services/FeatureService");
class AdminFeatureLimitsController {
    /**
     * Get all plan limits
     * GET /api/admin/feature-limits
     */
    static async getAll(req, res) {
        try {
            const limits = await FeatureService_1.FeatureService.getAllPlanLimits();
            res.json(limits);
        }
        catch (error) {
            console.error('Erro ao buscar limites:', error);
            res.status(500).json({ error: error.message || 'Erro ao buscar limites' });
        }
    }
    /**
     * Get limits for specific plan
     * GET /api/admin/feature-limits/:planType
     */
    static async getByPlanType(req, res) {
        try {
            const { planType } = req.params;
            if (!['FREE', 'PRO', 'LIFETIME'].includes(planType)) {
                return res.status(400).json({ error: 'planType inválido' });
            }
            const limits = await FeatureService_1.FeatureService.getFeatureLimits(planType);
            res.json({ planType, limits });
        }
        catch (error) {
            console.error('Erro ao buscar limites do plano:', error);
            res.status(500).json({ error: error.message || 'Erro ao buscar limites do plano' });
        }
    }
    /**
     * Update a specific limit
     * PUT /api/admin/feature-limits/:planType/:featureKey
     */
    static async update(req, res) {
        try {
            const { planType, featureKey } = req.params;
            const { limitValue, enabled, description } = req.body;
            if (!['FREE', 'PRO', 'LIFETIME'].includes(planType)) {
                return res.status(400).json({ error: 'planType inválido' });
            }
            const validFeatureKeys = [
                'max_events',
                'max_participants_per_event',
                'pdf_export_enabled',
                'public_sharing_enabled',
                'templates_enabled',
                'email_notifications_enabled',
                'analytics_enabled',
            ];
            if (!validFeatureKeys.includes(featureKey)) {
                return res.status(400).json({ error: 'featureKey inválido' });
            }
            const updates = {};
            if (limitValue !== undefined) {
                updates.limitValue = limitValue === null ? null : parseInt(limitValue);
            }
            if (enabled !== undefined) {
                updates.enabled = enabled === null ? null : Boolean(enabled);
            }
            if (description !== undefined) {
                updates.description = description;
            }
            const updatedLimit = await FeatureService_1.FeatureService.updatePlanLimit(planType, featureKey, updates);
            res.json({
                message: 'Limite atualizado com sucesso',
                limit: updatedLimit,
            });
        }
        catch (error) {
            console.error('Erro ao atualizar limite:', error);
            res.status(500).json({ error: error.message || 'Erro ao atualizar limite' });
        }
    }
    /**
     * Get change history for limits
     * GET /api/admin/feature-limits/history
     * Note: This would require a history/audit table for plan_limits
     */
    static async getHistory(req, res) {
        try {
            // TODO: Implement history tracking for plan_limits changes
            // For now, return empty array
            res.json({ history: [] });
        }
        catch (error) {
            console.error('Erro ao buscar histórico:', error);
            res.status(500).json({ error: error.message || 'Erro ao buscar histórico' });
        }
    }
}
exports.AdminFeatureLimitsController = AdminFeatureLimitsController;
