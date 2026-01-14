-- Migration: Adicionar campos de tracking para emails de reativação
-- Permite rastrear quando emails de reativação foram enviados para evitar duplicatas

-- Campos em usuarios (para tracking de usuários sem evento)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_email_reativacao_sem_evento TIMESTAMP;

-- Campos em grupos (para tracking de eventos sem participantes/despesas)
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS ultimo_email_reativacao_sem_participantes TIMESTAMP;
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS ultimo_email_reativacao_sem_despesas TIMESTAMP;
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS tentativa_email_reativacao_sem_participantes INTEGER DEFAULT 0;
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS tentativa_email_reativacao_sem_despesas INTEGER DEFAULT 0;

-- Campos em usuarios (para tracking de tentativas de emails sem evento)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tentativa_email_reativacao_sem_evento INTEGER DEFAULT 0;

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_usuarios_ultimo_email_sem_evento ON usuarios(ultimo_email_reativacao_sem_evento);
CREATE INDEX IF NOT EXISTS idx_grupos_ultimo_email_sem_participantes ON grupos(ultimo_email_reativacao_sem_participantes);
CREATE INDEX IF NOT EXISTS idx_grupos_ultimo_email_sem_despesas ON grupos(ultimo_email_reativacao_sem_despesas);
