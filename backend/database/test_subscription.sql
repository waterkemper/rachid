INSERT INTO subscriptions (
  usuario_id,
  plan_type,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  created_at,
  updated_at
) VALUES (
  2,                              -- ID do usuário
  'MONTHLY',                      -- 'MONTHLY', 'YEARLY' ou 'LIFETIME'
  'ACTIVE',                       -- Status deve ser 'ACTIVE'
  CURRENT_TIMESTAMP,              -- Data de início
  CURRENT_TIMESTAMP + INTERVAL '1 month',  -- Data de término (1 mês para MONTHLY)
  false,                          -- Não cancelar
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
RETURNING id;

UPDATE usuarios 
SET subscription_id = (SELECT id FROM subscriptions WHERE usuario_id = 2 ORDER BY created_at DESC LIMIT 1)
WHERE id = 2;

SELECT 
  u.id,
  u.email,
  u.plano,
  u.subscription_id,
  s.plan_type,
  s.status,
  s.current_period_start,
  s.current_period_end
FROM usuarios u
LEFT JOIN subscriptions s ON s.id = u.subscription_id
WHERE u.id = 2;