-- Migration: Criar tabela promo_codes para códigos promocionais
-- Suporta promoções de lifetime e descontos

-- Criar tabela promo_codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_percent DECIMAL(5, 2) NULL,
  valid_from TIMESTAMP NULL,
  valid_until TIMESTAMP NULL,
  max_uses INTEGER NOT NULL DEFAULT 0,
  current_uses INTEGER NOT NULL DEFAULT 0,
  min_amount DECIMAL(10, 2) NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(active);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_promo_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_promo_codes_updated_at
BEFORE UPDATE ON promo_codes
FOR EACH ROW
EXECUTE FUNCTION update_promo_codes_updated_at();