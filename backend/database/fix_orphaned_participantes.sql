-- Script para corrigir referências órfãs em participantes_grupos
-- Remove registros onde o participante foi deletado mas ainda está referenciado

-- Remover participantes_grupos com participantes que não existem mais
DELETE FROM participantes_grupos
WHERE participante_id NOT IN (SELECT id FROM participantes);

-- Verificar se há grupos com share_token duplicado (caso a migração tenha falhado)
-- Isso não deve acontecer, mas vamos garantir
UPDATE grupos
SET share_token = NULL
WHERE share_token IN (
  SELECT share_token
  FROM grupos
  WHERE share_token IS NOT NULL
  GROUP BY share_token
  HAVING COUNT(*) > 1
)
AND id NOT IN (
  SELECT MIN(id)
  FROM grupos
  WHERE share_token IS NOT NULL
  GROUP BY share_token
);

