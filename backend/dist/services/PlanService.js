"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanService = void 0;
const data_source_1 = require("../database/data-source");
const Usuario_1 = require("../entities/Usuario");
const SubscriptionService_1 = require("./SubscriptionService");
class PlanService {
    /**
     * Check if user has active PRO or LIFETIME subscription
     * This method now uses the new subscription system
     */
    static async isPro(usuarioId) {
        const usuario = await this.usuarioRepository.findOne({ where: { id: usuarioId } });
        if (!usuario)
            return false;
        // Check subscription status
        const subscription = await SubscriptionService_1.SubscriptionService.getSubscription(usuarioId);
        if (subscription && subscription.status === 'ACTIVE') {
            return subscription.planType === 'MONTHLY' || subscription.planType === 'YEARLY' || subscription.planType === 'LIFETIME';
        }
        // Fallback to legacy plan check for backwards compatibility
        if (usuario.plano === 'PRO' || usuario.plano === 'LIFETIME') {
            if (!usuario.planoValidoAte)
                return true; // LIFETIME or PRO without expiration
            return usuario.planoValidoAte.getTime() > Date.now();
        }
        return false;
    }
}
exports.PlanService = PlanService;
PlanService.usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
