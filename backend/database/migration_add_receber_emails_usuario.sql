-- Migration: Adicionar campo receber_emails na tabela usuarios
-- Permite que usuários optem por não receber mais emails do sistema

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS receber_emails BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_opt_out_data TIMESTAMP;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_opt_out_reason VARCHAR(255);

-- Criar índice para otimizar consultas de usuários que recebem emails
CREATE INDEX IF NOT EXISTS idx_usuarios_receber_emails ON usuarios(receber_emails);

-- Comentários para documentação
COMMENT ON COLUMN usuarios.receber_emails IS 'Indica se o usuário deseja receber emails do sistema (true = recebe, false = opt-out)';
COMMENT ON COLUMN usuarios.email_opt_out_data IS 'Data em que o usuário optou por não receber mais emails';
COMMENT ON COLUMN usuarios.email_opt_out_reason IS 'Motivo da opt-out (opcional)';
