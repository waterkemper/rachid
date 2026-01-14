"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePro = requirePro;
const SubscriptionService_1 = require("../services/SubscriptionService");
/**
 * Middleware to require PRO or LIFETIME subscription
 * Returns 402 Payment Required if user doesn't have active PRO/LIFETIME
 */
async function requirePro(req, res, next) {
    try {
        const usuarioId = req.usuarioId;
        if (!usuarioId) {
            return res.status(401).json({ error: 'Não autenticado' });
        }
        const subscription = await SubscriptionService_1.SubscriptionService.getSubscription(usuarioId);
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
        // Check if subscription is still valid
        if (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) < new Date()) {
            return res.status(402).json({
                error: 'Assinatura expirada',
                errorCode: 'SUBSCRIPTION_EXPIRED',
                upgradeUrl: '/precos',
            });
        }
        next();
    }
    catch (error) {
        console.error('Erro no middleware requirePro:', error);
        res.status(500).json({ error: 'Erro ao verificar assinatura' });
    }
}
