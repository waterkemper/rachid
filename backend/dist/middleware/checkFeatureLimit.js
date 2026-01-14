"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkFeatureLimit = checkFeatureLimit;
const FeatureService_1 = require("../services/FeatureService");
/**
 * Middleware to check feature limits
 * Usage: checkFeatureLimit('max_events')
 */
function checkFeatureLimit(featureKey) {
    return async (req, res, next) => {
        try {
            const usuarioId = req.usuarioId;
            if (!usuarioId) {
                return res.status(401).json({ error: 'Não autenticado' });
            }
            const currentUsage = await FeatureService_1.FeatureService.getCurrentUsage(usuarioId, featureKey);
            const limitCheck = await FeatureService_1.FeatureService.enforceLimit(usuarioId, featureKey, currentUsage);
            if (!limitCheck.allowed) {
                return res.status(402).json({
                    error: `Limite de ${featureKey} excedido`,
                    errorCode: 'LIMIT_EXCEEDED',
                    feature: featureKey,
                    limit: limitCheck.limit,
                    current: limitCheck.current,
                    upgradeUrl: '/precos',
                });
            }
            // Attach limit info to request for use in controller
            req.featureLimit = limitCheck;
            next();
        }
        catch (error) {
            console.error(`Erro no middleware checkFeatureLimit (${featureKey}):`, error);
            res.status(500).json({ error: 'Erro ao verificar limite' });
        }
    };
}
