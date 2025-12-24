# Como Criar o Banco de Dados no Supabase

Este guia mostra como criar todas as tabelas do projeto no Supabase usando o schema SQL.

## Método 1: Usando o SQL Editor do Supabase (Recomendado) ⭐

### Passo 1: Acessar o SQL Editor

1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. No menu lateral, clique em **SQL Editor**
3. Clique em **New query**

### Passo 2: Copiar e Executar o Schema

1. Abra o arquivo `backend/database/schema.sql`
2. Copie **todo o conteúdo** do arquivo
3. Cole no editor SQL do Supabase
4. Clique em **Run** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)

### Passo 3: Verificar se as Tabelas Foram Criadas

1. No menu lateral, clique em **Table Editor**
2. Você deve ver todas as tabelas criadas:
   - `usuarios`
   - `participantes`
   - `grupos`
   - `despesas`
   - `participacoes_despesa`
   - `participantes_grupos`
   - `password_reset_tokens`
   - `grupos_maiores`
   - `grupos_maiores_grupos`
   - `grupos_maiores_participantes`
   - `grupos_participantes_evento`
   - `participantes_grupo_evento`

## Método 2: Usando TypeORM Synchronize (Temporário - NÃO Recomendado para Produção)

⚠️ **Atenção**: Este método deve ser usado **apenas uma vez** para criar as tabelas inicialmente. Depois, desabilite o `synchronize`.

### Passo 1: Habilitar Synchronize Temporariamente

1. Edite `backend/src/database/data-source.ts`
2. Altere `synchronize` para `true` temporariamente:

```typescript
export const AppDataSource = new DataSource({
  // ... outras configs
  synchronize: true, // ⚠️ TEMPORÁRIO - apenas para criar tabelas
  // ... resto
});
```

### Passo 2: Configurar Variáveis de Ambiente

Crie um arquivo `.env` no `backend/` com as credenciais do Supabase:

```env
NODE_ENV=development
PORT=3001
DB_HOST=[seu-host-supabase].supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=[sua-senha]
DB_DATABASE=postgres
```

### Passo 3: Executar o Backend

```bash
cd backend
npm install
npm run dev
```

O TypeORM criará as tabelas automaticamente quando conectar.

### Passo 4: Desabilitar Synchronize

⚠️ **IMPORTANTE**: Após criar as tabelas, volte `synchronize` para `false`:

```typescript
synchronize: process.env.NODE_ENV !== 'production', // false em produção
```

## Método 3: Usando psql (Linha de Comando)

Se você tem `psql` instalado:

```bash
# Conectar ao Supabase
psql "postgresql://postgres:[PASSWORD]@[HOST].supabase.co:5432/postgres"

# Executar o schema
\i backend/database/schema.sql

# Ou copiar e colar o conteúdo diretamente
```

## Verificação

Após criar as tabelas, verifique se tudo está correto:

### 1. Listar todas as tabelas

No SQL Editor do Supabase, execute:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 2. Verificar estrutura de uma tabela

```sql
-- Exemplo: ver estrutura da tabela usuarios
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;
```

## Troubleshooting

### Erro: "relation already exists"

Se você já tentou criar as tabelas antes, você pode:

1. **Dropar todas as tabelas** (⚠️ CUIDADO: isso apagará todos os dados):
```sql
-- Executar no SQL Editor do Supabase
DROP TABLE IF EXISTS participantes_grupo_evento CASCADE;
DROP TABLE IF EXISTS grupos_participantes_evento CASCADE;
DROP TABLE IF EXISTS grupos_maiores_participantes CASCADE;
DROP TABLE IF EXISTS grupos_maiores_grupos CASCADE;
DROP TABLE IF EXISTS grupos_maiores CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS participantes_grupos CASCADE;
DROP TABLE IF EXISTS participacoes_despesa CASCADE;
DROP TABLE IF EXISTS despesas CASCADE;
DROP TABLE IF EXISTS grupos CASCADE;
DROP TABLE IF EXISTS participantes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
```

Depois execute o `schema.sql` novamente.

### Erro: "permission denied"

Certifique-se de estar usando as credenciais corretas do Supabase (não as de desenvolvimento local).

### Verificar conexão

Teste a conexão executando:

```sql
SELECT version();
```

## Próximos Passos

Após criar as tabelas:

1. ✅ Configure as variáveis de ambiente no Railway
2. ✅ Teste a conexão do backend com o Supabase
3. ✅ Desabilite `synchronize` em produção
4. ✅ Considere criar migrations para futuras mudanças no schema

## Referências

- [Supabase SQL Editor](https://supabase.com/docs/guides/database/tables)
- [PostgreSQL CREATE TABLE](https://www.postgresql.org/docs/current/sql-createtable.html)
- [TypeORM Migrations](https://typeorm.io/migrations)

