import { AppDataSource } from '../database/data-source';
import { Plan, PlanType } from '../entities/Plan';
import { PayPalService } from './PayPalService';

/**
 * Service for managing subscription plans (pricing, configuration)
 * Separate from PlanService which handles user plan verification
 */
export class SubscriptionPlanService {
  private static planRepository = AppDataSource.getRepository(Plan);

  /**
   * Get all plans (admin only - includes disabled plans)
   */
  static async getAllPlans(): Promise<Plan[]> {
    return await this.planRepository.find({
      order: { displayOrder: 'ASC', planType: 'ASC' },
    });
  }

  /**
   * Get plan by type
   */
  static async getPlanByType(planType: PlanType): Promise<Plan | null> {
    return await this.planRepository.findOne({
      where: { planType },
    });
  }

  /**
   * Get public plans (only enabled plans, formatted for frontend)
   */
  static async getPublicPlans(): Promise<Record<string, any>> {
    const plans = await this.planRepository.find({
      where: { enabled: true },
      order: { displayOrder: 'ASC', planType: 'ASC' },
    });

    const result: Record<string, any> = {};

    for (const plan of plans) {
      const planData: any = {
        name: plan.name,
        price: parseFloat(plan.price.toString()),
        currency: plan.currency,
      };

      if (plan.isOneTime) {
        planData.oneTime = true;
      } else {
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
  static async updatePlan(
    planType: PlanType,
    updates: {
      name?: string;
      description?: string;
      price?: number;
      currency?: string;
      intervalUnit?: 'month' | 'year';
      intervalCount?: number;
      trialDays?: number;
      isOneTime?: boolean;
      paypalPlanId?: string;
      enabled?: boolean;
      displayOrder?: number;
      createInPayPal?: boolean; // If true, creates plan in PayPal and updates paypalPlanId
    }
  ): Promise<Plan> {
    const plan = await this.planRepository.findOne({
      where: { planType },
    });

    if (!plan) {
      throw new Error(`Plan ${planType} not found`);
    }

    // Detect if price changed BEFORE updating (to preserve old price for comparison)
    const oldPrice = parseFloat(plan.price.toString());
    const newPrice = updates.price !== undefined ? parseFloat(String(updates.price)) : oldPrice;
    const priceChanged = updates.price !== undefined && Math.abs(newPrice - oldPrice) > 0.01; // Allow for floating point precision

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
      } else {
        // For one-time plans or invalid values, set to undefined (NULL in DB)
        plan.intervalCount = undefined;
      }
    }
    if (updates.trialDays !== undefined) {
      // Trial days: 0 = no trial, positive number = trial days
      if (updates.trialDays !== null && updates.trialDays !== undefined && !isNaN(Number(updates.trialDays))) {
        plan.trialDays = Math.max(0, Number(updates.trialDays)); // Ensure non-negative
      } else {
        plan.trialDays = 0;
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

    // Create plan in PayPal if requested OR if price changed (only for recurring plans)
    const shouldCreateInPayPal = updates.createInPayPal || (priceChanged && plan.paypalPlanId && !plan.isOneTime);
    
    if (shouldCreateInPayPal && !plan.isOneTime) {
      try {
        if (priceChanged) {
          console.log(`[SubscriptionPlanService] 💰 Preço alterado de R$ ${oldPrice.toFixed(2)} para R$ ${newPrice.toFixed(2)}. Criando novo plano no PayPal automaticamente...`);
        } else {
          console.log(`[SubscriptionPlanService] Criando plano ${planType} no PayPal...`);
        }
        // PayPal requires description with at least 1 character
        const description = (plan.description && plan.description.trim().length > 0) 
          ? plan.description.trim() 
          : plan.name; // Fallback to name if description is empty
        const paypalPlan = await PayPalService.createSubscriptionPlan({
          name: plan.name,
          description: description,
          billingCycle: {
            frequency: {
              interval_unit: plan.intervalUnit || 'month',
              interval_count: plan.intervalCount || 1,
            },
            pricing: {
              value: parseFloat(plan.price.toString()).toFixed(2),
              currency_code: plan.currency || 'BRL',
            },
          },
          trialDays: plan.trialDays || 0,
        });
        
        plan.paypalPlanId = paypalPlan.id;
        console.log(`[SubscriptionPlanService] ✅ Plano criado no PayPal! Plan ID: ${paypalPlan.id}`);
        if (priceChanged) {
          console.log(`[SubscriptionPlanService] 💡 Novo plano PayPal criado automaticamente devido à mudança de preço`);
        }
      } catch (error: any) {
        console.error('Erro ao criar plano no PayPal:', error);
        throw new Error(`Erro ao criar plano no PayPal: ${error.message}`);
      }
    }

    return await this.planRepository.save(plan);
  }

  /**
   * Create new plan (admin only)
   * Creates plan in PayPal and saves to database
   */
  static async createPlan(data: {
    planType: PlanType;
    name: string;
    description?: string;
    price: number;
    currency?: string;
    intervalUnit?: 'month' | 'year';
    intervalCount?: number;
    trialDays?: number;
    isOneTime?: boolean;
    enabled?: boolean;
    displayOrder?: number;
    createInPayPal?: boolean; // If true, creates plan in PayPal
  }): Promise<Plan> {
    // Check if plan already exists
    const existingPlan = await this.planRepository.findOne({
      where: { planType: data.planType },
    });

    if (existingPlan) {
      throw new Error(`Plan ${data.planType} already exists`);
    }

    let paypalPlanId: string | undefined = undefined;

    // Create plan in PayPal if requested (only for recurring plans)
    if (data.createInPayPal && !data.isOneTime) {
      try {
        // PayPal requires description with at least 1 character
        const description = (data.description && data.description.trim().length > 0) 
          ? data.description.trim() 
          : data.name; // Fallback to name if description is empty
        const paypalPlan = await PayPalService.createSubscriptionPlan({
          name: data.name,
          description: description,
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
      } catch (error: any) {
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
      trialDays: data.trialDays || 0,
      isOneTime: data.isOneTime || false,
      paypalPlanId: paypalPlanId,
      enabled: data.enabled !== undefined ? data.enabled : true,
      displayOrder: data.displayOrder || 0,
    });

    return await this.planRepository.save(plan);
  }
}
