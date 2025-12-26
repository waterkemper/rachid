-- Script: Remover participações de despesas de participantes que não estão mais em eventos
-- Descrição: Remove participacoes_despesa onde o participante_id não está mais em nenhum participantes_grupos
--            do mesmo grupo (evento) da despesa
-- Data: 2025-01-XX

-- ============================================
-- VERSÃO SIMPLES (DELETE direto)
-- ============================================
-- Remove participações onde o participante não está mais no grupo da despesa
DELETE FROM participacoes_despesa
WHERE id IN (
  SELECT pd.id
  FROM participacoes_despesa pd
  INNER JOIN despesas d ON d.id = pd.despesa_id
  WHERE NOT EXISTS (
    SELECT 1 
    FROM participantes_grupos pg
    WHERE pg.participante_id = pd.participante_id
      AND pg.grupo_id = d.grupo_id
  )
);

-- ============================================
-- VERSÃO COM VERIFICAÇÃO (recomendado executar antes)
-- ============================================

-- Passo 1: Verificar quantas participações órfãs existem antes de deletar
-- SELECT 
--   COUNT(*) as total_participacoes_orfas,
--   COUNT(DISTINCT pd.participante_id) as participantes_afetados,
--   COUNT(DISTINCT pd.despesa_id) as despesas_afetadas
-- FROM participacoes_despesa pd
-- INNER JOIN despesas d ON d.id = pd.despesa_id
-- WHERE NOT EXISTS (
--   SELECT 1 
--   FROM participantes_grupos pg
--   WHERE pg.participante_id = pd.participante_id
--     AND pg.grupo_id = d.grupo_id
-- );

-- Passo 2: Deletar participações órfãs (descomente após verificar)
-- DELETE FROM participacoes_despesa
-- WHERE id IN (
--   SELECT pd.id
--   FROM participacoes_despesa pd
--   INNER JOIN despesas d ON d.id = pd.despesa_id
--   WHERE NOT EXISTS (
--     SELECT 1 
--     FROM participantes_grupos pg
--     WHERE pg.participante_id = pd.participante_id
--       AND pg.grupo_id = d.grupo_id
--   )
-- );

-- Passo 3: Verificar resultado após limpeza
-- SELECT 
--   COUNT(*) as participacoes_restantes,
--   COUNT(DISTINCT participante_id) as participantes_unicos,
--   COUNT(DISTINCT despesa_id) as despesas_com_participacoes
-- FROM participacoes_despesa;
