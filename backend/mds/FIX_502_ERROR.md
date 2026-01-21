# 🔧 Como Corrigir Erro 502 "Application failed to respond"

## O que é o erro 502?

O erro 502 significa que o Railway não consegue se comunicar com sua aplicação. Isso geralmente acontece quando:

1. ❌ O servidor não está iniciando
2. ❌ O servidor está crashando imediatamente após iniciar
3. ❌ O servidor não está escutando na porta correta
4. ❌ Erro na inicialização do banco de dados está impedindo o servidor de iniciar

## ✅ Correção Aplicada

O código foi atualizado para que o servidor **inicie mesmo se o banco de dados falhar**. Isso evita o erro 502 e permite que você veja os erros nos logs.

## 🔍 Verificação Passo a Passo

### Passo 1: Verificar Logs do Railway

1. Acesse [Railway Dashboard](https://railway.app/dashboard)
2. Selecione seu projeto
3. Vá em **Deployments** → Último deploy
4. Clique em **View Logs**

**Procure por:**

✅ **Sinais bons:**
```
Server running on port 3001
✅ Database connected successfully
```

❌ **Sinais ruins:**
```
❌ Error connecting to database
Server is running but database is not connected
```

### Passo 2: Verificar Variáveis de Ambiente

No Railway Dashboard → Settings → Variables, verifique:

```env
✅ NODE_ENV=production
✅ PORT=3001
✅ DB_HOST=aws-0-xxx.pooler.supabase.com  (deve ter "pooler")
✅ DB_PORT=6543  (não 5432!)
✅ DB_USERNAME=postgres.xxxxx  (com project ref)
✅ DB_PASSWORD=***  (senha correta)
✅ DB_DATABASE=postgres
```

**⚠️ Erros comuns:**

1. **DB_HOST sem "pooler"**
   - ❌ Errado: `db.xxxxx.supabase.co`
   - ✅ Correto: `aws-0-xxx.pooler.supabase.com`

2. **DB_PORT errado**
   - ❌ Errado: `5432`
   - ✅ Correto: `6543` (Session Pooler)

3. **DB_USERNAME sem project ref**
   - ❌ Errado: `postgres`
   - ✅ Correto: `postgres.xxxxx` (com project ref)

### Passo 3: Verificar se o Servidor Está Rodando

Após fazer deploy, teste:

```bash
curl https://api.orachid.com.br/api/health
```

**✅ Esperado:**
```json
{"status":"ok"}
```

**❌ Se ainda der 502:**
- Verifique os logs do Railway
- Verifique se o build foi bem-sucedido
- Verifique se há erros de sintaxe no código

### Passo 4: Verificar Conexão com Banco

```bash
curl https://api.orachid.com.br/api/health/db
```

**✅ Esperado (se banco conectado):**
```json
{
  "status": "ok",
  "database": "connected"
}
```

**⚠️ Esperado (se banco não conectado, mas servidor rodando):**
```json
{
  "status": "error",
  "database": "not_initialized",
  "message": "Database connection not initialized"
}
```

Isso significa que o servidor está rodando, mas o banco não conectou. Verifique as variáveis de ambiente.

## 🐛 Problemas Comuns e Soluções

### Problema 1: "Error connecting to database"

**Causa:** Variáveis de ambiente incorretas ou banco inacessível

**Solução:**
1. Verifique se está usando Session Pooler (porta 6543)
2. Verifique se `DB_USERNAME` tem project ref
3. Verifique se `DB_HOST` tem "pooler" no nome
4. Verifique senha do banco

### Problema 2: "getaddrinfo ENOTFOUND"

**Causa:** Host do banco incorreto

**Solução:**
- Certifique-se de usar o host do Session Pooler
- Formato: `aws-0-[REGION].pooler.supabase.com`

### Problema 3: "authentication failed"

**Causa:** Username ou senha incorretos

**Solução:**
- Para Session Pooler, username deve ser: `postgres.[PROJECT-REF]`
- Verifique a senha no Supabase Dashboard

### Problema 4: Servidor não inicia

**Causa:** Erro no código ou build falhou

**Solução:**
1. Verifique logs do Railway
2. Verifique se o build foi bem-sucedido
3. Teste localmente: `npm run build && npm start`

## 📋 Checklist Completo

- [ ] Build foi bem-sucedido no Railway
- [ ] Logs mostram "Server running on port 3001"
- [ ] Variáveis de ambiente configuradas corretamente
- [ ] `DB_HOST` tem "pooler" no nome
- [ ] `DB_PORT=6543`
- [ ] `DB_USERNAME` tem project ref
- [ ] `curl https://api.orachid.com.br/api/health` retorna `{"status":"ok"}`
- [ ] Logs mostram "Database connected" ou erro específico

## 🔗 Próximos Passos

1. **Faça commit e push** das alterações:
```bash
git add backend/src/server.ts
git commit -m "Fix: Servidor inicia mesmo se banco falhar (evita 502)"
git push
```

2. **Aguarde deploy** no Railway

3. **Verifique logs** após o deploy

4. **Teste endpoints:**
   - `/api/health` - Deve funcionar sempre
   - `/api/health/db` - Mostra status do banco

5. **Se banco não conectar**, corrija as variáveis de ambiente e o servidor tentará reconectar automaticamente

## 📖 Referências

- [Supabase Connection Pooling](backend/database/SUPABASE_CONNECTION.md)
- [Troubleshooting Completo](backend/TROUBLESHOOTING.md)
- [Variáveis de Ambiente](backend/ENV_VARIABLES.md)

