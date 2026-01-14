"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureService = void 0;
const data_source_1 = require("../database/data-source");
const PlanLimit_1 = require("../entities/PlanLimit");
const Usuario_1 = require("../entities/Usuario");
const Grupo_1 = require("../entities/Grupo");
class FeatureService {
    /**
     * Check if user has access to a feature (by feature key or limit key)
     */
    static async checkFeature(usuarioId, featureKey) {
        // Map subscription feature keys to plan limit keys
        const featureKeyMap = {
            'pdf_export': 'pdf_export_enabled',
            'public_sharing': 'public_sharing_enabled',
            'templates': 'templates_enabled',
        };
        const mappedKey = featureKeyMap[featureKey] || featureKey;
        const usuario = await this.usuarioRepository.findOne({ where: { id: usuarioId } });
        if (!usuario) {
            return false;
        }
        // Determine plan type
        const planType = this.getPlanType(usuario);
        // Get limit for this plan and feature
        const limit = await this.planLimitRepository.findOne({
            where: { planType, featureKey: mappedKey },
        });
        if (!limit) {
            return false; // Feature not configured
        }
        // For boolean features (enabled/disabled)
        if (limit.enabled !== null && limit.enabled !== undefined) {
            return limit.enabled;
        }
        // For limit-based features, check if user has subscription
        // (limit_value will be checked in enforceLimit)
        // If limit_value is null, it means unlimited (PRO feature)
        return limit.limitValue === null;
    }
    /**
     * Enforce usage limit
     */
    static async enforceLimit(usuarioId, featureKey, currentUsage) {
        const usuario = await this.usuarioRepository.findOne({ where: { id: usuarioId } });
        if (!usuario) {
            return { allowed: false, current: currentUsage };
        }
        const planType = this.getPlanType(usuario);
        // Get limit for this plan and feature
        const limit = await this.planLimitRepository.findOne({
            where: { planType, featureKey },
        });
        if (!limit) {
            return { allowed: false, current: currentUsage };
        }
        // If limit_value is undefined or null, it means unlimited
        if (limit.limitValue === null || limit.limitValue === undefined) {
            return { allowed: true, current: currentUsage };
        }
        // Check if usage is within limit
        const allowed = currentUsage < limit.limitValue;
        return {
            allowed,
            limit: limit.limitValue,
            current: currentUsage,
        };
    }
    /**
     * Get feature limits for a plan type
     */
    static async getFeatureLimits(planType) {
        const limits = await this.planLimitRepository.find({
            where: { planType },
        });
        const result = {};
        for (const limit of limits) {
            result[limit.featureKey] = {
                limitValue: limit.limitValue,
                enabled: limit.enabled,
                description: limit.description,
            };
        }
        return result;
    }
    /**
     * Get all plan limits (for admin)
     */
    static async getAllPlanLimits() {
        const limits = await this.planLimitRepository.find({
            order: { planType: 'ASC', featureKey: 'ASC' },
        });
        const result = {
            FREE: {},
            PRO: {},
            LIFETIME: {},
        };
        for (const limit of limits) {
            result[limit.planType][limit.featureKey] = {
                id: limit.id,
                limitValue: limit.limitValue,
                enabled: limit.enabled,
                description: limit.description,
                createdAt: limit.createdAt,
                updatedAt: limit.updatedAt,
            };
        }
        return result;
    }
    /**
     * Update a plan limit (admin only)
     */
    static async updatePlanLimit(planType, featureKey, updates) {
        let limit = await this.planLimitRepository.findOne({
            where: { planType, featureKey },
        });
        if (!limit) {
            // Create new limit if it doesn't exist
            const createData = {
                planType,
                featureKey,
            };
            if (updates.limitValue !== undefined && updates.limitValue !== null) {
                createData.limitValue = updates.limitValue;
            }
            if (updates.enabled !== undefined && updates.enabled !== null) {
                createData.enabled = updates.enabled;
            }
            if (updates.description !== undefined) {
                createData.description = updates.description;
            }
            limit = this.planLimitRepository.create(createData);
        }
        else {
            // Update existing limit
            if (updates.limitValue !== undefined) {
                limit.limitValue = updates.limitValue === null ? undefined : updates.limitValue;
            }
            if (updates.enabled !== undefined) {
                limit.enabled = updates.enabled === null ? undefined : updates.enabled;
            }
            if (updates.description !== undefined) {
                limit.description = updates.description;
            }
        }
        // TypeScript assertion: limit is guaranteed to be non-null at this point
        return await this.planLimitRepository.save(limit);
    }
    /**
     * Get current usage for a user
     */
    static async getCurrentUsage(usuarioId, featureKey, grupoId) {
        switch (featureKey) {
            case 'max_events':
                // Count active events (groups with status EM_ABERTO)
                const activeEvents = await this.grupoRepository.count({
                    where: {
                        usuario: { id: usuarioId },
                        status: 'EM_ABERTO',
                    },
                });
                return activeEvents;
            case 'max_participants_per_event':
                // If grupoId provided, count participants in that specific group
                if (grupoId) {
                    const { AppDataSource } = await Promise.resolve().then(() => __importStar(require('../database/data-source')));
                    const { ParticipanteGrupo } = await Promise.resolve().then(() => __importStar(require('../entities/ParticipanteGrupo')));
                    const participanteGrupoRepository = AppDataSource.getRepository(ParticipanteGrupo);
                    // Verify group belongs to user
                    const grupo = await this.grupoRepository.findOne({
                        where: { id: grupoId, usuario: { id: usuarioId } },
                    });
                    if (!grupo) {
                        return 0;
                    }
                    const participantCount = await participanteGrupoRepository.count({
                        where: { grupoId },
                    });
                    return participantCount;
                }
                // This is checked per event, so we return 0 here if no grupoId
                // The actual check happens in the controller when adding participants
                return 0;
            default:
                return 0;
        }
    }
    /**
     * Check if user can create more events
     */
    static async canCreateEvent(usuarioId) {
        const currentUsage = await this.getCurrentUsage(usuarioId, 'max_events');
        return await this.enforceLimit(usuarioId, 'max_events', currentUsage);
    }
    /**
     * Check if user can add more participants to an event
     */
    static async canAddParticipant(usuarioId, grupoId) {
        const usuario = await this.usuarioRepository.findOne({ where: { id: usuarioId } });
        if (!usuario) {
            return { allowed: false, current: 0 };
        }
        const planType = this.getPlanType(usuario);
        const limit = await this.planLimitRepository.findOne({
            where: { planType, featureKey: 'max_participants_per_event' },
        });
        if (!limit || limit.limitValue === null || limit.limitValue === undefined) {
            return { allowed: true, current: 0 };
        }
        // Get current participant count for this event
        const currentCount = await this.getCurrentUsage(usuarioId, 'max_participants_per_event', grupoId);
        const allowed = currentCount < limit.limitValue;
        return {
            allowed,
            limit: limit.limitValue,
            current: currentCount,
        };
    }
    /**
     * Helper: Get plan type from user
     */
    static getPlanType(usuario) {
        if (usuario.plano === 'LIFETIME') {
            return 'LIFETIME';
        }
        // Check if user has active subscription
        if (usuario.plano === 'PRO') {
            // Check if subscription is still valid
            if (usuario.planoValidoAte) {
                const now = new Date();
                if (usuario.planoValidoAte > now) {
                    return 'PRO';
                }
            }
            else if (usuario.plano === 'PRO') {
                // PRO without expiration date (lifetime or active subscription)
                return 'PRO';
            }
        }
        return 'FREE';
    }
    /**
     * Get user's plan type (considers subscription status)
     */
    static async getUserPlanType(usuarioId) {
        const usuario = await this.usuarioRepository.findOne({
            where: { id: usuarioId },
            relations: ['subscription'],
        });
        if (!usuario) {
            return 'FREE';
        }
        return this.getPlanType(usuario);
    }
}
exports.FeatureService = FeatureService;
FeatureService.planLimitRepository = data_source_1.AppDataSource.getRepository(PlanLimit_1.PlanLimit);
FeatureService.grupoRepository = data_source_1.AppDataSource.getRepository(Grupo_1.Grupo);
FeatureService.usuarioRepository = data_source_1.AppDataSource.getRepository(Usuario_1.Usuario);
