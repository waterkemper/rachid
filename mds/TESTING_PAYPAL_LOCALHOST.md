# Como Testar PayPal Sandbox no Localhost

## 🔧 Passo 1: Obter Credenciais de Sandbox

### 1.1 Acesse o PayPal Developer Dashboard

1. Acesse: https://developer.paypal.com
2. Faça login com sua conta PayPal (pode ser conta pessoal ou business para sandbox)

### 1.2 Criar/Selecionar App Sandbox

1. Vá em **My Apps & Credentials**
2. Se já tem um app, clique nele
3. Se não tem, clique em **Create App**:
   - **App Name**: Ex: "Rachid Local Dev"
   - **Merchant**: Selecione sua conta sandbox (ou crie uma nova)
   - Clique em **Create App**

### 1.3 Copiar Credenciais Sandbox

No app criado, você verá duas seções:

**Sandbox** (para testar):
- **Client ID**: Copie este valor (começa com `AY-...` ou `AR-...`)
- **Secret**: Clique em **Show** e copie o Client Secret

⚠️ **IMPORTANTE**: Use as credenciais da seção **Sandbox**, não da seção **Live**!

### 1.4 Configurar Variáveis de Ambiente

No seu arquivo `.env` (na raiz do projeto `backend/`), adicione:

```env
# PayPal Sandbox (para desenvolvimento local)
PAYPAL_CLIENT_ID=AYxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_CLIENT_SECRET=ELxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_MODE=sandbox

# Webhook (opcional para localhost - veja seção Webhooks abaixo)
PAYPAL_WEBHOOK_ID=WH-xxxxxxxxxxxxx
```

### 1.5 Verificar se Está em Modo Sandbox

Confirme que `PAYPAL_MODE=sandbox` está configurado. O código usa:
- `sandbox` → `https://api-m.sandbox.paypal.com`
- `live` → `https://api-m.paypal.com`

## 🔧 Passo 2: Criar Planos de Assinatura no Sandbox

### ⚠️ Problema: Menu "Products" não aparece no Sandbox

No PayPal Developer Dashboard Sandbox, o menu **Products** pode não estar visível. Use uma das opções abaixo:

### Opção A: Criar Planos via Script Automático (RECOMENDADO) ⭐

O sistema tem um script que cria planos automaticamente no PayPal Sandbox:

1. **Configure as variáveis de ambiente** no `backend/.env`:
   ```env
   PAYPAL_CLIENT_ID=seu-sandbox-client-id
   PAYPAL_CLIENT_SECRET=seu-sandbox-client-secret
   PAYPAL_MODE=sandbox
   PAYPAL_PRODUCT_ID=PROD-xxxxxxxxxxxxx  # Opcional - veja seção abaixo
   DATABASE_URL=postgresql://...
   ```

2. **Certifique-se que os planos existem na tabela `plans`**:
   ```sql
   SELECT plan_type, name, price, paypal_plan_id FROM plans;
   ```
   
   Se não existirem, crie primeiro via interface admin (`/admin/plans`) ou SQL.

3. **Execute o script**:
   ```bash
   cd backend
   npm run build  # Se ainda não compilou
   node scripts/create-paypal-sandbox-plans.js
   ```

4. **O script vai**:
   - Criar planos MONTHLY e YEARLY no PayPal Sandbox
   - Atualizar automaticamente os Plan IDs na tabela `plans`
   - Mostrar os IDs gerados

### Opção B: Criar Planos via Interface Admin

1. Acesse `/admin/plans` no frontend (precisa estar logado como admin)
2. **Para cada plano (MONTHLY e YEARLY)**:
   - Edite o plano existente
   - Marque a opção **"Criar no PayPal"** ou configure `createInPayPal: true`
   - Salve
   - O sistema criará o plano no PayPal e atualizará o Plan ID automaticamente

### Opção C: Criar Planos via API Diretamente

Use a API `/api/admin/plans` com `createInPayPal: true`:

```bash
# Exemplo usando curl (substitua o token de autenticação)
curl -X POST http://localhost:3001/api/admin/plans \
  -H "Content-Type: application/json" \
  -H "Cookie: token=seu-token-jwt" \
  -d '{
    "planType": "MONTHLY",
    "name": "PRO Mensal Sandbox",
    "price": 9.90,
    "currency": "BRL",
    "intervalUnit": "month",
    "createInPayPal": true
  }'
```

