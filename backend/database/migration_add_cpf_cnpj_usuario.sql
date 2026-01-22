-- Migration: Adicionar campo CPF/CNPJ na tabela usuarios
-- Necessário para pagamentos PIX via Asaas

ALTER TABLE usuarios 
  ADD COLUMN IF NOT EXISTS cpf_cnpj VARCHAR(20) NULL;

-- Criar índice para busca rápida por CPF/CNPJ
CREATE INDEX IF NOT EXISTS idx_usuarios_cpf_cnpj ON usuarios(cpf_cnpj);
