# Como Atualizar o Preço de um Plano

## 📋 Métodos Disponíveis

Você pode atualizar o preço de um plano de duas formas:

### Método 1: Via Interface Admin ⭐ (MAIS FÁCIL)

1. **Acesse**: `http://localhost:5173/admin/plans`
2. **Faça login como admin** (se não estiver logado)
3. **Clique em "Editar"** no plano que deseja atualizar
4. **Altere o campo "Preço"**
5. **Clique em "Salvar"**

O preço será atualizado imediatamente no banco de dados!

### Método 2: Via API

#### Passo 1: Obter Token de Autenticação

1. **Faça login** no sistema: `http://localhost:5173/login`
2. **Abra o DevTools do navegador** (F12)
3. **Vá em Application/Storage → Cookies**
4. **Copie o valor do cookie `token`** (é um JWT)

#### Passo 2: Atualizar Preço via API

**Atualizar Preço do Plano MONTHLY:**
```bash
curl -X PUT http://localhost:3001/api/admin/plans/MONTHLY \
  -H "Content-Type: application/json" \
  -H "Cookie: token=SEU-TOKEN-JWT-AQUI" \
  -d '{
    "price": 19.90
  }'
```

**Atualizar Preço do Plano YEARLY:**
```bash
curl -X PUT http://localhost:3001/api/admin/plans/YEARLY \
  -H "Content-Type: application/json" \
  -H "Cookie: token=SEU-TOKEN-JWT-AQUI" \
  -d '{
    "price": 199.00
  }'
```

**Atualizar Preço do Plano LIFETIME:**
```bash
curl -X PUT http://localhost:3001/api/admin/plans/LIFETIME \
  -H "Content-Type: application/json" \
  -H "Cookie: token=SEU-TOKEN-JWT-AQUI" \
  -d '{
    "price": 149.00
  }'
```

## ⚠️ IMPORTANTE: Preço Local vs Preço no PayPal

### Preço Local (Banco de Dados)

- ✅ **Atualiza imediatamente** no banco de dados
- ✅ **Usado para exibição** na página de preços (`/precos`)
- ✅ **Não afeta assinaturas existentes**
- ✅ **Novas assinaturas** verão o novo preço na interface

### Preço no PayPal (Valor Real Cobrado)

⚠️ **O PayPal não permite alterar o preço de um plano existente!**

Se você mudar o preço e quiser que **novas assinaturas sejam cobradas com o novo valor**, você precisa:

1. **Criar um novo plano no PayPal** com o novo preço
2. **Atualizar o `paypal_plan_id`** na tabela `plans`

#### Opção A: Criar Novo Plano no PayPal Automaticamente

O sistema pode criar um novo plano no PayPal automaticamente:

```bash
curl -X PUT http://localhost:3001/api/admin/plans/MONTHLY \
  -H "Content-Type: application/json" \
  -H "Cookie: token=SEU-TOKEN-JWT-AQUI" \
  -d '{
    "price": 19.90,
    "createInPayPal": true
  }'
```

**O sistema vai**:
- ✅ Criar um novo plano no PayPal com o novo preço
- ✅ Atualizar o `paypal_plan_id` automaticamente
- ✅ Manter o preço local atualizado

#### Opção B: Criar Manualmente e Atualizar ID

1. **Crie um novo plano no PayPal** (via API ou Dashboard)
2. **Copie o novo Plan ID** (começa com `P-...`)
3. **Atualize via API**:
   ```bash
   curl -X PUT http://localhost:3001/api/admin/plans/MONTHLY \
     -H "Content-Type: application/json" \
     -H "Cookie: token=SEU-TOKEN-JWT-AQUI" \
     -d '{
       "price": 19.90,
       "paypalPlanId": "P-NOVO-PLAN-ID-AQUI"
     }'
   ```

## 📊 Resumo: Quando Atualizar o Quê?

| Situação | O Que Fazer |
|----------|-------------|
| **Apenas mudar preço exibido** | Atualize apenas `price` via interface/API |
| **Mudar preço e criar novo plano PayPal** | Atualize `price` + `createInPayPal: true` |
| **Mudar preço e usar plano PayPal existente** | Atualize `price` + `paypalPlanId` |

## 🔄 Fluxo Completo: Atualizar Preço e Criar Novo Plano PayPal

### Via Interface Admin

1. Acesse `/admin/plans`
2. Clique em **"Editar"** no plano
3. Altere o **preço**
4. Marque **"Criar no PayPal"** (se disponível)
5. Clique em **"Salvar"**

### Via API

```bash
curl -X PUT http://localhost:3001/api/admin/plans/MONTHLY \
  -H "Content-Type: application/json" \
  -H "Cookie: token=SEU-TOKEN-JWT-AQUI" \
  -d '{
    "price": 19.90,
    "trialDays": 7,
    "createInPayPal": true
  }'
```

## 📝 Exemplos Práticos

### Exemplo 1: Apenas Atualizar Preço Local

**Cenário**: Você quer mudar o preço exibido de R$ 9,90 para R$ 19,90, mas não quer criar novo plano PayPal ainda.

**Solução**:
```bash
curl -X PUT http://localhost:3001/api/admin/plans/MONTHLY \
  -H "Content-Type: application/json" \
  -H "Cookie: token=SEU-TOKEN-JWT-AQUI" \
  -d '{"price": 19.90}'
```

### Exemplo 2: Atualizar Preço e Criar Novo Plano PayPal

**Cenário**: Você quer mudar o preço e criar um novo plano no PayPal para que novas assinaturas sejam cobradas com o novo valor.

**Solução**:
```bash
curl -X PUT http://localhost:3001/api/admin/plans/MONTHLY \
  -H "Content-Type: application/json" \
  -H "Cookie: token=SEU-TOKEN-JWT-AQUI" \
  -d '{
    "price": 19.90,
    "trialDays": 7,
    "createInPayPal": true
  }'
```

### Exemplo 3: Atualizar Múltiplos Campos

**Cenário**: Você quer atualizar preço, descrição e trial ao mesmo tempo.

**Solução**:
```bash
curl -X PUT http://localhost:3001/api/admin/plans/MONTHLY \
  -H "Content-Type: application/json" \
  -H "Cookie: token=SEU-TOKEN-JWT-AQUI" \
  -d '{
    "price": 19.90,
    "description": "Novo plano PRO mensal com todos os recursos",
    "trialDays": 7,
    "createInPayPal": true
  }'
```

## ✅ Checklist

Antes de atualizar:
- [ ] Token JWT de admin obtido (fazer login)
- [ ] Backend rodando e acessível
- [ ] Decidir se precisa criar novo plano no PayPal

Após atualizar:
- [ ] Verificar preço atualizado na interface `/precos`
- [ ] (Se criou novo plano PayPal) Verificar Plan ID atualizado
- [ ] Testar criação de nova assinatura

## 🎯 Recomendação

**Use a Interface Admin** (`/admin/plans`) - é mais fácil e visual!

Para mudanças simples de preço, apenas edite via interface. Se precisar criar novo plano no PayPal, use a API com `createInPayPal: true`.
