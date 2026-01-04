-- Migration: Criar tabela evento_acessos
-- Armazena acessos a eventos públicos para estatísticas e análise

CREATE TABLE IF NOT EXISTS evento_acessos (
  id SERIAL PRIMARY KEY,
  evento_id INTEGER NOT NULL,
  ip_address VARCHAR,
  user_agent TEXT,
  acessado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_evento_acessos_evento FOREIGN KEY (evento_id) REFERENCES grupos(id) ON DELETE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_evento_acessos_evento_id ON evento_acessos(evento_id);
CREATE INDEX IF NOT EXISTS idx_evento_acessos_acessado_em ON evento_acessos(acessado_em);

