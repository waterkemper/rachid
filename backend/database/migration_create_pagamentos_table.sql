-- Migration: Criar tabela pagamentos para tracking de pagamentos efetivos
-- Permite marcar sugestões de pagamento como pagas e confirmadas
-- Usa IDs para matching (não nomes) para evitar ambiguidade com nomes duplicados

-- Criar tabela pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
  id SERIAL PRIMARY KEY,
  grupo_id INTEGER NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL' CHECK (tipo IN ('INDIVIDUAL', 'ENTRE_GRUPOS')),
  
  -- Campos para pagamentos individuais (tipo INDIVIDUAL)
  de_participante_id INTEGER NULL REFERENCES participantes(id) ON DELETE RESTRICT,
  para_participante_id INTEGER NULL REFERENCES participantes(id) ON DELETE RESTRICT,
  
  -- Campos para pagamentos entre grupos (tipo ENTRE_GRUPOS)
  de_grupo_id INTEGER NULL REFERENCES grupos_participantes_evento(id) ON DELETE RESTRICT,
  para_grupo_id INTEGER NULL REFERENCES grupos_participantes_evento(id) ON DELETE RESTRICT,
  
  -- Nomes como referência (para exibição/histórico, não para matching)
  sugestao_de_nome VARCHAR(255) NOT NULL,
  sugestao_para_nome VARCHAR(255) NOT NULL,
  sugestao_valor DECIMAL(10, 2) NOT NULL,
  sugestao_index INTEGER NOT NULL,
  
  pago_por_participante_id INTEGER NOT NULL REFERENCES participantes(id) ON DELETE RESTRICT,
  confirmado_por_participante_id INTEGER REFERENCES participantes(id) ON DELETE SET NULL,
  valor DECIMAL(10, 2) NOT NULL,
  data_pagamento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmado_em TIMESTAMP,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints de integridade
  CONSTRAINT chk_pagamento_individual CHECK (
    (tipo = 'INDIVIDUAL' AND de_participante_id IS NOT NULL AND para_participante_id IS NOT NULL AND de_grupo_id IS NULL AND para_grupo_id IS NULL) OR
    (tipo = 'ENTRE_GRUPOS' AND de_grupo_id IS NOT NULL AND para_grupo_id IS NOT NULL AND de_participante_id IS NULL AND para_participante_id IS NULL)
  )
);

-- Unique constraints para evitar duplicatas
-- Para pagamentos individuais
CREATE UNIQUE INDEX IF NOT EXISTS idx_pagamentos_unique_individual 
ON pagamentos(grupo_id, tipo, de_participante_id, para_participante_id, sugestao_valor) 
WHERE tipo = 'INDIVIDUAL';

-- Para pagamentos entre grupos
CREATE UNIQUE INDEX IF NOT EXISTS idx_pagamentos_unique_grupos 
ON pagamentos(grupo_id, tipo, de_grupo_id, para_grupo_id, sugestao_valor) 
WHERE tipo = 'ENTRE_GRUPOS';

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_pagamentos_grupo_id ON pagamentos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_tipo ON pagamentos(tipo);
CREATE INDEX IF NOT EXISTS idx_pagamentos_sugestao_index ON pagamentos(grupo_id, sugestao_index);
CREATE INDEX IF NOT EXISTS idx_pagamentos_pago_por ON pagamentos(pago_por_participante_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_confirmado_por ON pagamentos(confirmado_por_participante_id);

-- Índices específicos para pagamentos individuais
CREATE INDEX IF NOT EXISTS idx_pagamentos_de_participante 
ON pagamentos(grupo_id, tipo, de_participante_id) 
WHERE tipo = 'INDIVIDUAL';

CREATE INDEX IF NOT EXISTS idx_pagamentos_para_participante 
ON pagamentos(grupo_id, tipo, para_participante_id) 
WHERE tipo = 'INDIVIDUAL';

-- Índices específicos para pagamentos entre grupos
CREATE INDEX IF NOT EXISTS idx_pagamentos_de_grupo 
ON pagamentos(grupo_id, tipo, de_grupo_id) 
WHERE tipo = 'ENTRE_GRUPOS';

CREATE INDEX IF NOT EXISTS idx_pagamentos_para_grupo 
ON pagamentos(grupo_id, tipo, para_grupo_id) 
WHERE tipo = 'ENTRE_GRUPOS';
