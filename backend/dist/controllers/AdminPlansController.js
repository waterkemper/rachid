"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPlansController = void 0;
const SubscriptionPlanService_1 = require("../services/SubscriptionPlanService");
class AdminPlansController {
    /**
     * Create new plan
     * POST /api/admin/plans
     */
    static async create(req, res) {
        try {
            const { planType, name, description, price, currency, intervalUnit, intervalCount, trialDays, isOneTime, enabled, displayOrder, createInPayPal, } = req.body;
            if (!planType || !name || price === undefined) {
                return res.status(400).json({ error: 'planType, name e price s?o obrigat?rios' });
            }
            if (!['MONTHLY', 'YEARLY', 'LIFETIME'].includes(planType)) {
                return res.status(400).json({ error: 'planType deve ser MONTHLY, YEARLY ou LIFETIME' });
            }
            // Validate price
            if (isNaN(price) || price < 0) {
                return res.status(400).json({ error: 'Pre?o inv?lido (deve ser um n?mero positivo)' });
            }
            // Validate interval for recurring plans
            if (!isOneTime && !intervalUnit) {
                return res.status(400).json({ error: 'intervalUnit ? obrigat?rio para planos recorrentes' });
            }
            const newPlan = await SubscriptionPlanService_1.SubscriptionPlanService.createPlan({
                planType: planType,
                name,
                description,
                price: parseFloat(price),
                currency: currency || 'BRL',
                intervalUnit: intervalUnit,
                intervalCount: intervalCount ? parseInt(intervalCount) : 1,
                trialDays: trialDays !== undefined ? parseInt(trialDays) || 0 : 0,
                isOneTime: Boolean(isOneTime),
                enabled: enabled !== undefined ? Boolean(enabled) : true,
                displayOrder: displayOrder ? parseInt(displayOrder) : 0,
                createInPayPal: Boolean(createInPayPal),
            });
            res.status(201).json({
                message: 'Plano criado com sucesso',
                plan: newPlan,
            });
        }
        catch (error) {
            console.error('Erro ao criar plano:', error);
            res.status(500).json({ error: error.message || 'Erro ao criar plano' });
        }
    }
    /**
     * Get all plans
     * GET /api/admin/plans
     */
    static async getAll(req, res) {
        try {
            const plans = await SubscriptionPlanService_1.SubscriptionPlanService.getAllPlans();
            res.json(plans);
        }
        catch (error) {
            console.error('Erro ao buscar planos:', error);
            res.status(500).json({ error: error.message || 'Erro ao buscar planos' });
        }
    }
    /**
     * Get plan by type
     * GET /api/admin/plans/:planType
     */
    static async getByPlanType(req, res) {
        try {
            const { planType } = req.params;
            if (!['MONTHLY', 'YEARLY', 'LIFETIME'].includes(planType)) {
                return res.status(400).json({ error: 'planType inv?lido' });
            }
            const plan = await SubscriptionPlanService_1.SubscriptionPlanService.getPlanByType(planType);
            if (!plan) {
                return res.status(404).json({ error: 'Plano n?o encontrado' });
            }
            res.json(plan);
        }
        catch (error) {
            console.error('Erro ao buscar plano:', error);
            res.status(500).json({ error: error.message || 'Erro ao buscar plano' });
        }
    }
    /**
     * Update plan
     * PUT /api/admin/plans/:planType
     */
    static async update(req, res) {
        try {
            const { planType } = req.params;
            const { name, description, price, currency, intervalUnit, intervalCount, trialDays, isOneTime, paypalPlanId, enabled, displayOrder, createInPayPal, } = req.body;
            if (!['MONTHLY', 'YEARLY', 'LIFETIME'].includes(planType)) {
                return res.status(400).json({ error: 'planType inv?lido' });
            }
            // Validate price
            if (price !== undefined && (isNaN(price) || price < 0)) {
                return res.status(400).json({ error: 'Pre?o inv?lido (deve ser um n?mero positivo)' });
            }
            const updates = {};
            if (name !== undefined)
                updates.name = name;
            if (description !== undefined)
                updates.description = description;
            if (price !== undefined)
                updates.price = parseFloat(price);
            if (currency !== undefined)
                updates.currency = currency;
            if (intervalUnit !== undefined)
                updates.intervalUnit = intervalUnit;
            // Only include intervalCount if it's a valid number
            // For one-time plans (LIFETIME), intervalCount should be null/undefined
            if (intervalCount !== undefined && intervalCount !== null && intervalCount !== '') {
                const parsed = parseInt(String(intervalCount));
                if (!isNaN(parsed) && parsed > 0) {
                    updates.intervalCount = parsed;
                }
                // If invalid, don't include in updates (keeps current value)
            }
            else if (intervalCount === null || intervalCount === '') {
                // Explicitly set to null for one-time plans
                updates.intervalCount = null;
            }
            if (trialDays !== undefined) {
                const parsed = parseInt(String(trialDays));
                updates.trialDays = !isNaN(parsed) && parsed >= 0 ? parsed : 0;
            }
            if (isOneTime !== undefined)
                updates.isOneTime = Boolean(isOneTime);
            if (paypalPlanId !== undefined)
                updates.paypalPlanId = paypalPlanId || null;
            if (enabled !== undefined)
                updates.enabled = Boolean(enabled);
            if (displayOrder !== undefined) {
                const parsed = parseInt(displayOrder);
                updates.displayOrder = isNaN(parsed) ? 0 : parsed;
            }
            if (createInPayPal !== undefined)
                updates.createInPayPal = Boolean(createInPayPal);
            const updatedPlan = await SubscriptionPlanService_1.SubscriptionPlanService.updatePlan(planType, updates);
            res.json({
                message: 'Plano atualizado com sucesso',
                plan: updatedPlan,
            });
        }
        catch (error) {
            console.error('Erro ao atualizar plano:', error);
            res.status(500).json({ error: error.message || 'Erro ao atualizar plano' });
        }
    }
}
exports.AdminPlansController = AdminPlansController;
