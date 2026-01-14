-- Migration: Criar tabela plan_limits para limites configuráveis por plano
-- Permite que administradores alterem limites dinamicamente sem precisar de deploy

-- Criar tabela plan_limits
CREATE TABLE IF NOT EXISTS plan_limits (
  id SERIAL PRIMARY KEY,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('FREE', 'PRO', 'LIFETIME')),
  feature_key VARCHAR(50) NOT NULL CHECK (feature_key IN ('max_events', 'max_participants_per_event', 'pdf_export_enabled', 'public_sharing_enabled', 'templates_enabled', 'email_notifications_enabled', 'analytics_enabled')),
  limit_value INTEGER NULL,
  enabled BOOLEAN NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plan_type, feature_key)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_plan_limits_plan_type ON plan_limits(plan_type);
CREATE INDEX IF NOT EXISTS idx_plan_limits_feature_key ON plan_limits(feature_key);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_plan_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_plan_limits_updated_at
BEFORE UPDATE ON plan_limits
FOR EACH ROW
EXECUTE FUNCTION update_plan_limits_updated_at();

-- Inserir limites padrão para FREE
INSERT INTO plan_limits (plan_type, feature_key, limit_value, enabled, description) VALUES
('FREE', 'max_events', 5, NULL, 'Máximo de eventos ativos permitidos'),
('FREE', 'max_participants_per_event', 20, NULL, 'Máximo de participantes por evento'),
('FREE', 'pdf_export_enabled', NULL, FALSE, 'Exportação de relatórios em PDF'),
('FREE', 'public_sharing_enabled', NULL, FALSE, 'Compartilhamento público de eventos'),
('FREE', 'templates_enabled', NULL, FALSE, 'Criação de templates personalizados'),
('FREE', 'email_notifications_enabled', NULL, TRUE, 'Notificações por email (básicas apenas)'),
('FREE', 'analytics_enabled', NULL, TRUE, 'Analytics básico')
ON CONFLICT (plan_type, feature_key) DO NOTHING;

-- Inserir limites padrão para PRO (ilimitado ou habilitado)
INSERT INTO plan_limits (plan_type, feature_key, limit_value, enabled, description) VALUES
('PRO', 'max_events', NULL, NULL, 'Eventos ilimitados'),
('PRO', 'max_participants_per_event', NULL, NULL, 'Participantes ilimitados por evento'),
('PRO', 'pdf_export_enabled', NULL, TRUE, 'Exportação de relatórios em PDF'),
('PRO', 'public_sharing_enabled', NULL, TRUE, 'Compartilhamento público de eventos'),
('PRO', 'templates_enabled', NULL, TRUE, 'Criação de templates personalizados'),
('PRO', 'email_notifications_enabled', NULL, TRUE, 'Todas as notificações por email'),
('PRO', 'analytics_enabled', NULL, TRUE, 'Analytics avançado')
ON CONFLICT (plan_type, feature_key) DO NOTHING;

-- Inserir limites padrão para LIFETIME (mesmos do PRO)
INSERT INTO plan_limits (plan_type, feature_key, limit_value, enabled, description) VALUES
('LIFETIME', 'max_events', NULL, NULL, 'Eventos ilimitados'),
('LIFETIME', 'max_participants_per_event', NULL, NULL, 'Participantes ilimitados por evento'),
('LIFETIME', 'pdf_export_enabled', NULL, TRUE, 'Exportação de relatórios em PDF'),
('LIFETIME', 'public_sharing_enabled', NULL, TRUE, 'Compartilhamento público de eventos'),
('LIFETIME', 'templates_enabled', NULL, TRUE, 'Criação de templates personalizados'),
('LIFETIME', 'email_notifications_enabled', NULL, TRUE, 'Todas as notificações por email'),
('LIFETIME', 'analytics_enabled', NULL, TRUE, 'Analytics avançado')
ON CONFLICT (plan_type, feature_key) DO NOTHING;