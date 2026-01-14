-- Script de correção: Atualizar descrições com encoding correto (UTF-8)
-- Execute este script para corrigir os acentos nas descrições dos plan_limits

-- Atualizar descrições para FREE
UPDATE plan_limits 
SET description = 'Máximo de eventos ativos permitidos'
WHERE plan_type = 'FREE' AND feature_key = 'max_events';

UPDATE plan_limits 
SET description = 'Máximo de participantes por evento'
WHERE plan_type = 'FREE' AND feature_key = 'max_participants_per_event';

UPDATE plan_limits 
SET description = 'Exportação de relatórios em PDF'
WHERE plan_type = 'FREE' AND feature_key = 'pdf_export_enabled';

UPDATE plan_limits 
SET description = 'Compartilhamento público de eventos'
WHERE plan_type = 'FREE' AND feature_key = 'public_sharing_enabled';

UPDATE plan_limits 
SET description = 'Criação de templates personalizados'
WHERE plan_type = 'FREE' AND feature_key = 'templates_enabled';

UPDATE plan_limits 
SET description = 'Notificações por email (básicas apenas)'
WHERE plan_type = 'FREE' AND feature_key = 'email_notifications_enabled';

UPDATE plan_limits 
SET description = 'Analytics básico'
WHERE plan_type = 'FREE' AND feature_key = 'analytics_enabled';

-- Atualizar descrições para PRO
UPDATE plan_limits 
SET description = 'Eventos ilimitados'
WHERE plan_type = 'PRO' AND feature_key = 'max_events';

UPDATE plan_limits 
SET description = 'Participantes ilimitados por evento'
WHERE plan_type = 'PRO' AND feature_key = 'max_participants_per_event';

UPDATE plan_limits 
SET description = 'Exportação de relatórios em PDF'
WHERE plan_type = 'PRO' AND feature_key = 'pdf_export_enabled';

UPDATE plan_limits 
SET description = 'Compartilhamento público de eventos'
WHERE plan_type = 'PRO' AND feature_key = 'public_sharing_enabled';

UPDATE plan_limits 
SET description = 'Criação de templates personalizados'
WHERE plan_type = 'PRO' AND feature_key = 'templates_enabled';

UPDATE plan_limits 
SET description = 'Todas as notificações por email'
WHERE plan_type = 'PRO' AND feature_key = 'email_notifications_enabled';

UPDATE plan_limits 
SET description = 'Analytics avançado'
WHERE plan_type = 'PRO' AND feature_key = 'analytics_enabled';

-- Atualizar descrições para LIFETIME
UPDATE plan_limits 
SET description = 'Eventos ilimitados'
WHERE plan_type = 'LIFETIME' AND feature_key = 'max_events';

UPDATE plan_limits 
SET description = 'Participantes ilimitados por evento'
WHERE plan_type = 'LIFETIME' AND feature_key = 'max_participants_per_event';

UPDATE plan_limits 
SET description = 'Exportação de relatórios em PDF'
WHERE plan_type = 'LIFETIME' AND feature_key = 'pdf_export_enabled';

UPDATE plan_limits 
SET description = 'Compartilhamento público de eventos'
WHERE plan_type = 'LIFETIME' AND feature_key = 'public_sharing_enabled';

UPDATE plan_limits 
SET description = 'Criação de templates personalizados'
WHERE plan_type = 'LIFETIME' AND feature_key = 'templates_enabled';

UPDATE plan_limits 
SET description = 'Todas as notificações por email'
WHERE plan_type = 'LIFETIME' AND feature_key = 'email_notifications_enabled';

UPDATE plan_limits 
SET description = 'Analytics avançado'
WHERE plan_type = 'LIFETIME' AND feature_key = 'analytics_enabled';

-- Verificar resultados
SELECT plan_type, feature_key, description 
FROM plan_limits 
ORDER BY plan_type, feature_key;
