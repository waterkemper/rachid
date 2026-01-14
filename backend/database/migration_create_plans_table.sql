-- Migration: Criar tabela plans para armazenar configurações e preços dos planos
-- Permite que administradores alterem preços e configurações dinamicamente

-- Criar tabela plans
CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  plan_type VARCHAR(20) NOT NULL UNIQUE CHECK (plan_type IN ('MONTHLY', 'YEARLY', 'LIFETIME')),
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  interval_unit VARCHAR(20) NULL CHECK (interval_unit IN ('month', 'year', NULL)),
  interval_count INTEGER NULL DEFAULT 1,
  is_one_time BOOLEAN NOT NULL DEFAULT FALSE,
  paypal_plan_id VARCHAR(255) NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  features JSONB NULL,
  metadata JSONB NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_plans_plan_type ON plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_plans_enabled ON plans(enabled);
CREATE INDEX IF NOT EXISTS idx_plans_display_order ON plans(display_order);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_plans_updated_at
BEFORE UPDATE ON plans
FOR EACH ROW
EXECUTE FUNCTION update_plans_updated_at();

-- Inserir planos padrão
INSERT INTO plans (plan_type, name, description, price, currency, interval_unit, interval_count, is_one_time, enabled, display_order) VALUES
('MONTHLY', 'PRO Mensal', 'Assinatura PRO mensal com todos os recursos', 19.90, 'BRL', 'month', 1, FALSE, TRUE, 1),
('YEARLY', 'PRO Anual', 'Assinatura PRO anual com desconto (economia de 17%)', 199.00, 'BRL', 'year', 1, FALSE, TRUE, 2),
('LIFETIME', 'PRO Vitalício', 'Assinatura PRO vitalícia - pagamento único', 499.00, 'BRL', NULL, NULL, TRUE, TRUE, 3)
ON CONFLICT (plan_type) DO NOTHING;