**Nota**: Como os planos já existem na tabela, você precisa **atualizar** ao invés de criar:
- Use `PUT /api/admin/plans/MONTHLY` com `paypalPlanId` ou
- Execute o script acima que atualiza automaticamente

### Opção D: Criar Product no PayPal Primeiro (Se Necessário)

Se você receber erro sobre `product_id`, você precisa criar um Product no PayPal:

1. Acesse PayPal Developer Dashboard: https://developer.paypal.com
2. No ambiente Sandbox, procure por:
   - **Catalog** → **Products** (pode estar em outra seção)
   - Ou use a API diretamente para criar um Product
3. Crie um produto "Rachid PRO"
4. Copie o **Product ID** (começa com `PROD-...`)
5. Configure no `.env`:
   ```env
   PAYPAL_PRODUCT_ID=PROD-xxxxxxxxxxxxx
   ```

### 2.2 Verificar Plan IDs Atualizados

Após criar os planos, verifique:

```sql
SELECT plan_type, name, paypal_plan_id FROM plans;
```

Você deve ver os novos Plan IDs do Sandbox (começam com `P-...`).

**IMPORTANTE**: Os Plan IDs devem ser do ambiente **Sandbox**, não Live!

## 🔧 Passo 3: Configurar Webhook para Localhost

### Opção A: Usar ngrok (Recomendado)

Para testar webhooks no localhost, você precisa de um túnel HTTPS:

1. **Instalar ngrok**: https://ngrok.com/download
2. **Iniciar túnel**:
   ```bash
   ngrok http 3001
   ```
3. **Copiar a URL HTTPS** gerada (ex: `https://abc123.ngrok.io`)
4. **Configurar webhook no PayPal**:
   - URL: `https://abc123.ngrok.io/api/subscriptions/webhook`
   - Eventos: `BILLING.SUBSCRIPTION.*`, `PAYMENT.SALE.*`, `PAYMENT.CAPTURE.*`
5. **Copiar Webhook ID** e adicionar ao `.env`

### Opção B: Testar sem Webhook (Desenvolvimento)

Para testes iniciais, você pode:
- Deixar `PAYPAL_WEBHOOK_ID` vazio ou comentado
- O sistema vai avisar mas não vai quebrar
- Webhooks só são necessários para sincronização automática

**Nota**: Sem webhook, você precisará sincronizar manualmente ou usar a URL de retorno do PayPal.

## 🔧 Passo 4: Verificar Configuração

### 4.1 Verificar Variáveis de Ambiente

No terminal, execute:
```bash
cd backend
node -e "require('dotenv').config(); console.log('PAYPAL_CLIENT_ID:', process.env.PAYPAL_CLIENT_ID ? '✅ Configurado' : '❌ Não configurado'); console.log('PAYPAL_CLIENT_SECRET:', process.env.PAYPAL_CLIENT_SECRET ? '✅ Configurado' : '❌ Não configurado'); console.log('PAYPAL_MODE:', process.env.PAYPAL_MODE || 'sandbox');"
```

### 4.2 Testar Conexão com PayPal

Crie um arquivo de teste `backend/test-paypal.js`:

```javascript
require('dotenv').config();

async function testPayPalConnection() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const mode = process.env.PAYPAL_MODE || 'sandbox';
  
  console.log('Testing PayPal Sandbox Connection...');
  console.log('Mode:', mode);
  console.log('Client ID:', clientId ? '✅ Configurado' : '❌ Não configurado');
  console.log('Client Secret:', clientSecret ? '✅ Configurado' : '❌ Não configurado');
  
  if (!clientId || !clientSecret) {
    console.error('❌ Credenciais não configuradas!');
    return;
  }
  
  const baseUrl = mode === 'live' 
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
  
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  try {
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Conexão com PayPal Sandbox bem-sucedida!');
      console.log('Token expires in:', data.expires_in, 'seconds');
    } else {
      const error = await response.text();
      console.error('❌ Erro ao conectar:', error);
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testPayPalConnection();
```

Execute:
```bash
cd backend
node test-paypal.js
```

## 🔧 Passo 5: Criar Contas de Teste Sandbox

