"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureController = void 0;
const FeatureService_1 = require("../services/FeatureService");
class FeatureController {
    /**
     * Check feature access
     * GET /api/features/check?featureKey=xxx
     */
    static async check(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const { featureKey } = req.query;
            if (!featureKey) {
                return res.status(400).json({ error: 'featureKey é obrigatório' });
            }
            const hasAccess = await FeatureService_1.FeatureService.checkFeature(usuarioId, featureKey);
            res.json({
                featureKey,
                hasAccess,
            });
        }
        catch (error) {
            console.error('Erro ao verificar feature:', error);
            res.status(500).json({ error: error.message || 'Erro ao verificar feature' });
        }
    }
    /**
     * Get current limits
     * GET /api/features/limits
     */
    static async getLimits(req, res) {
        try {
            const usuarioId = req.usuarioId;
            const planType = await FeatureService_1.FeatureService.getUserPlanType(usuarioId);
            const limits = await FeatureService_1.FeatureService.getFeatureLimits(planType);
            const usage = {
                events: await FeatureService_1.FeatureService.getCurrentUsage(usuarioId, 'max_events'),
            };
            res.json({
                planType,
                limits,
                usage,
            });
        }
        catch (error) {
            console.error('Erro ao buscar limites:', error);
            res.status(500).json({ error: error.message || 'Erro ao buscar limites' });
        }
    }
}
exports.FeatureController = FeatureController;
