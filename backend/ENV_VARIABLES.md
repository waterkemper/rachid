# Variáveis de Ambiente - Backend

Este arquivo documenta todas as variáveis de ambiente necessárias para o backend em produção.

## ⚠️ IMPORTANTE

**NUNCA commite arquivos `.env` no GitHub!** As variáveis de ambiente devem ser configuradas diretamente no Railway (ou outro serviço de hospedagem).

## Variáveis Necessárias

Configure estas variáveis no Railway (Settings → Variables):

```env
# Configuração do Ambiente
NODE_ENV=production
PORT=3001

# Banco de Dados PostgreSQL (Supabase)
# IMPORTANTE: Para Railway e outras plataformas IPv4-only, use Session Pooler (porta 6543)
# Connection Pooler: Settings → Database → Connection Pooling → Session mode
DB_HOST=db.xxxxxxxxxxxxx.supabase.co  # Host do Session Pooler (não o direto!)
DB_PORT=6543  # Porta do Session Pooler (não 5432!)
DB_USERNAME=postgres
DB_PASSWORD=sua-senha-aqui
DB_DATABASE=postgres

# JWT Secret (gerar uma chave forte e aleatória)
# Use: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=sua-chave-jwt-secreta-aqui

# URL do Frontend
FRONTEND_URL=https://orachid.com.br

# SendGrid (E-mails Transacionais)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@orachid.com.br
SENDGRID_FROM_NAME=Rachid

# pg-boss (Fila de Emails)
# Não precisa de variáveis adicionais - usa as mesmas do banco de dados
# IMPORTANTE: Execute 'npm run setup-pgboss' uma vez após o primeiro deploy
```

## Como Configurar no Railway

1. Acesse seu projeto no Railway
2. Vá em **Settings** → **Variables**
3. Adicione cada variável uma por uma
4. Clique em **Deploy** para aplicar as mudanças

## Como Obter os Valores

### DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE

**⚠️ IMPORTANTE: Para Railway e outras plataformas IPv4-only, você DEVE usar o Session Pooler!**

1. Acesse seu projeto no Supabase
2. Vá em **Settings** → **Database**
3. Role até **Connection Pooling**
4. Selecione **Session mode**
5. Copie a **Connection string** do Session Pooler
   - Formato: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
   - **Porta: 6543** (não 5432!)
   - **Host: aws-0-[REGION].pooler.supabase.com** (tem "pooler" no nome)

**Alternativa - Valores Individuais:**
- **DB_HOST**: Host do Session Pooler (ex: `aws-0-sa-east-1.pooler.supabase.com`)
- **DB_PORT**: `6543` (Session Pooler) ou `5432` (se tiver IPv4 add-on)
- **DB_USERNAME**: `postgres.[PROJECT-REF]` (com o project ref!) ou apenas `postgres`
- **DB_PASSWORD**: A mesma senha do banco
- **DB_DATABASE**: `postgres`

### JWT_SECRET
Execute no terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### FRONTEND_URL
URL do seu frontend em produção: `https://orachid.com.br`

### SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME

**Configuração do SendGrid:**
1. Acesse [SendGrid](https://sendgrid.com) e crie uma conta (plano gratuito disponível)
2. Vá em **Settings** → **API Keys**
3. Crie uma nova API Key com permissões de "Mail Send"
4. Copie a chave e configure como `SENDGRID_API_KEY`
5. Vá em **Settings** → **Sender Authentication**
6. Verifique um domínio ou e-mail único (Single Sender Verification)
7. Use o e-mail verificado como `SENDGRID_FROM_EMAIL`
8. `SENDGRID_FROM_NAME` é opcional (padrão: "Rachid")

**Nota:** Em desenvolvimento, se `SENDGRID_API_KEY` não estiver configurado, os e-mails serão apenas logados no console.

## Desenvolvimento Local

Para desenvolvimento local, crie um arquivo `.env` na pasta `backend/` (não commite este arquivo):

```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=racha_contas
JWT_SECRET=chave-secreta-para-desenvolvimento
FRONTEND_URL=http://localhost:5173

# SendGrid (Opcional em desenvolvimento - se não configurado, e-mails são apenas logados)
# SENDGRID_API_KEY=sua-api-key-aqui
# SENDGRID_FROM_EMAIL=noreply@seu-dominio.com
# SENDGRID_FROM_NAME=Rachid
```

