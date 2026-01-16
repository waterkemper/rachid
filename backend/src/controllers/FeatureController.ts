import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { FeatureService } from '../services/FeatureService';

export class FeatureController {
  /**
   * Check feature access
   * GET /api/features/check?featureKey=xxx
   */
  static async check(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.usuarioId!;
      const { featureKey } = req.query;

      if (!featureKey) {
        return res.status(400).json({ error: 'featureKey é obrigatório' });
      }

      const hasAccess = await FeatureService.checkFeature(usuarioId, featureKey as any);

      res.json({
        featureKey,
        hasAccess,
      });
    } catch (error: any) {
      console.error('Erro ao verificar feature:', error);
      res.status(500).json({ error: error.message || 'Erro ao verificar feature' });
    }
  }

  /**
   * Get current limits
   * GET /api/features/limits
   */
  static async getLimits(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.usuarioId!;

      const planType = await FeatureService.getUserPlanType(usuarioId);
      const limits = await FeatureService.getFeatureLimits(planType);
      const usage = {
        events: await FeatureService.getCurrentUsage(usuarioId, 'max_events'),
      };

      res.json({
        planType,
        limits,
        usage,
      });
    } catch (error: any) {
      console.error('Erro ao buscar limites:', error);
      res.status(500).json({ error: error.message || 'Erro ao buscar limites' });
    }
  }

  /**
   * Get public plan limits (for pricing page)
   * GET /api/features/plan-limits
   */
  static async getPublicPlanLimits(req: any, res: Response) {
    try {
      const limits = await FeatureService.getAllPlanLimits();
      res.json(limits);
    } catch (error: any) {
      console.error('Erro ao buscar limites públicos dos planos:', error);
      res.status(500).json({ error: error.message || 'Erro ao buscar limites dos planos' });
    }
  }
}