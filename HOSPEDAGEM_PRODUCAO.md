# Guia de Hospedagem em Produção - orachid.com.br

## Visão Geral

Este guia cobre a hospedagem completa do projeto **Rachid** usando o domínio **orachid.com.br**:
- **Frontend**: Site web (React + Vite)
- **Backend**: API Node.js/Express
- **Banco de Dados**: PostgreSQL
- **Mobile**: Usa a mesma API do backend

## Estrutura de URLs Recomendada

Com o domínio `orachid.com.br`, recomendo:

- **Frontend**: `https://orachid.com.br` (ou `https://www.orachid.com.br`)
- **Backend/API**: `https://api.orachid.com.br` (subdomínio)
- **Alternativa**: `https://orachid.com.br/api` (mesmo domínio, path diferente)

**Recomendação**: Usar subdomínio `api.orachid.com.br` (mais organizado e fácil de configurar)

## Opção 1: Vercel (Frontend) + Railway (Backend + Banco) ⭐ RECOMENDADO

### Por que esta opção?

- ✅ **Mais fácil de configurar**
- ✅ **Custo baixo** (~$5-7/mês)
- ✅ **SSL automático** (HTTPS)
- ✅ **Deploy automático** via GitHub
- ✅ **Suporte a domínio customizado**
- ✅ **CDN global** para frontend (Vercel)
- ✅ **Escalável** e confiável

### Custos

- **Vercel (Frontend)**: Gratuito (plano Hobby) ou $20/mês (Pro)
- **Railway (Backend)**: $5/mês ou pay-as-you-go (~$2-3/mês)
- **Supabase (Banco)**: Gratuito (até 500MB) ou $25/mês (Pro)
- **Total**: ~$5-7/mês (iniciando) ou ~$50/mês (com plano Pro)

### Configuração Passo a Passo

#### 1. Configurar Banco de Dados (Supabase)

