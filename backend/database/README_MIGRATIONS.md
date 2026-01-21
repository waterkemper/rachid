# Migrações do Sistema de Assinaturas

## Migrações Obrigatórias

Execute estas migrações na ordem especificada:

1. **`migration_create_subscriptions.sql`**
   - Cria as tabelas de assinaturas (`subscriptions`, `subscription_history`, `subscription_features`)
   - Adiciona campos `paypal_payer_id` e `subscription_id` na tabela `usuarios`
   - Atualiza constraint do campo `plano` para incluir `LIFETIME`
   - **Execute esta migração PRIMEIRO**

2. **`migration_create_plan_limits.sql`**
   - Cria a tabela `plan_limits` para limites configuráveis
   - Insere limites padrão para FREE, PRO e LIFETIME
   - **Execute esta migração SEGUNDO**

3. **`migration_create_promo_codes.sql`**
   - Cria a tabela `promo_codes` para códigos promocionais
   - **Execute esta migração TERCEIRO**

## Migração Opcional

### `migration_migrate_existing_pro_users.sql`

**Esta migração é OPCIONAL** e deve ser executada apenas se você quiser migrar usuários PRO existentes para o novo sistema.

**Quando executar:**
- Se você tem usuários com `plano = 'PRO'` ou `plano = 'LIFETIME'` no sistema antigo
- Se você quer manter a continuidade para esses usuários
- Se você quer que esses usuários apareçam no novo sistema de assinaturas

**O que faz:**
- Cria assinaturas "legacy" para usuários PRO existentes
- Assinaturas migradas não têm PayPal associado (são apenas registros internos)
- Habilita todas as features PRO para essas assinaturas
- Cria histórico de migração

**Quando NÃO executar:**
- Se todos os usuários são FREE
- Se você prefere que usuários PRO antigos precisem se inscrever novamente
- Se você quer começar do zero com o novo sistema

**Nota:** Usuários FREE não precisam ser migrados - eles continuam funcionando normalmente sem assinatura.

## Ordem de Execução Recomendada

```sql
-- 1. Obrigatório
\i migration_create_subscriptions.sql

-- 2. Obrigatório
\i migration_create_plan_limits.sql

-- 3. Obrigatório
\i migration_create_promo_codes.sql

-- 4. Opcional (apenas se quiser migrar usuários PRO existentes)
\i migration_migrate_existing_pro_users.sql
```

## Verificação Pós-Migração

Após executar as migrações, verifique:

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('subscriptions', 'subscription_history', 'subscription_features', 'plan_limits', 'promo_codes');

-- Verificar se os campos foram adicionados em usuarios
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
  AND column_name IN ('paypal_payer_id', 'subscription_id');

-- Verificar limites padrão
SELECT plan_type, feature_key, limit_value, enabled 
FROM plan_limits 
ORDER BY plan_type, feature_key;

-- Se executou a migração opcional, verificar assinaturas migradas
SELECT COUNT(*) as total_migrated
FROM subscriptions 
WHERE paypal_subscription_id IS NULL;
```

## Rollback

Se precisar reverter as migrações:

```sql
-- Remover assinaturas migradas (se executou a migração opcional)
DELETE FROM subscription_features WHERE subscription_id IN (
  SELECT id FROM subscriptions WHERE paypal_subscription_id IS NULL
);
DELETE FROM subscription_history WHERE subscription_id IN (
  SELECT id FROM subscriptions WHERE paypal_subscription_id IS NULL
);
DELETE FROM subscriptions WHERE paypal_subscription_id IS NULL;

-- Remover campos de usuarios
ALTER TABLE usuarios 
DROP COLUMN IF EXISTS subscription_id,
DROP COLUMN IF EXISTS paypal_payer_id;

-- Remover tabelas (CUIDADO: isso apaga TODOS os dados)
DROP TABLE IF EXISTS subscription_features CASCADE;
DROP TABLE IF EXISTS subscription_history CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS plan_limits CASCADE;
DROP TABLE IF EXISTS promo_codes CASCADE;

-- Reverter constraint do plano
ALTER TABLE usuarios 
DROP CONSTRAINT IF EXISTS usuarios_plano_check;
ALTER TABLE usuarios 
ADD CONSTRAINT usuarios_plano_check 
CHECK (plano IN ('FREE', 'PRO'));
```