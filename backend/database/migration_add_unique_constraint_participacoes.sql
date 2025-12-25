-- Migração: Adicionar constraint UNIQUE para prevenir duplicatas de participantes na mesma despesa
-- Data: 2025-01-XX
-- Descrição: Esta migração adiciona uma constraint UNIQUE na tabela participacoes_despesa
--            para garantir que um participante não possa participar mais de uma vez da mesma despesa.

-- Passo 1: Limpar duplicatas existentes (mantém apenas a primeira ocorrência)
-- NOTA: Execute esta parte primeiro se houver dados duplicados no banco

-- Deletar duplicatas, mantendo apenas o registro com o menor id
DELETE FROM participacoes_despesa p1
WHERE EXISTS (
  SELECT 1 FROM participacoes_despesa p2
  WHERE p2.despesa_id = p1.despesa_id
    AND p2.participante_id = p1.participante_id
    AND p2.id < p1.id
);

-- Passo 2: Adicionar constraint UNIQUE (se ainda não existir)
-- Para PostgreSQL/Supabase
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uk_participacoes_despesa_participante'
  ) THEN
    ALTER TABLE participacoes_despesa
    ADD CONSTRAINT uk_participacoes_despesa_participante 
    UNIQUE (despesa_id, participante_id);
  END IF;
END $$;

