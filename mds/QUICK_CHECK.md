# 🔍 Verificação Rápida - Vercel → Railway → Supabase

## Teste 1: Verificar Railway está acessível

```bash
curl https://api.orachid.com.br/api/health
```

**✅ Esperado:**
```json
{"status":"ok"}
```

**❌ Se falhar:**
- Verifique Railway Dashboard → Deployments
- Verifique se há erros nos logs
- Verifique se o domínio está configurado

---

## Teste 2: Verificar Railway → Supabase (Banco)

```bash
curl https://api.orachid.com.br/api/health/db
```

**✅ Esperado:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-12-24T..."
}
```

**❌ Se falhar:**
- Verifique variáveis de ambiente no Railway:
  - `DB_HOST` deve ter "pooler" no nome
  - `DB_PORT` deve ser `6543`
  - `DB_USERNAME` deve ter project ref (ex: `postgres.xxxxx`)
- Verifique logs do Railway para erros de conexão

---

## Teste 3: Verificar Vercel → Railway (Frontend)

1. Abra `https://orachid.com.br` no navegador
2. Abra DevTools (F12) → **Console**
3. Execute:

```javascript
fetch('https://api.orachid.com.br/api/health')
  .then(r => r.json())
  .then(data => console.log('✅ Backend OK:', data))
  .catch(err => console.error('❌ Erro:', err));
```

**✅ Esperado:** `✅ Backend OK: {status: "ok"}`

**❌ Se der erro de CORS:**
- Verifique se `https://orachid.com.br` está na lista de origins no backend
- Verifique `backend/src/server.ts`

**❌ Se der "Network Error":**
- Verifique variável `VITE_API_URL` no Vercel
- Deve ser: `https://api.orachid.com.br`

---

## Teste 4: Verificar Requisições Reais

1. Abra `https://orachid.com.br`
2. Abra DevTools (F12) → **Network**
3. Tente fazer login ou criar conta
4. Verifique se as requisições aparecem:
   - URL deve começar com `https://api.orachid.com.br/api/...`
   - Status deve ser `200` ou `201` (não `404` ou `500`)

**✅ Esperado:** Requisições para `api.orachid.com.br` com status 200/201

**❌ Se aparecer `localhost` ou URL errada:**
- Verifique `VITE_API_URL` no Vercel

**❌ Se aparecer `404`:**
- Verifique se a rota existe no backend
- Verifique logs do Railway

**❌ Se aparecer `500`:**
- Verifique logs do Railway
- Pode ser erro de conexão com banco

---

## Teste 5: Verificar Logs do Railway

1. Acesse [Railway Dashboard](https://railway.app/dashboard)
2. Selecione seu projeto
3. Vá em **Deployments** → Último deploy → **View Logs**
4. Procure por:

**✅ Sinais bons:**
- `Database connected`
- `Server running on port 3001`
- Sem erros vermelhos

**❌ Sinais ruins:**
- `Error connecting to database`
- `ECONNREFUSED`
- `authentication failed`
- `getaddrinfo ENOTFOUND`

---

## Teste 6: Verificar Variáveis de Ambiente

### No Railway:

1. Settings → Variables
2. Verifique se existem:

```
✅ NODE_ENV=production
✅ PORT=3001
✅ DB_HOST=aws-0-xxx.pooler.supabase.com  (tem "pooler")
✅ DB_PORT=6543  (não 5432!)
✅ DB_USERNAME=postgres.xxxxx  (com project ref)
✅ DB_PASSWORD=***
✅ DB_DATABASE=postgres
✅ JWT_SECRET=***
✅ FRONTEND_URL=https://orachid.com.br
```

### No Vercel:

1. Settings → Environment Variables
2. Verifique se existe:

```
✅ VITE_API_URL=https://api.orachid.com.br
```

---

## 🐛 Problemas Comuns e Soluções

### Problema: Erro 502 "Application failed to respond"

**Causa:** Servidor não está iniciando ou crashando

**Soluções:**
1. ✅ Verifique logs do Railway
2. ✅ Verifique se variáveis de ambiente estão configuradas
3. ✅ Verifique se build foi bem-sucedido
4. ✅ O código foi atualizado para iniciar mesmo se banco falhar

**Ver guia completo:** `backend/FIX_502_ERROR.md`

### Problema: "Erro ao criar conta" (como na imagem)

**Possíveis causas:**

1. **Backend não está acessível**
   - ✅ Teste: `curl https://api.orachid.com.br/api/health`
   - 🔧 Solução: Verifique Railway está rodando

2. **Banco de dados não conectado**
   - ✅ Teste: `curl https://api.orachid.com.br/api/health/db`
   - 🔧 Solução: Verifique variáveis de ambiente do Railway

3. **CORS bloqueando requisições**
   - ✅ Teste: Console do navegador mostra erro de CORS
   - 🔧 Solução: Verifique `backend/src/server.ts` - adicione `https://orachid.com.br` na lista

4. **URL da API incorreta no frontend**
   - ✅ Teste: Network tab mostra requisições para localhost
   - 🔧 Solução: Configure `VITE_API_URL` no Vercel

---

## 📋 Checklist Completo

- [ ] Railway está rodando (deploy bem-sucedido)
- [ ] `curl https://api.orachid.com.br/api/health` retorna `{"status":"ok"}`
- [ ] `curl https://api.orachid.com.br/api/health/db` retorna `{"database":"connected"}`
- [ ] Variáveis de ambiente configuradas no Railway
- [ ] `VITE_API_URL` configurado no Vercel
- [ ] Frontend acessível em `https://orachid.com.br`
- [ ] Console do navegador sem erros de CORS
- [ ] Network tab mostra requisições para `api.orachid.com.br`
- [ ] Logs do Railway mostram "Database connected"

---

## 🔗 Links Úteis

- Railway Dashboard: https://railway.app/dashboard
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard

Para mais detalhes, veja: `backend/TROUBLESHOOTING.md`

