-- Migration: Criar tabela email_pendentes
-- Sistema de agregação de emails para evitar spam
-- Janela de 5 minutos para consolidar múltiplas notificações

CREATE TABLE IF NOT EXISTS email_pendentes (
  id SERIAL PRIMARY KEY,
  destinatario VARCHAR(255) NOT NULL,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  evento_id INTEGER REFERENCES grupos(id) ON DELETE CASCADE,
  tipo_notificacao VARCHAR(50) NOT NULL,
  dados JSONB NOT NULL DEFAULT '{}',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processar_apos TIMESTAMP WITH TIME ZONE NOT NULL,
  processado BOOLEAN DEFAULT FALSE,
  processado_em TIMESTAMP WITH TIME ZONE,
  email_enviado_id INTEGER REFERENCES emails(id) ON DELETE SET NULL
);

-- Índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_email_pendentes_processar 
  ON email_pendentes (processado, processar_apos);

CREATE INDEX IF NOT EXISTS idx_email_pendentes_destinatario_evento 
  ON email_pendentes (destinatario, evento_id, processado);

CREATE INDEX IF NOT EXISTS idx_email_pendentes_tipo 
  ON email_pendentes (tipo_notificacao, processado);

-- Comentários
COMMENT ON TABLE email_pendentes IS 'Armazena notificações pendentes para agregação antes do envio';
COMMENT ON COLUMN email_pendentes.tipo_notificacao IS 'Tipos: inclusao-evento, nova-despesa, despesa-editada, mudanca-saldo, evento-finalizado';
COMMENT ON COLUMN email_pendentes.processar_apos IS 'Timestamp após o qual a notificação pode ser processada (janela de 5 min)';
COMMENT ON COLUMN email_pendentes.dados IS 'Dados específicos da notificação em formato JSON';

-- Permissões (ajuste conforme necessário)
GRANT ALL PRIVILEGES ON email_pendentes TO rachid;
GRANT USAGE, SELECT ON SEQUENCE email_pendentes_id_seq TO rachid;
