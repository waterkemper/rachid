-- Migração: Adicionar campos de colaboração na tabela despesas
-- Adiciona updatedAt, updatedBy para rastrear edições colaborativas

-- Adicionar coluna updated_at (TIMESTAMP)
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Adicionar coluna updated_by (INTEGER, nullable, FK para usuarios)
ALTER TABLE despesas ADD COLUMN IF NOT EXISTS updated_by INTEGER;

-- Adicionar constraint de foreign key para updated_by
ALTER TABLE despesas ADD CONSTRAINT fk_despesas_updated_by FOREIGN KEY (updated_by) REFERENCES usuarios(id) ON DELETE SET NULL;

-- Criar índice para updated_by para melhor performance
CREATE INDEX IF NOT EXISTS idx_despesas_updated_by ON despesas(updated_by);

-- Criar índice para updated_at para ordenação
CREATE INDEX IF NOT EXISTS idx_despesas_updated_at ON despesas(updated_at);

