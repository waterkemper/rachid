-- Migração: Adicionar campo share_token na tabela grupos
-- Permite compartilhamento público de eventos via link único

-- Adicionar coluna share_token (VARCHAR, UNIQUE, nullable)
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS share_token VARCHAR UNIQUE;

-- Criar índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_grupos_share_token ON grupos(share_token);

