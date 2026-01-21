import { AppDataSource } from '../database/data-source';
import { Usuario } from '../entities/Usuario';
import { SubscriptionService } from './SubscriptionService';

export class PlanService {
  private static usuarioRepository = AppDataSource.getRepository(Usuario);

  /**
   * Check if user has active PRO or LIFETIME subscription
   * This method now uses the new subscription system
   */
  static async isPro(usuarioId: number): Promise<boolean> {
    const usuario = await this.usuarioRepository.findOne({ where: { id: usuarioId } });
    if (!usuario) return false;

    // Check subscription status
    const subscription = await SubscriptionService.getSubscription(usuarioId);
    if (subscription && subscription.status === 'ACTIVE') {
      return subscription.planType === 'MONTHLY' || subscription.planType === 'YEARLY' || subscription.planType === 'LIFETIME';
    }

    // Fallback to legacy plan check for backwards compatibility
    if (usuario.plano === 'PRO' || usuario.plano === 'LIFETIME') {
      if (!usuario.planoValidoAte) return true; // LIFETIME or PRO without expiration
      return usuario.planoValidoAte.getTime() > Date.now();
    }

    return false;
  }
}

