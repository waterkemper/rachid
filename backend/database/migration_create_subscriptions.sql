-- Migration: Criar tabelas de assinaturas e funcionalidades relacionadas
-- Sistema completo de gerenciamento de assinaturas com PayPal

-- Criar tabela subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  paypal_subscription_id VARCHAR(255) UNIQUE NULL,
  paypal_payer_id VARCHAR(255) UNIQUE NULL,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('MONTHLY', 'YEARLY', 'LIFETIME')),
  status VARCHAR(20) NOT NULL DEFAULT 'APPROVAL_PENDING' CHECK (status IN ('APPROVAL_PENDING', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED')),
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at TIMESTAMP NULL,
  trial_end TIMESTAMP NULL,
  next_billing_time TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela subscription_history (audit trail)
CREATE TABLE IF NOT EXISTS subscription_history (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('created', 'updated', 'canceled', 'renewed', 'payment_failed', 'refunded', 'suspended', 'activated')),
  old_value JSONB NULL,
  new_value JSONB NULL,
  paypal_event_id VARCHAR(255) UNIQUE NULL,
  paypal_resource_id VARCHAR(255) NULL,
  metadata JSONB NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela subscription_features (feature flags por assinatura)
CREATE TABLE IF NOT EXISTS subscription_features (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  feature_key VARCHAR(50) NOT NULL CHECK (feature_key IN ('unlimited_events', 'unlimited_participants', 'pdf_export', 'public_sharing', 'templates', 'email_notifications', 'analytics')),
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  limit_value INTEGER NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar campos ao usuarios
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS paypal_payer_id VARCHAR(255) UNIQUE NULL,
ADD COLUMN IF NOT EXISTS subscription_id INTEGER NULL REFERENCES subscriptions(id) ON DELETE SET NULL;

-- Atualizar tipo do campo plano para incluir LIFETIME
ALTER TABLE usuarios 
DROP CONSTRAINT IF EXISTS usuarios_plano_check;

ALTER TABLE usuarios 
ADD CONSTRAINT usuarios_plano_check 
CHECK (plano IN ('FREE', 'PRO', 'LIFETIME'));

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_usuario_id ON subscriptions(usuario_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_subscription_id ON subscriptions(paypal_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_payer_id ON subscriptions(paypal_payer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription_id ON subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_event_type ON subscription_history(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_history_paypal_event_id ON subscription_history(paypal_event_id);
CREATE INDEX IF NOT EXISTS idx_subscription_features_subscription_id ON subscription_features(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_features_feature_key ON subscription_features(feature_key);
CREATE INDEX IF NOT EXISTS idx_usuarios_paypal_payer_id ON usuarios(paypal_payer_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_subscription_id ON usuarios(subscription_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_subscriptions_updated_at();

CREATE OR REPLACE FUNCTION update_subscription_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscription_features_updated_at
BEFORE UPDATE ON subscription_features
FOR EACH ROW
EXECUTE FUNCTION update_subscription_features_updated_at();