# Guia de Deploy no Railway

## ✅ O que já está configurado no código

1. **CORS atualizado** (`src/server.ts`) - Inclui domínios de produção
2. **Synchronize desabilitado em produção** (`src/database/data-source.ts`)
3. **Railway.json criado** - Configuração básica do Railway
4. **TypeScript movido para dependencies** - Necessário para build em produção
5. **nixpacks.toml criado** - Configuração explícita do build
6. **Build script atualizado** - Usa `npx tsc` para garantir execução correta

## 🔧 O que você precisa fazer no Railway

### 1. Configurar Variáveis de Ambiente

No dashboard do Railway:
1. Vá em **Settings** → **Variables**
2. Adicione as seguintes variáveis:

```
NODE_ENV=production
PORT=3001

DB_HOST=[host-do-supabase-pooler]  # Use Session Pooler para IPv4!
DB_PORT=6543  # Porta do Session Pooler (não 5432!)
DB_USERNAME=postgres.[project-ref]  # Com project ref no username
DB_PASSWORD=[senha-do-supabase]
DB_DATABASE=postgres

JWT_SECRET=[chave-gerada]
FRONTEND_URL=https://orachid.com.br
```

### 2. Verificar Configuração do Domínio

1. Vá em **Settings** → **Networking**
2. Verifique se o domínio `api.orachid.com.br` está configurado
3. Se não estiver, adicione o domínio customizado

### 3. Configurar DNS

No seu provedor de domínio (onde comprou orachid.com.br):

Adicione um registro CNAME:
```
Tipo: CNAME
Nome: api
Valor: [domínio-railway].railway.app
TTL: 3600
```

O valor exato será mostrado no Railway após adicionar o domínio customizado.

### 4. Deploy

O Railway fará deploy automático quando você:
- Fizer push no GitHub (se conectado)
- Ou clicar em **Deploy** manualmente

### 5. Configurar Schema do pg-boss (Fila de Emails)

Após o primeiro deploy, você precisa executar o script de setup do pg-boss **uma vez**:

**Opção A - Via Railway CLI (Recomendado):**
```bash
# Instalar Railway CLI (se ainda não tiver)
npm install -g @railway/cli

# Fazer login
railway login

# Conectar ao projeto
cd backend
railway link

# Executar script de setup
railway run npm run setup-pgboss
```

**Opção B - Via Console do Railway:**
1. Acesse seu projeto no Railway
2. Vá em **Deployments** → Selecione o último deploy
3. Clique em **View Logs** ou **Shell**
4. Execute: `npm run setup-pgboss`

**Importante:**
- Execute apenas **uma vez** após o primeiro deploy
- Não precisa executar novamente (o schema persiste no banco)
- Veja `RAILWAY_PGBOSS_SETUP.md` para mais detalhes

## 📝 Checklist

- [ ] Variáveis de ambiente configuradas no Railway
- [ ] Domínio `api.orachid.com.br` adicionado no Railway
- [ ] DNS configurado no provedor de domínio
- [ ] Deploy realizado com sucesso
- [ ] **Schema do pg-boss criado** (executar `npm run setup-pgboss`)
- [ ] Testar API: `https://api.orachid.com.br/api/health`

## 🧪 Testar

Após o deploy, teste:

```bash
# Health check
curl https://api.orachid.com.br/api/health

# Deve retornar: {"status":"ok"}
```

## ⚠️ Importante

- **NUNCA** commite arquivos `.env` no GitHub
- As variáveis de ambiente devem ser configuradas **apenas no Railway**
- O arquivo `ENV_VARIABLES.md` contém a documentação completa

## 🔧 Troubleshooting

### Erro: `EBUSY: resource busy or locked`

Se você encontrar este erro durante o build:
1. O `nixpacks.toml` já está configurado para usar `npm install` ao invés de `npm ci`
2. Limpe o cache do Railway: Settings → Clear Build Cache
3. Tente fazer deploy novamente

### Erro: `tsc: Permission denied`

Se você encontrar este erro:
1. Verifique se `typescript` está em `dependencies` (não `devDependencies`)
2. O build script já usa `npx tsc` para garantir execução correta

