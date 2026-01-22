-- Migration: Migrar campos PayPal para Asaas e adicionar novos campos
-- Migração do sistema de pagamento PayPal para Asaas

-- Renomear colunas PayPal para Asaas
ALTER TABLE subscriptions 
  RENAME COLUMN paypal_subscription_id TO asaas_subscription_id;

ALTER TABLE subscriptions 
  RENAME COLUMN paypal_payer_id TO asaas_customer_id;

-- Adicionar novos campos
ALTER TABLE subscriptions 
  ADD COLUMN IF NOT EXISTS asaas_payment_id VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) NULL CHECK (payment_method IN ('PIX', 'CREDIT_CARD')),
  ADD COLUMN IF NOT EXISTS installment_count INTEGER NULL;

-- Remover constraint unique do paypal_payer_id (agora asaas_customer_id pode ter duplicatas)
ALTER TABLE subscriptions 
  DROP CONSTRAINT IF EXISTS subscriptions_paypal_payer_id_key;

-- Atualizar índices
DROP INDEX IF EXISTS idx_subscriptions_paypal_subscription_id;
DROP INDEX IF EXISTS idx_subscriptions_paypal_payer_id;

CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas_subscription_id ON subscriptions(asaas_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas_customer_id ON subscriptions(asaas_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas_payment_id ON subscriptions(asaas_payment_id);

-- Atualizar subscription_history para usar novos nomes (opcional, para manter histórico)
-- Os campos paypal_event_id e paypal_resource_id podem continuar com os mesmos nomes
-- ou podem ser atualizados posteriormente se necessário
