# Configurando Conexão com Supabase

## ⚠️ Importante: IPv4 e Connection Pooler

O Supabase usa IPv6 por padrão, mas muitas plataformas (Railway, Vercel, Render, etc.) são IPv4-only. Para resolver isso, você **DEVE usar o Session Pooler** do Supabase.

## Como Obter as Credenciais do Session Pooler

### Passo 1: Acessar Connection Pooling

1. Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **Settings** → **Database**
3. Role até a seção **Connection Pooling**

### Passo 2: Obter Connection String

1. Selecione **Session mode** (recomendado para TypeORM)
2. Copie a **Connection string** exibida
3. Formato: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

**Exemplo:**
```
postgresql://postgres.abcdefghijklmnop:MinhaSenha123@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

### Passo 3: Extrair Valores Individuais

Da connection string acima, extraia:

```
DB_HOST=aws-0-sa-east-1.pooler.supabase.com  # Host com "pooler" no nome
DB_PORT=6543                                   # Porta do pooler (não 5432!)
DB_USERNAME=postgres.abcdefghijklmnop         # Username com project ref
DB_PASSWORD=MinhaSenha123                     # Sua senha
DB_DATABASE=postgres                          # Sempre "postgres"
```

## Diferenças: Direct Connection vs Session Pooler

| Aspecto | Direct Connection | Session Pooler |
|---------|------------------|----------------|
| **Porta** | 5432 | 6543 |
| **Host** | `db.xxx.supabase.co` | `aws-0-[REGION].pooler.supabase.com` |
| **Username** | `postgres` | `postgres.[PROJECT-REF]` |
| **IPv4** | ❌ Não funciona | ✅ Funciona |
| **Quando usar** | Apenas se tiver IPv4 add-on | Recomendado para produção |

## Configuração para Railway

No Railway, configure as variáveis de ambiente:

```env
DB_HOST=aws-0-sa-east-1.pooler.supabase.com
DB_PORT=6543
DB_USERNAME=postgres.abcdefghijklmnop
DB_PASSWORD=sua-senha-aqui
DB_DATABASE=postgres
```

## Configuração Local (Desenvolvimento)

Para desenvolvimento local, você pode usar a conexão direta (porta 5432) se sua rede suportar IPv6:

```env
# Desenvolvimento local (se suportar IPv6)
DB_HOST=db.abcdefghijklmnop.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua-senha-aqui
DB_DATABASE=postgres
```

Ou use o Session Pooler também (recomendado para consistência):

```env
# Desenvolvimento local (usando pooler - recomendado)
DB_HOST=aws-0-sa-east-1.pooler.supabase.com
DB_PORT=6543
DB_USERNAME=postgres.abcdefghijklmnop
DB_PASSWORD=sua-senha-aqui
DB_DATABASE=postgres
```

## Transaction Pooler (Alternativa)

Se o Session Pooler não funcionar bem para seu caso, você pode tentar o **Transaction Pooler**:

- **Porta**: `6543` (mesma)
- **Host**: Mesmo do Session Pooler
- **Username**: Mesmo formato
- **Diferença**: Modo de pooler (Session vs Transaction)

**Quando usar Transaction Pooler:**
- Para aplicações serverless (Lambda, Vercel Functions)
- Quando não precisa de sessões longas
- Para conexões rápidas e desconexões imediatas

**Quando usar Session Pooler:**
- Para aplicações tradicionais (Railway, servidores)
- Quando precisa de transações complexas
- Para TypeORM (recomendado)

## Troubleshooting

### Erro: "Connection refused" ou timeout

**Problema**: Usando conexão direta (porta 5432) em plataforma IPv4-only

**Solução**: Use o Session Pooler (porta 6543)

### Erro: "authentication failed"

**Problema**: Username incorreto

**Solução**: Certifique-se de usar `postgres.[PROJECT-REF]` (com project ref) para o pooler

### Erro: "database does not exist"

**Problema**: Database name incorreto

**Solução**: Use sempre `postgres` como database name

### Como encontrar o Project Ref

1. No Supabase Dashboard, veja a URL: `https://supabase.com/dashboard/project/[PROJECT-REF]`
2. Ou na connection string: `postgres.[PROJECT-REF]@...`

## Referências

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Supabase Connection Modes](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-modes)