**Ações:**
1. Criar conta em [supabase.com](https://supabase.com)
2. Criar novo projeto:
   - Nome: "Rachid Production"
   - Região: Escolher mais próxima (ex: South America)
   - Senha: Criar senha forte
3. Aguardar criação (2-3 minutos)
4. Copiar connection string:
   - Ir em Settings → Database
   - Copiar "Connection string" (URI format)
   - Formato: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

**Variáveis a guardar:**
```
DB_HOST=[host-do-supabase]
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=[sua-senha]
DB_DATABASE=postgres
```

#### 2. Configurar Backend no Railway

**Ações:**
1. Criar conta em [railway.app](https://railway.app) (pode usar GitHub)
2. Criar novo projeto: "Rachid Backend"
3. Adicionar serviço:
   - Clicar em "New" → "GitHub Repo"
   - Selecionar repositório do projeto
   - Selecionar pasta `backend/`
4. Configurar variáveis de ambiente:
   ```
   NODE_ENV=production
   PORT=3001
   
   DB_HOST=[host-do-supabase]
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=[senha-do-supabase]
   DB_DATABASE=postgres
   
   JWT_SECRET=[gerar-chave-secreta-forte]
   FRONTEND_URL=https://orachid.com.br
   ```
5. Configurar domínio customizado:
   - Ir em Settings → Networking
   - Clicar em "Generate Domain" (gera domínio temporário)
   - Depois adicionar domínio customizado: `api.orachid.com.br`
   - Configurar DNS (ver seção DNS abaixo)
6. Railway fará deploy automático

**Arquivos a criar/modificar:**
- `backend/.env.example` - Template de variáveis
- `backend/railway.json` (opcional) - Configuração Railway

#### 3. Configurar Frontend no Vercel

**Ações:**
1. Criar conta em [vercel.com](https://vercel.com) (pode usar GitHub)
2. Adicionar novo projeto:
   - Importar repositório GitHub
   - Selecionar pasta `frontend/`
   - Framework Preset: Vite
3. Configurar build:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Configurar variáveis de ambiente:
   ```
   VITE_API_URL=https://api.orachid.com.br
   ```
5. Configurar domínio customizado:
   - Ir em Settings → Domains
   - Adicionar: `orachid.com.br` e `www.orachid.com.br`
   - Configurar DNS (ver seção DNS abaixo)
6. Vercel fará deploy automático

**Arquivos a criar/modificar:**
- `frontend/.env.production` - Variáveis de produção (opcional)
- Atualizar `frontend/src/services/api.ts` para usar variável de ambiente

#### 4. Configurar DNS

**No seu provedor de domínio (onde comprou orachid.com.br):**

**Registros DNS a adicionar:**

```
Tipo    Nome    Valor                          TTL
A       @       [IP do Vercel]                 3600
CNAME   www     cname.vercel-dns.com.           3600
CNAME   api     [domínio-railway].railway.app.  3600
```

**Como obter os valores:**

1. **Vercel (Frontend)**:
   - Após adicionar domínio no Vercel, ele mostrará os registros DNS
   - Geralmente: A record apontando para IP do Vercel
   - Ou CNAME para `cname.vercel-dns.com`

2. **Railway (Backend)**:
   - Após adicionar domínio customizado, Railway mostrará o CNAME
   - Formato: `[algo].railway.app`

**Tempo de propagação**: 1-24 horas (geralmente 1-2 horas)

#### 5. Atualizar Código para Produção

**Backend - Atualizar CORS:**

```typescript
// backend/src/server.ts
app.use(cors({
  origin: [
    'https://orachid.com.br',
    'https://www.orachid.com.br',
    'https://api.orachid.com.br',
    process.env.FRONTEND_URL || 'https://orachid.com.br',
  ],
  credentials: true,
}));
```

**Frontend - Atualizar API URL:**

```typescript
// frontend/src/services/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.orachid.com.br/api',
  withCredentials: true,
});
```

**Mobile - Atualizar app.json:**

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.orachid.com.br/api"
    }
  }
}
```

### Arquivos a Criar/Modificar

**Novos arquivos:**
- `backend/.env.example` - Template de variáveis
- `frontend/.env.production` - Variáveis de produção (opcional)
- `backend/railway.json` (opcional) - Config Railway

**Arquivos a modificar:**
- `backend/src/server.ts` - CORS para produção
- `backend/src/database/data-source.ts` - Desabilitar synchronize
- `frontend/src/services/api.ts` - Usar variável de ambiente
- `frontend/vite.config.ts` - Configurar build para produção
- `mobile/app.json` - URL da API

---

## Opção 2: Render (Tudo Junto)

### Por que esta opção?

- ✅ **Tudo em um lugar** (frontend + backend + banco)
- ✅ **Mais simples** de gerenciar
- ✅ **Custo similar** (~$7-14/mês)
- ⚠️ **Menos flexível** que opção 1

### Custos

- **Render (Backend)**: $7/mês (Starter)
- **Render (Frontend)**: Gratuito ou $7/mês
- **Render (PostgreSQL)**: $7/mês
- **Total**: ~$14-21/mês

### Configuração

1. Criar conta em [render.com](https://render.com)
2. Criar 3 serviços:
   - **Web Service** (Backend)
   - **Static Site** (Frontend)
   - **PostgreSQL** (Banco)
3. Configurar domínios customizados
4. Configurar DNS

**Vantagem**: Tudo em um dashboard
**Desvantagem**: Mais caro e menos flexível

---

## Opção 3: DigitalOcean App Platform

### Por que esta opção?

- ✅ **Bom custo-benefício**
- ✅ **Escalável**
- ✅ **Suporte a domínios**
- ⚠️ **Mais configuração** necessária

### Custos

- **App Platform**: $5-12/mês
- **Managed PostgreSQL**: $15/mês
- **Total**: ~$20-27/mês

---

## Opção 4: AWS (Avançado)

### Por que esta opção?

- ✅ **Muito escalável**
- ✅ **Muitas opções**
- ⚠️ **Mais complexo**
- ⚠️ **Pode ser mais caro**

### Custos

- **EC2/Elastic Beanstalk**: $10-50/mês
- **RDS PostgreSQL**: $15-50/mês
- **S3 + CloudFront**: $1-5/mês
- **Total**: ~$26-105/mês

**Recomendado apenas se**: Precisa de alta escala ou já tem experiência com AWS

---

## Recomendação Final: Opção 1 (Vercel + Railway + Supabase)

### Por quê?

1. **Mais fácil**: Setup em 1-2 horas
2. **Mais barato**: ~$5-7/mês para começar
3. **Melhor performance**: CDN global (Vercel)
4. **Deploy automático**: Via GitHub
5. **SSL automático**: HTTPS sem configuração
6. **Escalável**: Fácil de crescer depois

### Checklist de Implementação

#### Fase 1: Setup Inicial (1-2 horas)
- [ ] Criar conta Supabase e banco PostgreSQL
- [ ] Criar conta Railway e deploy backend
- [ ] Criar conta Vercel e deploy frontend
- [ ] Configurar variáveis de ambiente

#### Fase 2: Configuração de Domínio (30 minutos)
- [ ] Adicionar domínio no Vercel (orachid.com.br)
- [ ] Adicionar subdomínio no Railway (api.orachid.com.br)
- [ ] Configurar registros DNS no provedor
- [ ] Aguardar propagação DNS (1-24 horas)

#### Fase 3: Atualizar Código (1 hora)
- [ ] Atualizar CORS no backend
- [ ] Atualizar URL da API no frontend
- [ ] Atualizar URL da API no mobile
- [ ] Criar migrations do banco
- [ ] Desabilitar synchronize

#### Fase 4: Testes (1 hora)
- [ ] Testar frontend (orachid.com.br)
- [ ] Testar API (api.orachid.com.br/api)
- [ ] Testar autenticação
- [ ] Testar endpoints principais
- [ ] Testar app mobile com API de produção

#### Fase 5: Go Live
- [ ] Verificar SSL/HTTPS funcionando
- [ ] Testar em dispositivos móveis
- [ ] Monitorar logs
- [ ] Configurar alertas (opcional)

---

## Configuração Detalhada: Opção 1

### 1. Supabase (Banco de Dados)

**Passos:**
1. Acessar [supabase.com](https://supabase.com)
2. Criar conta (usar GitHub)
3. New Project → "Rachid Production"
4. Escolher região (South America - São Paulo se disponível)
5. Definir senha forte
6. Aguardar criação (2-3 min)

**Após criação:**
1. Settings → Database
2. Copiar "Connection string" (URI)
3. Guardar credenciais

**Connection String exemplo:**
```
postgresql://postgres.xxxxx:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

