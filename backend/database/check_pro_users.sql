-- Script de diagnóstico: Verificar usuários PRO/LIFETIME e assinaturas existentes
-- Execute este script para entender por que a migração não inseriu registros

-- 1. Verificar quantos usuários PRO/LIFETIME existem
SELECT 
  plano,
  COUNT(*) as total_usuarios
FROM usuarios
WHERE plano IN ('PRO', 'LIFETIME')
GROUP BY plano;

-- 2. Verificar usuários PRO/LIFETIME e se já têm assinaturas
SELECT 
  u.id,
  u.email,
  u.plano,
  u."planoValidoAte",
  u.subscription_id,
  s.id as subscription_exists,
  s.status as subscription_status
FROM usuarios u
LEFT JOIN subscriptions s ON u.id = s.usuario_id
WHERE u.plano IN ('PRO', 'LIFETIME')
ORDER BY u.id;

-- 3. Verificar quantos usuários PRO/LIFETIME NÃO têm assinaturas (seriam migrados)
SELECT 
  COUNT(*) as usuarios_para_migrar
FROM usuarios u
WHERE u.plano IN ('PRO', 'LIFETIME')
  AND u.id NOT IN (SELECT usuario_id FROM subscriptions WHERE usuario_id IS NOT NULL);

-- 4. Listar usuários que seriam migrados
SELECT 
  u.id,
  u.email,
  u.plano,
  u."planoValidoAte",
  u."criadoEm"
FROM usuarios u
WHERE u.plano IN ('PRO', 'LIFETIME')
  AND u.id NOT IN (SELECT usuario_id FROM subscriptions WHERE usuario_id IS NOT NULL);
