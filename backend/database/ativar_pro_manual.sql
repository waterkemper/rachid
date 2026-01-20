-- Script para ativar PRO manualmente para um usuário
-- Substitua os valores conforme necessário

-- Exemplo: Ativar PRO MONTHLY para usuário com ID = 2
-- Você pode escolher entre 'MONTHLY', 'YEARLY' ou 'LIFETIME'

-- Passo 1: Criar a subscription
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
  2,                              -- ID do usuário (SUBSTITUA PELO ID CORRETO)
  'MONTHLY',                      -- ou 'YEARLY' ou 'LIFETIME'
  'ACTIVE',                       -- Status deve ser 'ACTIVE'
  CURRENT_TIMESTAMP,              -- Data de início (agora)
  CURRENT_TIMESTAMP + INTERVAL '1 month',  -- Data de término (1 mês para MONTHLY)
  -- Para YEARLY: CURRENT_TIMESTAMP + INTERVAL '1 year'
  -- Para LIFETIME: NULL (sem data de término)
  false,                          -- Não cancelar ao final do período
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
RETURNING id;

-- Passo 2: Atualizar o campo subscription_id na tabela usuarios
-- IMPORTANTE: Use o ID retornado do INSERT acima
UPDATE usuarios 
SET subscription_id = (SELECT id FROM subscriptions WHERE usuario_id = 2 ORDER BY created_at DESC LIMIT 1)
WHERE id = 2;  -- ID do usuário

-- Para verificar se funcionou, execute:
SELECT 
  u.id,
  u.email,
  u.plano,
  u.subscription_id,
  s.id as subscription_id_tabela,
  s.plan_type,
  s.status,
  s.current_period_start,
  s.current_period_end
FROM usuarios u
LEFT JOIN subscriptions s ON s.id = u.subscription_id
WHERE u.id = 2;
