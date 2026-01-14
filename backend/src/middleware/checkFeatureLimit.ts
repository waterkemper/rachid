import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { FeatureService } from '../services/FeatureService';
import { FeatureLimitKey } from '../entities/PlanLimit';

/**
 * Middleware to check feature limits
 * Usage: checkFeatureLimit('max_events')
 */
export function checkFeatureLimit(featureKey: FeatureLimitKey) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const usuarioId = req.usuarioId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const currentUsage = await FeatureService.getCurrentUsage(usuarioId, featureKey);
      const limitCheck = await FeatureService.enforceLimit(usuarioId, featureKey, currentUsage);

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
      (req as any).featureLimit = limitCheck;

      next();
    } catch (error) {
      console.error(`Erro no middleware checkFeatureLimit (${featureKey}):`, error);
      res.status(500).json({ error: 'Erro ao verificar limite' });
    }
  };
}