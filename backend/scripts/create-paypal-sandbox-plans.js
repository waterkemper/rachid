/**
 * Script para criar planos PayPal no ambiente Sandbox
 * 
 * Este script cria planos de assinatura no PayPal Sandbox via API
 * e atualiza a tabela plans com os novos Plan IDs
 * 
 * Uso:
 *   cd backend
 *   node scripts/create-paypal-sandbox-plans.js
 * 
 * IMPORTANTE: Configure as variáveis de ambiente antes:
 *   - PAYPAL_CLIENT_ID (Sandbox)
 *   - PAYPAL_CLIENT_SECRET (Sandbox)
 *   - PAYPAL_MODE=sandbox
 *   - DATABASE_URL
 */

require('dotenv').config();
const { AppDataSource } = require('../dist/database/data-source');
const { PayPalService } = require('../dist/services/PayPalService');
const { Plan } = require('../dist/entities/Plan');

async function createPayPalSandboxPlans() {
  try {
    console.log('🔄 Inicializando conexão com banco de dados...');
    await AppDataSource.initialize();
    console.log('✅ Banco de dados conectado');

    const planRepository = AppDataSource.getRepository(Plan);

    // Verificar credenciais
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      throw new Error('PAYPAL_CLIENT_ID e PAYPAL_CLIENT_SECRET devem estar configurados no .env');
    }

    const mode = process.env.PAYPAL_MODE || 'sandbox';
    if (mode !== 'sandbox') {
      console.warn('⚠️  ATENÇÃO: PAYPAL_MODE não está definido como "sandbox"');
      console.warn('⚠️  Certifique-se de que está usando credenciais Sandbox!');
    }

    console.log(`\n📋 Modo PayPal: ${mode}`);
    console.log(`📋 Client ID: ${process.env.PAYPAL_CLIENT_ID.substring(0, 10)}...`);

    // Buscar planos existentes
    const monthlyPlan = await planRepository.findOne({ where: { planType: 'MONTHLY' } });
    const yearlyPlan = await planRepository.findOne({ where: { planType: 'YEARLY' } });

    if (!monthlyPlan || !yearlyPlan) {
      throw new Error('Planos MONTHLY e YEARLY devem existir na tabela plans primeiro');
    }

    console.log('\n📋 Planos encontrados na tabela:');
    console.log(`   MONTHLY: ${monthlyPlan.name} - Plan ID atual: ${monthlyPlan.paypalPlanId || 'NÃO CONFIGURADO'}`);
    console.log(`   YEARLY: ${yearlyPlan.name} - Plan ID atual: ${yearlyPlan.paypalPlanId || 'NÃO CONFIGURADO'}`);

    // Criar Plano Mensal no PayPal
    console.log('\n🔄 Criando plano MONTHLY no PayPal Sandbox...');
    try {
      const monthlyPayPalPlan = await PayPalService.createSubscriptionPlan({
        name: monthlyPlan.name,
        description: monthlyPlan.description || 'Assinatura PRO mensal',
        billingCycle: {
          frequency: {
            interval_unit: 'month',
            interval_count: 1,
          },
          pricing: {
            value: parseFloat(monthlyPlan.price.toString()).toFixed(2),
            currency_code: monthlyPlan.currency || 'BRL',
          },
        },
      });

      console.log(`✅ Plano MONTHLY criado no PayPal!`);
      console.log(`   Plan ID: ${monthlyPayPalPlan.id}`);
      console.log(`   Nome: ${monthlyPayPalPlan.name}`);

      // Atualizar na tabela
      monthlyPlan.paypalPlanId = monthlyPayPalPlan.id;
      await planRepository.save(monthlyPlan);
      console.log(`✅ Plan ID atualizado na tabela plans`);
    } catch (error) {
      console.error('❌ Erro ao criar plano MONTHLY:', error.message);
      if (error.message.includes('product_id')) {
        console.error('💡 DICA: Você precisa criar um Product no PayPal primeiro ou configurar PAYPAL_PRODUCT_ID');
      }
      throw error;
    }

    // Aguardar 1 segundo entre criações
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Criar Plano Anual no PayPal
    console.log('\n🔄 Criando plano YEARLY no PayPal Sandbox...');
    try {
      const yearlyPayPalPlan = await PayPalService.createSubscriptionPlan({
        name: yearlyPlan.name,
        description: yearlyPlan.description || 'Assinatura PRO anual',
        billingCycle: {
          frequency: {
            interval_unit: 'year',
            interval_count: 1,
          },
          pricing: {
            value: parseFloat(yearlyPlan.price.toString()).toFixed(2),
            currency_code: yearlyPlan.currency || 'BRL',
          },
        },
      });

      console.log(`✅ Plano YEARLY criado no PayPal!`);
      console.log(`   Plan ID: ${yearlyPayPalPlan.id}`);
      console.log(`   Nome: ${yearlyPayPalPlan.name}`);

      // Atualizar na tabela
      yearlyPlan.paypalPlanId = yearlyPayPalPlan.id;
      await planRepository.save(yearlyPlan);
      console.log(`✅ Plan ID atualizado na tabela plans`);
    } catch (error) {
      console.error('❌ Erro ao criar plano YEARLY:', error.message);
      if (error.message.includes('product_id')) {
        console.error('💡 DICA: Você precisa criar um Product no PayPal primeiro ou configurar PAYPAL_PRODUCT_ID');
      }
      throw error;
    }

    // Verificar atualização
    console.log('\n✅ Resumo final:');
    const updatedMonthly = await planRepository.findOne({ where: { planType: 'MONTHLY' } });
    const updatedYearly = await planRepository.findOne({ where: { planType: 'YEARLY' } });

    console.log(`   MONTHLY Plan ID: ${updatedMonthly?.paypalPlanId}`);
    console.log(`   YEARLY Plan ID: ${updatedYearly?.paypalPlanId}`);

    console.log('\n🎉 Planos criados com sucesso no PayPal Sandbox!');
    console.log('📝 Você pode testar criar uma assinatura agora.');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Executar script
createPayPalSandboxPlans();
