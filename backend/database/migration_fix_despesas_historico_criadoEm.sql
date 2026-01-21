-- Migration: Corrigir coluna criadoem na tabela despesas_historico
-- Este script verifica e corrige o nome da coluna de data de criação

-- Verificar se a tabela existe
DO $$
BEGIN
    -- Se a coluna não existe com o nome correto, tentar renomear ou criar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'despesas_historico' 
        AND column_name = 'criadoem'
    ) THEN
        -- Tentar renomear se existir com nome diferente
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'despesas_historico' 
            AND column_name = 'criado_em'
        ) THEN
            ALTER TABLE despesas_historico RENAME COLUMN criado_em TO criadoem;
            RAISE NOTICE 'Coluna renomeada de criado_em para criadoem';
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'despesas_historico' 
            AND column_name = 'criadoEm'
        ) THEN
            ALTER TABLE despesas_historico RENAME COLUMN "criadoEm" TO criadoem;
            RAISE NOTICE 'Coluna renomeada de criadoEm para criadoem';
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'despesas_historico' 
            AND column_name = 'created_at'
        ) THEN
            ALTER TABLE despesas_historico RENAME COLUMN created_at TO criadoem;
            RAISE NOTICE 'Coluna renomeada de created_at para criadoem';
        ELSE
            -- Criar a coluna se não existir
            ALTER TABLE despesas_historico 
            ADD COLUMN criadoem TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            RAISE NOTICE 'Coluna criadoem criada';
        END IF;
    ELSE
        RAISE NOTICE 'Coluna criadoem já existe com o nome correto';
    END IF;
END $$;