Para testar pagamentos, você precisa de contas de teste:

1. No PayPal Developer Dashboard, vá em **Accounts** → **Sandbox**
2. Clique em **Create Account**
3. Crie dois tipos:
   - **Personal** (para simular cliente)
   - **Business** (para receber pagamentos)

**Credenciais de Teste**:
- Use esses emails/senhas criados para fazer login no sandbox.paypal.com
- Você pode usar cartões de teste para pagamento

## 🐛 Troubleshooting

### Erro: "Client Authentication failed"

**Possíveis causas**:
1. ❌ Credenciais incorretas
2. ❌ Usando credenciais do Live em vez de Sandbox
3. ❌ Variáveis de ambiente não carregadas
4. ❌ Client Secret expirado (gere um novo)

**Solução**:
1. Verifique se está usando credenciais da seção **Sandbox**
2. Copie o Client Secret novamente (clique em "Show" e copie)
3. Certifique-se que `.env` está na pasta `backend/`
4. Reinicie o servidor após alterar `.env`

### Erro: "Plan ID not found" ou "RESOURCE_NOT_FOUND"

**Causa**: O Plan ID na tabela `plans` não existe no ambiente Sandbox.

**Sintomas**:
- Erro: `RESOURCE_NOT_FOUND` com `INVALID_RESOURCE_ID`
- Mensagem: "Requested resource ID was not found"
- O Plan ID na tabela `plans` provavelmente é do ambiente **Live**, não **Sandbox**

**Solução**:
1. **Verificar Plan IDs atuais**:
   ```sql
   SELECT plan_type, name, paypal_plan_id FROM plans;
   ```

2. **Criar planos no PayPal Sandbox**:
   - Acesse: https://developer.paypal.com
   - Certifique-se de estar no ambiente **Sandbox** (não Live!)
   - Vá em **Products** → **Subscriptions** → **Create Plan**
   - Crie planos MONTHLY e YEARLY
   - **Copie os Plan IDs** gerados (começam com `P-...`)

3. **Atualizar Plan IDs no banco**:
   ```sql
   -- Atualizar Plan ID Mensal
   UPDATE plans 
   SET paypal_plan_id = 'P-SANDBOX-MONTHLY-ID-AQUI'
   WHERE plan_type = 'MONTHLY';

   -- Atualizar Plan ID Anual
   UPDATE plans 
   SET paypal_plan_id = 'P-SANDBOX-YEARLY-ID-AQUI'
   WHERE plan_type = 'YEARLY';
   ```
   
   **Substitua os IDs** pelos IDs reais copiados do PayPal Sandbox!

4. **Verificar atualização**:
   ```sql
   SELECT plan_type, paypal_plan_id FROM plans;
   ```

5. **Testar novamente** - o erro não deve mais ocorrer

**Alternativa (via Interface Admin)**:
- Acesse `/admin/plans` no frontend
- Edite cada plano e atualize o campo `paypal_plan_id`
- Salve

**Veja o guia completo**: `SOLUCAO_PLAN_ID_NOT_FOUND.md`

### Webhook não funciona no localhost

**Solução**: Use ngrok ou deixe webhook desabilitado para testes iniciais.

## 📝 Exemplo de .env para Localhost

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5437/rachid

# PayPal Sandbox
PAYPAL_CLIENT_ID=AYxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_CLIENT_SECRET=ELxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_MODE=sandbox
# PAYPAL_WEBHOOK_ID=WH-xxxxxxxxxxxxx  # Opcional para localhost

# Frontend
FRONTEND_URL=http://localhost:5173

# Outros...
JWT_SECRET=your-secret
```

## ✅ Checklist

Antes de testar, verifique:

- [ ] Credenciais Sandbox copiadas corretamente
- [ ] `PAYPAL_MODE=sandbox` no `.env`
- [ ] Plan IDs na tabela `plans` são do Sandbox
- [ ] Servidor reiniciado após alterar `.env`
- [ ] Teste de conexão com PayPal bem-sucedido
- [ ] (Opcional) ngrok configurado para webhooks

## 🚀 Próximos Passos

Depois de configurar:
1. Teste criação de assinatura
2. Teste webhook com ngrok
3. Teste pagamento com conta sandbox
4. Verifique sincronização no banco
