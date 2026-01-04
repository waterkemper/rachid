-- Migration: Adicionar campo chavePix na tabela usuarios
-- Adiciona campo para armazenar chave PIX do usuário

-- Adicionar coluna chavePix (nullable)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS chavePix VARCHAR;

