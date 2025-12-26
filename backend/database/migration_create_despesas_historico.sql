-- Migração: Criar tabela despesas_historico
-- Armazena histórico de alterações nas despesas para auditoria

CREATE TABLE IF NOT EXISTS despesas_historico (
  id SERIAL PRIMARY KEY,
  despesa_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  campo_alterado VARCHAR NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_despesas_historico_despesa FOREIGN KEY (despesa_id) REFERENCES despesas(id) ON DELETE CASCADE,
  CONSTRAINT fk_despesas_historico_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_despesas_historico_despesa_id ON despesas_historico(despesa_id);
CREATE INDEX IF NOT EXISTS idx_despesas_historico_usuario_id ON despesas_historico(usuario_id);
CREATE INDEX IF NOT EXISTS idx_despesas_historico_criado_em ON despesas_historico(criadoEm);

