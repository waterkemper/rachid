-- Script de diagnóstico: Verificar encoding do PostgreSQL
-- Execute este script para verificar o encoding do servidor e cliente

-- Verificar encoding do servidor
SHOW server_encoding;

-- Verificar encoding do cliente
SHOW client_encoding;

-- Verificar encoding do banco de dados atual
SELECT pg_encoding_to_char(encoding) 
FROM pg_database 
WHERE datname = current_database();

-- Verificar encoding da tabela plan_limits (se existir)
SELECT 
    c.relname AS table_name,
    pg_encoding_to_char(c.relencoding) AS table_encoding
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'plan_limits'
    AND n.nspname = 'public';
