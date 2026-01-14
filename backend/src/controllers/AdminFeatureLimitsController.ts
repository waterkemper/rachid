import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { FeatureService } from '../services/FeatureService';
import { PlanLimitType, FeatureLimitKey } from '../entities/PlanLimit';

export class AdminFeatureLimitsController {
  /**
   * Get all plan limits
   * GET /api/admin/feature-limits
   */
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const limits = await FeatureService.getAllPlanLimits();
      res.json(limits);
    } catch (error: any) {
      console.error('Erro ao buscar limites:', error);
      res.status(500).json({ error: error.message || 'Erro ao buscar limites' });
    }
  }

  /**
   * Get limits for specific plan
   * GET /api/admin/feature-limits/:planType
   */
  static async getByPlanType(req: AuthRequest, res: Response) {
    try {
      const { planType } = req.params;
      
      if (!['FREE', 'PRO', 'LIFETIME'].includes(planType)) {
        return res.status(400).json({ error: 'planType inválido' });
      }

      const limits = await FeatureService.getFeatureLimits(planType as PlanLimitType);
      res.json({ planType, limits });
    } catch (error: any) {
      console.error('Erro ao buscar limites do plano:', error);
      res.status(500).json({ error: error.message || 'Erro ao buscar limites do plano' });
    }
  }

  /**
   * Update a specific limit
   * PUT /api/admin/feature-limits/:planType/:featureKey
   */
  static async update(req: AuthRequest, res: Response) {
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

      const updates: any = {};
      if (limitValue !== undefined) {
        updates.limitValue = limitValue === null ? null : parseInt(limitValue);
      }
      if (enabled !== undefined) {
        updates.enabled = enabled === null ? null : Boolean(enabled);
      }
      if (description !== undefined) {
        updates.description = description;
      }

      const updatedLimit = await FeatureService.updatePlanLimit(
        planType as PlanLimitType,
        featureKey as FeatureLimitKey,
        updates
      );

      res.json({
        message: 'Limite atualizado com sucesso',
        limit: updatedLimit,
      });
    } catch (error: any) {
      console.error('Erro ao atualizar limite:', error);
      res.status(500).json({ error: error.message || 'Erro ao atualizar limite' });
    }
  }

  /**
   * Get change history for limits
   * GET /api/admin/feature-limits/history
   * Note: This would require a history/audit table for plan_limits
   */
  static async getHistory(req: AuthRequest, res: Response) {
    try {
      // TODO: Implement history tracking for plan_limits changes
      // For now, return empty array
      res.json({ history: [] });
    } catch (error: any) {
      console.error('Erro ao buscar histórico:', error);
      res.status(500).json({ error: error.message || 'Erro ao buscar histórico' });
    }
  }
}