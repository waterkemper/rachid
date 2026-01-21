-- Migration: Criar tabela emails para registro de todos os emails enviados
-- Armazena histórico completo de emails para auditoria, tracking e controle de opt-out

CREATE TABLE IF NOT EXISTS emails (
  id SERIAL PRIMARY KEY,
  destinatario VARCHAR(255) NOT NULL,
  assunto VARCHAR(500) NOT NULL,
  tipo_email VARCHAR(50) NOT NULL, -- 'boas-vindas', 'nova-despesa', 'despesa-editada', 'inclusao-evento', 'reativacao-sem-evento', etc.
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviando', 'enviado', 'falhou', 'cancelado')),
  
  -- Relacionamentos opcionais
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  evento_id INTEGER REFERENCES grupos(id) ON DELETE SET NULL,
  despesa_id INTEGER REFERENCES despesas(id) ON DELETE SET NULL,
  
  -- Metadados do email
  corpo_html TEXT,
  corpo_texto TEXT,
  remetente_email VARCHAR(255),
  remetente_nome VARCHAR(255),
  
  -- Tracking e erros
  enviado_em TIMESTAMP,
  falhou_em TIMESTAMP,
  tentativas INTEGER DEFAULT 0,
  erro_message TEXT,
  erro_detalhes JSONB,
  
  -- Metadados do SendGrid (se disponível)
  sendgrid_message_id VARCHAR(255),
  sendgrid_response JSONB,
  
  -- Timestamps
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Índices para performance
  CONSTRAINT idx_emails_destinatario CHECK (destinatario IS NOT NULL),
  CONSTRAINT idx_emails_status CHECK (status IS NOT NULL)
);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_emails_destinatario ON emails(destinatario);
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_tipo ON emails(tipo_email);
CREATE INDEX IF NOT EXISTS idx_emails_usuario_id ON emails(usuario_id);
CREATE INDEX IF NOT EXISTS idx_emails_evento_id ON emails(evento_id);
CREATE INDEX IF NOT EXISTS idx_emails_despesa_id ON emails(despesa_id);
CREATE INDEX IF NOT EXISTS idx_emails_enviado_em ON emails(enviado_em);
CREATE INDEX IF NOT EXISTS idx_emails_criado_em ON emails(criado_em);
CREATE INDEX IF NOT EXISTS idx_emails_sendgrid_message_id ON emails(sendgrid_message_id) WHERE sendgrid_message_id IS NOT NULL;

-- Índice composto para consultas comuns
CREATE INDEX IF NOT EXISTS idx_emails_usuario_tipo_status ON emails(usuario_id, tipo_email, status) WHERE usuario_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emails_evento_tipo ON emails(evento_id, tipo_email) WHERE evento_id IS NOT NULL;

-- Comentários para documentação
COMMENT ON TABLE emails IS 'Registro completo de todos os emails enviados pelo sistema';
COMMENT ON COLUMN emails.destinatario IS 'Email do destinatário';
COMMENT ON COLUMN emails.tipo_email IS 'Tipo de email: boas-vindas, nova-despesa, despesa-editada, inclusao-evento, reativacao-sem-evento, reativacao-sem-participantes, reativacao-sem-despesas, recuperacao-senha, etc.';
COMMENT ON COLUMN emails.status IS 'Status do envio: pendente, enviando, enviado, falhou, cancelado';
COMMENT ON COLUMN emails.sendgrid_message_id IS 'ID da mensagem no SendGrid (para rastreamento)';
COMMENT ON COLUMN emails.sendgrid_response IS 'Resposta completa do SendGrid (JSON)';
