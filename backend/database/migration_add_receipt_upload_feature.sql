-- Migration: Adicionar feature limit receipt_upload_enabled aos planos
-- Permite upload de anexos (cupons fiscais, recibos) apenas para plano PRO

-- Atualizar constraint da tabela plan_limits para incluir novo feature_key
ALTER TABLE plan_limits DROP CONSTRAINT IF EXISTS plan_limits_feature_key_check;
ALTER TABLE plan_limits ADD CONSTRAINT plan_limits_feature_key_check 
  CHECK (feature_key IN (
    'max_events', 
    'max_participants_per_event', 
    'pdf_export_enabled', 
    'public_sharing_enabled', 
    'templates_enabled', 
    'email_notifications_enabled', 
    'analytics_enabled',
    'receipt_upload_enabled'
  ));

-- Inserir limite para FREE: desabilitado
INSERT INTO plan_limits (plan_type, feature_key, limit_value, enabled, description) VALUES
('FREE', 'receipt_upload_enabled', NULL, FALSE, 'Upload de anexos (cupons fiscais, recibos)')
ON CONFLICT (plan_type, feature_key) DO NOTHING;

-- Inserir limite para PRO: habilitado
INSERT INTO plan_limits (plan_type, feature_key, limit_value, enabled, description) VALUES
('PRO', 'receipt_upload_enabled', NULL, TRUE, 'Upload de anexos (cupons fiscais, recibos)')
ON CONFLICT (plan_type, feature_key) DO NOTHING;

-- Inserir limite para LIFETIME: habilitado
INSERT INTO plan_limits (plan_type, feature_key, limit_value, enabled, description) VALUES
('LIFETIME', 'receipt_upload_enabled', NULL, TRUE, 'Upload de anexos (cupons fiscais, recibos)')
ON CONFLICT (plan_type, feature_key) DO NOTHING;
