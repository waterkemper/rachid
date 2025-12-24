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
DB_HOST=seu-host-supabase.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua-senha-aqui
DB_DATABASE=postgres

# JWT Secret (gerar uma chave forte e aleatória)
# Use: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=sua-chave-jwt-secreta-aqui

# URL do Frontend
FRONTEND_URL=https://orachid.com.br
```

## Como Configurar no Railway

1. Acesse seu projeto no Railway
2. Vá em **Settings** → **Variables**
3. Adicione cada variável uma por uma
4. Clique em **Deploy** para aplicar as mudanças

## Como Obter os Valores

### DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
- Acesse seu projeto no Supabase
- Vá em **Settings** → **Database**
- Copie a **Connection string** ou use os valores individuais

### JWT_SECRET
Execute no terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### FRONTEND_URL
URL do seu frontend em produção: `https://orachid.com.br`

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
```

