-- Migration: Tornar participante_pagador_id nullable para suportar despesas placeholder
-- Permite criar despesas sem pagador definido (templates de eventos)

-- Remover constraint NOT NULL
ALTER TABLE despesas ALTER COLUMN participante_pagador_id DROP NOT NULL;

-- Nota: A foreign key constraint permanece, mas agora permite NULL
-- Isso permite criar despesas placeholder que serão preenchidas posteriormente

