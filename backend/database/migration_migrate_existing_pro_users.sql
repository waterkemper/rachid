-- Migration: Migrar usuários PRO existentes para o novo sistema de assinaturas
-- Esta migração é OPCIONAL - execute apenas se quiser migrar usuários PRO existentes
-- 
-- IMPORTANTE: Esta migração cria assinaturas "legacy" para usuários que já tinham plano PRO
-- antes da implementação do novo sistema. Essas assinaturas não têm PayPal associado.
--
-- Usuários FREE não precisam ser migrados - eles continuam funcionando normalmente

-- Migrar usuários PRO com plano válido até uma data futura
-- Cria assinatura ACTIVE até a data de expiração do plano antigo
-- Nota: planoValidoAte e criadoEm são camelCase, precisam de aspas no PostgreSQL
INSERT INTO subscriptions (
  usuario_id,
  plan_type,
  status,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
)
SELECT 
  id as usuario_id,
  CASE 
    WHEN plano = 'LIFETIME' THEN 'LIFETIME'
    ELSE 'MONTHLY' -- Assumimos mensal para usuários PRO antigos
  END as plan_type,
  CASE 
    WHEN "planoValidoAte" IS NULL OR "planoValidoAte" > CURRENT_TIMESTAMP THEN 'ACTIVE'
    ELSE 'EXPIRED'
  END as status,
  COALESCE("planoValidoAte" - INTERVAL '1 month', "criadoEm") as current_period_start,
  "planoValidoAte" as current_period_end,
  "criadoEm" as created_at,
  CURRENT_TIMESTAMP as updated_at
FROM usuarios
WHERE plano IN ('PRO', 'LIFETIME')
  AND id NOT IN (SELECT usuario_id FROM subscriptions WHERE usuario_id IS NOT NULL);

-- Atualizar subscription_id nos usuários
UPDATE usuarios u
SET subscription_id = s.id
FROM subscriptions s
WHERE u.id = s.usuario_id
  AND u.subscription_id IS NULL;

-- Criar features para assinaturas migradas (habilitar todas as features PRO)
INSERT INTO subscription_features (
  subscription_id,
  feature_key,
  enabled,
  created_at,
  updated_at
)
SELECT 
  s.id as subscription_id,
  feature_key,
  true as enabled,
  CURRENT_TIMESTAMP as created_at,
  CURRENT_TIMESTAMP as updated_at
FROM subscriptions s
CROSS JOIN (
  VALUES 
    ('unlimited_events'),
    ('unlimited_participants'),
    ('pdf_export'),
    ('public_sharing'),
    ('templates'),
    ('email_notifications'),
    ('analytics')
) AS features(feature_key)
WHERE s.paypal_subscription_id IS NULL -- Apenas assinaturas migradas (sem PayPal)
  AND NOT EXISTS (
    SELECT 1 FROM subscription_features sf 
    WHERE sf.subscription_id = s.id 
    AND sf.feature_key = features.feature_key
  );

-- Criar histórico de migração
INSERT INTO subscription_history (
  subscription_id,
  event_type,
  metadata,
  created_at
)
SELECT 
  id as subscription_id,
  'created' as event_type,
  jsonb_build_object(
    'migrated_from_legacy', true,
    'migration_date', CURRENT_TIMESTAMP,
    'note', 'Migrado do sistema antigo de planos'
  ) as metadata,
  CURRENT_TIMESTAMP as created_at
FROM subscriptions
WHERE paypal_subscription_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM subscription_history sh 
    WHERE sh.subscription_id = subscriptions.id 
    AND sh.event_type = 'created'
  );

-- Log de migração
DO $$
DECLARE
  migrated_count INTEGER;
  lifetime_count INTEGER;
  expired_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM subscriptions
  WHERE paypal_subscription_id IS NULL;
  
  SELECT COUNT(*) INTO lifetime_count
  FROM subscriptions
  WHERE paypal_subscription_id IS NULL
    AND plan_type = 'LIFETIME';
  
  SELECT COUNT(*) INTO expired_count
  FROM subscriptions
  WHERE paypal_subscription_id IS NULL
    AND status = 'EXPIRED';
  
  RAISE NOTICE 'Migração concluída:';
  RAISE NOTICE '  - Total de assinaturas migradas: %', migrated_count;
  RAISE NOTICE '  - Assinaturas LIFETIME: %', lifetime_count;
  RAISE NOTICE '  - Assinaturas expiradas: %', expired_count;
END $$;