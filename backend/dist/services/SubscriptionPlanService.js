"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionPlanService = void 0;
const data_source_1 = require("../database/data-source");
const Plan_1 = require("../entities/Plan");
const PayPalService_1 = require("./PayPalService");
/**
 * Service for managing subscription plans (pricing, configuration)
 * Separate from PlanService which handles user plan verification
 */
class SubscriptionPlanService {
    /**
     * Get all plans (admin only - includes disabled plans)
     */
    static async getAllPlans() {
        return await this.planRepository.find({
            order: { displayOrder: 'ASC', planType: 'ASC' },
        });
    }
    /**
     * Get plan by type
     */
    static async getPlanByType(planType) {
        return await this.planRepository.findOne({
            where: { planType },
        });
    }
    /**
     * Get public plans (only enabled plans, formatted for frontend)
     */
    static async getPublicPlans() {
        const plans = await this.planRepository.find({
            where: { enabled: true },
            order: { displayOrder: 'ASC', planType: 'ASC' },
        });
        const result = {};
        for (const plan of plans) {
            const planData = {
                name: plan.name,
                price: parseFloat(plan.price.toString()),
                currency: plan.currency,
            };
            if (plan.isOneTime) {
                planData.oneTime = true;
            }
            else {
                planData.interval = plan.intervalUnit || 'month';
                // Calculate savings for yearly plan
                if (plan.planType === 'YEARLY') {
                    const monthlyPlan = plans.find(p => p.planType === 'MONTHLY' && p.enabled);
                    if (monthlyPlan) {
                        const monthlyPrice = parseFloat(monthlyPlan.price.toString());
                        const yearlyPrice = parseFloat(plan.price.toString());
                        const yearlyEquivalent = monthlyPrice * 12;
                        const savings = ((yearlyEquivalent - yearlyPrice) / yearlyEquivalent) * 100;
                        if (savings > 0) {
                            planData.savings = `${Math.round(savings)}%`;
                        }
                    }
                }
            }
            result[plan.planType] = planData;
        }
        return result;
    }
    /**
     * Update plan (admin only)
     */
    static async updatePlan(planType, updates) {
        const plan = await this.planRepository.findOne({
            where: { planType },
        });
        if (!plan) {
            throw new Error(`Plan ${planType} not found`);
        }
        if (updates.name !== undefined) {
            plan.name = updates.name;
        }
        if (updates.description !== undefined) {
            plan.description = updates.description;
        }
        if (updates.price !== undefined) {
            plan.price = updates.price;
        }
        if (updates.currency !== undefined) {
            plan.currency = updates.currency;
        }
        if (updates.intervalUnit !== undefined) {
            plan.intervalUnit = updates.intervalUnit;
        }
        if (updates.intervalCount !== undefined) {
            // Only set if it's a valid number, otherwise set to undefined for nullable field
            if (updates.intervalCount !== null && updates.intervalCount !== undefined && !isNaN(Number(updates.intervalCount))) {
                plan.intervalCount = Number(updates.intervalCount);
            }
            else {
                // For one-time plans or invalid values, set to undefined (NULL in DB)
                plan.intervalCount = undefined;
            }
        }
        if (updates.isOneTime !== undefined) {
            plan.isOneTime = updates.isOneTime;
        }
        if (updates.paypalPlanId !== undefined) {
            plan.paypalPlanId = updates.paypalPlanId || undefined;
        }
        if (updates.enabled !== undefined) {
            plan.enabled = updates.enabled;
        }
        if (updates.displayOrder !== undefined) {
            // Only set if it's a valid number
            if (updates.displayOrder !== null && !isNaN(updates.displayOrder)) {
                plan.displayOrder = updates.displayOrder;
            }
        }
        return await this.planRepository.save(plan);
    }
    /**
     * Create new plan (admin only)
     * Creates plan in PayPal and saves to database
     */
    static async createPlan(data) {
        // Check if plan already exists
        const existingPlan = await this.planRepository.findOne({
            where: { planType: data.planType },
        });
        if (existingPlan) {
            throw new Error(`Plan ${data.planType} already exists`);
        }
        let paypalPlanId = undefined;
        // Create plan in PayPal if requested (only for recurring plans)
        if (data.createInPayPal && !data.isOneTime) {
            try {
                const paypalPlan = await PayPalService_1.PayPalService.createSubscriptionPlan({
                    name: data.name,
                    description: data.description,
                    billingCycle: {
                        frequency: {
                            interval_unit: data.intervalUnit || 'month',
                            interval_count: data.intervalCount || 1,
                        },
                        pricing: {
                            value: data.price.toFixed(2),
                            currency_code: data.currency || 'BRL',
                        },
                    },
                });
                paypalPlanId = paypalPlan.id;
            }
            catch (error) {
                console.error('Erro ao criar plano no PayPal:', error);
                throw new Error(`Erro ao criar plano no PayPal: ${error.message}`);
            }
        }
        // Create plan in database
        const plan = this.planRepository.create({
            planType: data.planType,
            name: data.name,
            description: data.description,
            price: data.price,
            currency: data.currency || 'BRL',
            intervalUnit: data.intervalUnit,
            intervalCount: data.intervalCount || 1,
            isOneTime: data.isOneTime || false,
            paypalPlanId: paypalPlanId,
            enabled: data.enabled !== undefined ? data.enabled : true,
            displayOrder: data.displayOrder || 0,
        });
        return await this.planRepository.save(plan);
    }
}
exports.SubscriptionPlanService = SubscriptionPlanService;
SubscriptionPlanService.planRepository = data_source_1.AppDataSource.getRepository(Plan_1.Plan);
