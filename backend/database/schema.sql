-- Schema SQL para Supabase
-- Este arquivo cria todas as tabelas necessárias para o projeto Rachid

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  senha VARCHAR NOT NULL,
  nome VARCHAR NOT NULL,
  ddd VARCHAR,
  telefone VARCHAR,
  plano VARCHAR DEFAULT 'FREE',
  planoValidoAte TIMESTAMP,
  criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Participantes
CREATE TABLE IF NOT EXISTS participantes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  nome VARCHAR NOT NULL,
  email VARCHAR,
  chavePix VARCHAR,
  telefone VARCHAR,
  criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_participantes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de Grupos
CREATE TABLE IF NOT EXISTS grupos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  nome VARCHAR NOT NULL,
  descricao TEXT,
  data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_grupos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de Despesas
CREATE TABLE IF NOT EXISTS despesas (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  grupo_id INTEGER NOT NULL,
  descricao VARCHAR NOT NULL,
  valorTotal DECIMAL(10, 2) NOT NULL,
  participante_pagador_id INTEGER NOT NULL,
  data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_despesas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_despesas_grupo FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
  CONSTRAINT fk_despesas_pagador FOREIGN KEY (participante_pagador_id) REFERENCES participantes(id) ON DELETE CASCADE
);

-- Tabela de Participações em Despesas
CREATE TABLE IF NOT EXISTS participacoes_despesa (
  id SERIAL PRIMARY KEY,
  despesa_id INTEGER NOT NULL,
  participante_id INTEGER NOT NULL,
  valorDevePagar DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_participacoes_despesa FOREIGN KEY (despesa_id) REFERENCES despesas(id) ON DELETE CASCADE,
  CONSTRAINT fk_participacoes_participante FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE
);

-- Tabela de Participantes em Grupos (relação many-to-many)
CREATE TABLE IF NOT EXISTS participantes_grupos (
  id SERIAL PRIMARY KEY,
  participante_id INTEGER NOT NULL,
  grupo_id INTEGER NOT NULL,
  CONSTRAINT fk_participantes_grupos_participante FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE,
  CONSTRAINT fk_participantes_grupos_grupo FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE
);

-- Tabela de Tokens de Reset de Senha
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  token VARCHAR UNIQUE NOT NULL,
  usuario_id INTEGER NOT NULL,
  expiraEm TIMESTAMP NOT NULL,
  usado BOOLEAN DEFAULT FALSE,
  criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_reset_tokens_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de Grupos Maiores
CREATE TABLE IF NOT EXISTS grupos_maiores (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  nome VARCHAR NOT NULL,
  descricao TEXT,
  criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimoUsoEm TIMESTAMP,
  CONSTRAINT fk_grupos_maiores_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de Grupos em Grupos Maiores (relação many-to-many)
CREATE TABLE IF NOT EXISTS grupos_maiores_grupos (
  id SERIAL PRIMARY KEY,
  grupo_maior_id INTEGER NOT NULL,
  grupo_id INTEGER NOT NULL,
  CONSTRAINT fk_grupos_maiores_grupos_maior FOREIGN KEY (grupo_maior_id) REFERENCES grupos_maiores(id) ON DELETE CASCADE,
  CONSTRAINT fk_grupos_maiores_grupos_grupo FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE
);

-- Tabela de Participantes em Grupos Maiores (relação many-to-many)
CREATE TABLE IF NOT EXISTS grupos_maiores_participantes (
  id SERIAL PRIMARY KEY,
  grupo_maior_id INTEGER NOT NULL,
  participante_id INTEGER NOT NULL,
  CONSTRAINT fk_grupos_maiores_participantes_maior FOREIGN KEY (grupo_maior_id) REFERENCES grupos_maiores(id) ON DELETE CASCADE,
  CONSTRAINT fk_grupos_maiores_participantes_participante FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE
);

-- Tabela de Grupos de Participantes por Evento
CREATE TABLE IF NOT EXISTS grupos_participantes_evento (
  id SERIAL PRIMARY KEY,
  grupo_id INTEGER NOT NULL,
  nome VARCHAR NOT NULL,
  descricao TEXT,
  criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_grupos_participantes_evento_grupo FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE
);

-- Tabela de Participantes em Grupos de Evento (relação many-to-many)
CREATE TABLE IF NOT EXISTS participantes_grupo_evento (
  id SERIAL PRIMARY KEY,
  grupo_participantes_evento_id INTEGER NOT NULL,
  participante_id INTEGER NOT NULL,
  CONSTRAINT fk_participantes_grupo_evento_grupo FOREIGN KEY (grupo_participantes_evento_id) REFERENCES grupos_participantes_evento(id) ON DELETE CASCADE,
  CONSTRAINT fk_participantes_grupo_evento_participante FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_participantes_usuario_id ON participantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_grupos_usuario_id ON grupos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_despesas_grupo_id ON despesas(grupo_id);
CREATE INDEX IF NOT EXISTS idx_despesas_usuario_id ON despesas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_participacoes_despesa_id ON participacoes_despesa(despesa_id);
CREATE INDEX IF NOT EXISTS idx_participacoes_participante_id ON participacoes_despesa(participante_id);
CREATE INDEX IF NOT EXISTS idx_participantes_grupos_grupo_id ON participantes_grupos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_participantes_grupos_participante_id ON participantes_grupos(participante_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_usuario_id ON password_reset_tokens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_grupos_maiores_usuario_id ON grupos_maiores(usuario_id);

