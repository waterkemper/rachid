-- Migration: Criar tabela despesa_anexos para armazenar anexos de despesas
-- Permite upload de cupons fiscais, recibos e outros documentos

-- Criar tabela despesa_anexos
CREATE TABLE IF NOT EXISTS despesa_anexos (
  id SERIAL PRIMARY KEY,
  despesa_id INTEGER NOT NULL,
  nome_original VARCHAR(255) NOT NULL,
  nome_arquivo VARCHAR(255) NOT NULL,
  tipo_mime VARCHAR(100) NOT NULL,
  tamanho_original BIGINT NOT NULL,
  tamanho_otimizado BIGINT NULL,
  largura INTEGER NULL,
  altura INTEGER NULL,
  otimizado BOOLEAN NOT NULL DEFAULT FALSE,
  url_s3 TEXT NOT NULL,
  url_cloudfront TEXT NOT NULL,
  usuario_id INTEGER NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_despesa_anexos_despesa FOREIGN KEY (despesa_id) REFERENCES despesas(id) ON DELETE CASCADE,
  CONSTRAINT fk_despesa_anexos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_despesa_anexos_despesa_id ON despesa_anexos(despesa_id);
CREATE INDEX IF NOT EXISTS idx_despesa_anexos_usuario_id ON despesa_anexos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_despesa_anexos_criado_em ON despesa_anexos(criado_em);
