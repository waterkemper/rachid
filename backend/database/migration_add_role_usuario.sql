-- Migration: Adicionar campo role na tabela usuarios
-- Adiciona campo para identificar usuários administradores

-- Adicionar coluna role (default 'USER')
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'USER';

-- Criar índice para otimizar consultas por role
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);

-- Atualizar usuário admin existente para role 'ADMIN'
UPDATE usuarios SET role = 'ADMIN' WHERE email = 'admin@admin.com';

