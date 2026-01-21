# Troubleshooting - Verificar Conexões

Este guia ajuda a verificar se todas as conexões estão funcionando corretamente.

## 🔍 Checklist de Verificação

### 1. Verificar Conexão Vercel → Railway (Backend)

#### Teste 1: Health Check do Backend

```bash
# Teste direto no Railway
curl https://api.orachid.com.br/api/health

# Deve retornar:
# {"status":"ok"}
```

**Se não funcionar:**
- Verifique se o Railway está rodando (dashboard)
- Verifique os logs do Railway
- Verifique se o domínio está configurado corretamente

#### Teste 2: Verificar CORS

No console do navegador (F12), tente fazer uma requisição:

```javascript
fetch('https://api.orachid.com.br/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Se der erro de CORS:**
- Verifique se `https://orachid.com.br` está na lista de origins permitidos no backend
- Verifique o arquivo `backend/src/server.ts`

#### Teste 3: Verificar URL da API no Frontend

1. Abra o DevTools (F12)
2. Vá em **Network**
3. Tente fazer login ou qualquer ação
4. Verifique se as requisições estão indo para `https://api.orachid.com.br/api/...`

**Se estiver indo para localhost ou URL errada:**
- Verifique a variável de ambiente `VITE_API_URL` no Vercel
- Verifique o arquivo `frontend/src/services/api.ts`

### 2. Verificar Conexão Railway → Supabase (Database)

#### Teste 1: Verificar Logs do Railway

1. Acesse o Railway Dashboard
2. Vá em **Deployments** → Selecione o último deploy
3. Clique em **View Logs**
4. Procure por:
   - ✅ `Database connected` - Conexão bem-sucedida
   - ❌ `Error connecting to database` - Erro de conexão

#### Teste 2: Endpoint de Diagnóstico do Banco

```bash
# Teste o endpoint de diagnóstico
curl https://api.orachid.com.br/api/health/db

# Deve retornar:
# {"status":"ok","database":"connected"}
```

#### Teste 3: Verificar Variáveis de Ambiente

No Railway Dashboard:
1. Vá em **Settings** → **Variables**
2. Verifique se todas as variáveis estão configuradas:
   - `DB_HOST` - Deve ter "pooler" no nome
   - `DB_PORT` - Deve ser `6543` (Session Pooler)
   - `DB_USERNAME` - Deve ter project ref (ex: `postgres.xxxxx`)
   - `DB_PASSWORD` - Senha do Supabase
   - `DB_DATABASE` - Deve ser `postgres`

#### Teste 4: Testar Conexão Manualmente

Crie um script temporário para testar:

```bash
# No Railway, vá em Settings → Variables
# Adicione temporariamente:
TEST_DB=true

# Isso ativará logs detalhados de conexão
```

### 3. Verificar Frontend → Vercel

#### Teste 1: Verificar Build do Frontend

1. Acesse o Vercel Dashboard
2. Vá em **Deployments**
3. Verifique se o último deploy foi bem-sucedido
4. Clique em **View Function Logs** para ver erros

#### Teste 2: Verificar Variáveis de Ambiente do Frontend

No Vercel Dashboard:
1. Vá em **Settings** → **Environment Variables**
2. Verifique se existe:
   - `VITE_API_URL` = `https://api.orachid.com.br`

#### Teste 3: Verificar Console do Navegador

1. Abra `https://orachid.com.br`
2. Abra DevTools (F12) → **Console**
3. Procure por erros relacionados a:
   - CORS
   - Network errors
   - API connection errors

## 🛠️ Endpoints de Diagnóstico

### Backend Health Check

```bash
# Health básico
GET https://api.orachid.com.br/api/health

# Health com verificação de banco
GET https://api.orachid.com.br/api/health/db
```

### Frontend

```bash
# Verificar se frontend está acessível
curl https://orachid.com.br

# Deve retornar HTML da aplicação
```

## 📊 Verificação Passo a Passo

### Passo 1: Verificar Railway está rodando

```bash
curl https://api.orachid.com.br/api/health
```

**Esperado:** `{"status":"ok"}`

**Se falhar:**
- Verifique Railway Dashboard → Deployments
- Verifique se há erros nos logs
- Verifique se o domínio está configurado

### Passo 2: Verificar Banco de Dados

```bash
curl https://api.orachid.com.br/api/health/db
```

**Esperado:** `{"status":"ok","database":"connected"}`

**Se falhar:**
- Verifique variáveis de ambiente no Railway
- Verifique logs do Railway para erros de conexão
- Verifique se está usando Session Pooler (porta 6543)

### Passo 3: Verificar Frontend acessa Backend

1. Abra `https://orachid.com.br`
2. Abra DevTools (F12) → Network
3. Tente fazer login
4. Verifique se as requisições vão para `https://api.orachid.com.br/api/...`

**Esperado:** Requisições 200 OK

**Se falhar:**
- Verifique `VITE_API_URL` no Vercel
- Verifique CORS no backend
- Verifique console do navegador para erros

## 🔧 Comandos Úteis

### Verificar DNS

```bash
# Verificar se DNS está resolvendo corretamente
nslookup api.orachid.com.br

# Deve retornar o IP do Railway
```

### Testar CORS

```bash
# Testar CORS manualmente
curl -H "Origin: https://orachid.com.br" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://api.orachid.com.br/api/health
```

### Verificar SSL/HTTPS

```bash
# Verificar certificado SSL
openssl s_client -connect api.orachid.com.br:443 -servername api.orachid.com.br
```

## 🐛 Problemas Comuns

### Erro: "Network Error" ou "Failed to fetch"

**Causa:** Frontend não consegue acessar o backend

**Soluções:**
1. Verifique `VITE_API_URL` no Vercel
2. Verifique CORS no backend
3. Verifique se o backend está rodando

### Erro: "Database connection failed"

**Causa:** Railway não consegue conectar ao Supabase

**Soluções:**
1. Verifique se está usando Session Pooler (porta 6543)
2. Verifique se `DB_USERNAME` tem project ref
3. Verifique se `DB_HOST` tem "pooler" no nome
4. Verifique senha do banco

### Erro: "CORS policy"

**Causa:** Backend não permite requisições do frontend

**Soluções:**
1. Verifique `FRONTEND_URL` no Railway
2. Verifique lista de origins em `backend/src/server.ts`
3. Certifique-se que `credentials: true` está configurado

### Erro: "404 Not Found"

**Causa:** Rota não existe ou URL incorreta

**Soluções:**
1. Verifique se a rota existe no backend
2. Verifique se está usando `/api/` no prefixo
3. Verifique logs do Railway

## 📝 Logs para Verificar

### Railway Logs

Procure por:
- ✅ `Database connected`
- ✅ `Server running on port 3001`
- ❌ `Error connecting to database`
- ❌ `ECONNREFUSED`
- ❌ `authentication failed`

### Vercel Logs

Procure por:
- ✅ Build successful
- ❌ Build failed
- ❌ Environment variable missing

### Console do Navegador

Procure por:
- ❌ `CORS policy`
- ❌ `Network Error`
- ❌ `401 Unauthorized`
- ❌ `500 Internal Server Error`

## 🔗 Links Úteis

- Railway Dashboard: https://railway.app/dashboard
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard

