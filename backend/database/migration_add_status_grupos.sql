-- Migration: Adicionar campo status na tabela grupos
-- Adiciona campo para rastrear status do evento (EM_ABERTO, CONCLUIDO, CANCELADO)

-- Adicionar coluna status (default 'EM_ABERTO')
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'EM_ABERTO';

-- Criar índice para otimizar consultas por status
CREATE INDEX IF NOT EXISTS idx_grupos_status ON grupos(status);

-- Atualizar grupos existentes para status 'EM_ABERTO' (já é o default, mas garantindo)
UPDATE grupos SET status = 'EM_ABERTO' WHERE status IS NULL;

-- Adicionar constraint para garantir apenas valores válidos (opcional, mas recomendado)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_grupos_status'
  ) THEN
    ALTER TABLE grupos ADD CONSTRAINT chk_grupos_status 
      CHECK (status IN ('EM_ABERTO', 'CONCLUIDO', 'CANCELADO'));
  END IF;
END $$;