### 2. Railway (Backend)

**Passos:**
1. Acessar [railway.app](https://railway.app)
2. Login com GitHub
3. New Project → "Rachid"
4. Deploy from GitHub repo
5. Selecionar repositório
6. Root Directory: `backend`
7. Railway detecta Node.js automaticamente

**Configurar Build:**
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

**Variáveis de Ambiente:**
```
NODE_ENV=production
PORT=3001

DB_HOST=[do-supabase]
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=[do-supabase]
DB_DATABASE=postgres

JWT_SECRET=[gerar-uma-chave-forte-aleatoria]
FRONTEND_URL=https://orachid.com.br
```

**Gerar JWT_SECRET:**

Você precisa de uma chave secreta forte e aleatória para assinar os tokens JWT. Aqui estão algumas formas de gerar:

**Opção 1: Usando Node.js (Recomendado)**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Opção 2: Usando PowerShell (Windows)**
```powershell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Opção 3: Usando OpenSSL (se instalado)**
```bash
openssl rand -hex 64
```

**Opção 4: Online (use apenas se confiar no site)**
- Acesse: https://generate-secret.vercel.app/64
- Ou: https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx

**⚠️ Importante:**
- Use uma chave de **pelo menos 32 caracteres** (recomendado: 64+)
- **Nunca compartilhe** essa chave publicamente
- **Guarde em local seguro** (variável de ambiente)
- Use chaves **diferentes** para desenvolvimento e produção

**Domínio Customizado:**
1. Settings → Networking
2. Generate Domain (temporário)
3. Add Custom Domain → `api.orachid.com.br`
4. Copiar CNAME para DNS

### 3. Vercel (Frontend)

**Passos:**
1. Acessar [vercel.com](https://vercel.com)
2. Login com GitHub
3. Add New Project
4. Import Git Repository
5. Selecionar repositório
6. Root Directory: `frontend`
7. Framework Preset: Vite (detecta automaticamente)

**Build Settings:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**Variáveis de Ambiente:**
```
VITE_API_URL=https://api.orachid.com.br
```

**Domínio Customizado:**
1. Settings → Domains
2. Add Domain → `orachid.com.br`
3. Add Domain → `www.orachid.com.br`
4. Copiar registros DNS

### 4. Configurar DNS

**No seu provedor de domínio (Registro.br, GoDaddy, etc.):**

**Registros a adicionar:**

```
Tipo    Nome    Valor                                    TTL
A       @       76.76.21.21 (IP do Vercel - verificar)  3600
CNAME   www     cname.vercel-dns.com.                    3600
CNAME   api     [algo].railway.app.                      3600
```

**Nota**: Os valores exatos serão fornecidos pelo Vercel e Railway após adicionar os domínios.

**Tempo de propagação**: 1-24 horas (geralmente 1-2 horas)

---

## Atualizações Necessárias no Código

### Backend

**1. Atualizar CORS (`backend/src/server.ts`):**

```typescript
app.use(cors({
  origin: [
    'https://orachid.com.br',
    'https://www.orachid.com.br',
    process.env.FRONTEND_URL || 'https://orachid.com.br',
  ],
  credentials: true,
}));
```

**2. Desabilitar synchronize (`backend/src/database/data-source.ts`):**

```typescript
export const AppDataSource = new DataSource({
  // ... outras configs
  synchronize: process.env.NODE_ENV !== 'production', // false em produção
  // ... resto
});
```

**3. Criar migrations (importante!):**

```bash
cd backend
npm install typeorm -g
typeorm migration:generate -n InitialSchema
```

### Frontend

**1. Atualizar API URL (`frontend/src/services/api.ts`):**

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://api.orachid.com.br';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});
```

**2. Criar `.env.production` (opcional):**

```env
VITE_API_URL=https://api.orachid.com.br
```

### Mobile

**1. Atualizar `mobile/app.json`:**

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.orachid.com.br/api"
    }
  }
}
```

---

## Custos Finais Estimados

### Opção 1 (Recomendada)
- **Vercel**: Gratuito (Hobby) ou $20/mês (Pro)
- **Railway**: $5/mês ou pay-as-you-go
- **Supabase**: Gratuito (até 500MB) ou $25/mês (Pro)
- **Total Mínimo**: ~$5-7/mês
- **Total Recomendado**: ~$30-50/mês (com planos Pro)

### Quando fazer upgrade?

**Vercel Pro ($20/mês):**
- Se precisar de mais bandwidth
- Se precisar de mais builds
- Se precisar de analytics avançado

**Supabase Pro ($25/mês):**
- Se banco passar de 500MB
- Se precisar de mais performance
- Se precisar de backups automáticos

---

## Monitoramento e Manutenção

### Logs

- **Vercel**: Dashboard → Logs
- **Railway**: Dashboard → Deployments → Logs
- **Supabase**: Dashboard → Logs

### Alertas

Configurar alertas para:
- Erros no backend
- Banco de dados cheio
- Deploy falhado

### Backups

- **Supabase**: Backups automáticos (diários no plano Pro)
- **Manual**: Exportar SQL periodicamente

---

## Próximos Passos

1. Escolher opção de hospedagem
2. Configurar contas
3. Fazer deploy
4. Configurar domínio
5. Testar tudo
6. Go live! 🚀

---

## Suporte e Documentação

- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Railway**: [docs.railway.app](https://docs.railway.app)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)

---

## Checklist Completo

### Setup Infraestrutura
- [ ] Conta Supabase criada
- [ ] Banco PostgreSQL criado
- [ ] Conta Railway criada
- [ ] Backend deployado no Railway
- [ ] Conta Vercel criada
- [ ] Frontend deployado no Vercel
- [ ] Variáveis de ambiente configuradas

### Configuração de Domínio
- [ ] Domínio adicionado no Vercel
- [ ] Subdomínio adicionado no Railway
- [ ] DNS configurado no provedor
- [ ] SSL/HTTPS funcionando
- [ ] Testado acesso via domínio

### Atualizações de Código
- [ ] CORS atualizado no backend
- [ ] Synchronize desabilitado
- [ ] Migrations criadas
- [ ] API URL atualizada no frontend
- [ ] API URL atualizada no mobile

### Testes
- [ ] Frontend acessível (orachid.com.br)
- [ ] API funcionando (api.orachid.com.br)
- [ ] Autenticação testada
- [ ] Endpoints principais testados
- [ ] App mobile testado com API de produção

### Go Live
- [ ] Tudo testado e funcionando
- [ ] Monitoramento configurado
- [ ] Backups configurados
- [ ] Documentação atualizada

