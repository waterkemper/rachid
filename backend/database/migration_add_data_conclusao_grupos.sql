-- Migration: Adicionar coluna data_conclusao na tabela grupos
-- Registra a data em que o evento foi marcado como concluído

ALTER TABLE grupos 
ADD COLUMN IF NOT EXISTS data_conclusao TIMESTAMP NULL;

-- Comentário
COMMENT ON COLUMN grupos.data_conclusao IS 'Data em que o evento foi marcado como concluído';
