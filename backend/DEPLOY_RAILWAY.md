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

DB_HOST=[host-do-supabase]
DB_PORT=5432
DB_USERNAME=postgres
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

## 📝 Checklist

- [ ] Variáveis de ambiente configuradas no Railway
- [ ] Domínio `api.orachid.com.br` adicionado no Railway
- [ ] DNS configurado no provedor de domínio
- [ ] Deploy realizado com sucesso
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

