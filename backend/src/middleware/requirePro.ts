import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { SubscriptionService } from '../services/SubscriptionService';

/**
 * Middleware to require PRO or LIFETIME subscription
 * Returns 402 Payment Required if user doesn't have active PRO/LIFETIME
 */
export async function requirePro(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const usuarioId = req.usuarioId;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const subscription = await SubscriptionService.getSubscription(usuarioId);

    if (!subscription) {
      return res.status(402).json({
        error: 'Assinatura PRO necessária',
        errorCode: 'PRO_REQUIRED',
        upgradeUrl: '/precos',
      });
    }

    if (subscription.status !== 'ACTIVE') {
      return res.status(402).json({
        error: 'Assinatura não está ativa',
        errorCode: 'SUBSCRIPTION_INACTIVE',
        status: subscription.status,
        upgradeUrl: '/precos',
      });
    }

    if (subscription.planType === 'LIFETIME') {
      return next();
    }

    // MONTHLY and YEARLY are PRO plans
    if (subscription.planType !== 'MONTHLY' && subscription.planType !== 'YEARLY') {
      return res.status(402).json({
        error: 'Assinatura PRO necessária',
        errorCode: 'PRO_REQUIRED',
        upgradeUrl: '/precos',
      });
    }

    // Check if subscription is still valid and handle expiration
    // First check trial end (if in trial period)
    const now = new Date();
    if (subscription.trialEnd && new Date(subscription.trialEnd) < now) {
      // Trial ended - check and update status
      await SubscriptionService.checkAndHandleExpiredSubscription(subscription);
      
      // Reload subscription to get updated status
      const updatedSubscription = await SubscriptionService.getSubscription(usuarioId);
      if (updatedSubscription && updatedSubscription.status !== 'ACTIVE') {
        return res.status(402).json({
          error: updatedSubscription.status === 'CANCELLED' ? 'Período de trial cancelado' : 'Período de trial expirado',
          errorCode: updatedSubscription.status === 'CANCELLED' ? 'SUBSCRIPTION_CANCELLED' : 'SUBSCRIPTION_EXPIRED',
          upgradeUrl: '/precos',
        });
      }
    }
    
    // Check regular period end (if not in trial or trial already ended)
    if (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) < now) {
      // Check and update expired subscription status
      await SubscriptionService.checkAndHandleExpiredSubscription(subscription);
      
      // Reload subscription to get updated status
      const updatedSubscription = await SubscriptionService.getSubscription(usuarioId);
      if (updatedSubscription && updatedSubscription.status !== 'ACTIVE') {
        return res.status(402).json({
          error: updatedSubscription.status === 'CANCELLED' ? 'Assinatura cancelada' : 'Assinatura expirada',
          errorCode: updatedSubscription.status === 'CANCELLED' ? 'SUBSCRIPTION_CANCELLED' : 'SUBSCRIPTION_EXPIRED',
          upgradeUrl: '/precos',
        });
      }
      
      return res.status(402).json({
        error: 'Assinatura expirada',
        errorCode: 'SUBSCRIPTION_EXPIRED',
        upgradeUrl: '/precos',
      });
    }
    
    // If in trial period, allow access until trialEnd
    if (subscription.trialEnd && new Date(subscription.trialEnd) > now) {
      return next(); // Allow access during trial
    }

    next();
  } catch (error) {
    console.error('Erro no middleware requirePro:', error);
    res.status(500).json({ error: 'Erro ao verificar assinatura' });
  }
}