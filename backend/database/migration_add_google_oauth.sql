-- Migration: Adicionar suporte a Google OAuth
-- Adiciona campos necessários para autenticação via Google

-- Adicionar coluna google_id (nullable, unique)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_id VARCHAR UNIQUE;

-- Adicionar coluna auth_provider (default 'local')
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS auth_provider VARCHAR DEFAULT 'local';

-- Tornar coluna senha nullable (usuários OAuth não têm senha)
ALTER TABLE usuarios ALTER COLUMN senha DROP NOT NULL;

-- Criar índice para google_id para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_google_id ON usuarios(google_id);

-- Criar índice para auth_provider
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_provider ON usuarios(auth_provider);

