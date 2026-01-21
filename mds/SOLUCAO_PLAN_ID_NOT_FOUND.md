# Solução: Erro "RESOURCE_NOT_FOUND" - Plan ID não encontrado no Sandbox

## 🔍 Problema

O erro `RESOURCE_NOT_FOUND` com `INVALID_RESOURCE_ID` significa que o **Plan ID** na tabela `plans` não existe no ambiente **Sandbox** do PayPal.

Isso acontece quando:
- Os Plan IDs na tabela `plans` são do ambiente **Live** (produção)
- Você está testando com `PAYPAL_MODE=sandbox`
- Os IDs não existem no ambiente Sandbox

## ✅ Solução: Criar Planos no Sandbox e Atualizar IDs

### Passo 1: Verificar Plan IDs Atuais

Execute no banco de dados:
```sql
SELECT plan_type, name, paypal_plan_id FROM plans;
```

Você verá algo como:
```
plan_type | name        | paypal_plan_id
----------|-------------|---------------------------
MONTHLY   | PRO Mensal  | P-4WK10098HA032702DNFXOEFY
YEARLY    | PRO Anual   | P-10S844563M7076315NFXOFFA
LIFETIME  | PRO Vitalício| P-3978461161385454FNFXOGAI
```

### Passo 2: Criar Planos no PayPal Sandbox

⚠️ **PROBLEMA**: O menu "Products" **não aparece** no PayPal Sandbox Dashboard!

**SOLUÇÃO**: Use a API do próprio sistema para criar planos automaticamente no PayPal:

#### Opção A: Criar via Interface Admin ⭐ (MAIS FÁCIL)

1. **Acesse**: `http://localhost:5173/admin/plans` (precisa estar logado como admin)
2. **Para cada plano (MONTHLY e YEARLY)**:
   - Clique em **"Editar"** no plano existente
   - Role até o campo **"PayPal Plan ID"**
   - Verifique se `PAYPAL_MODE=sandbox` no `.env` do backend
   - O sistema agora suporta criar no PayPal automaticamente! 
   - **Marque a opção "Criar no PayPal"** (se houver) ou edite via API (veja Opção B)
   - Salve
   - O sistema criará o plano no PayPal Sandbox automaticamente e atualizará o Plan ID

#### Opção B: Criar via API do Sistema (RECOMENDADO)

Use a API para **atualizar** os planos existentes e criar no PayPal automaticamente:

```bash
# 1. Faça login no sistema e copie o token JWT do cookie do navegador
# 2. Certifique-se que PAYPAL_MODE=sandbox no backend/.env
# 3. Execute os comandos abaixo:

# Criar plano MONTHLY no PayPal e atualizar automaticamente
curl -X PUT http://localhost:3001/api/admin/plans/MONTHLY \
  -H "Content-Type: application/json" \
  -H "Cookie: token=SEU-TOKEN-JWT-AQUI" \
  -d '{
    "createInPayPal": true
  }'

# Criar plano YEARLY no PayPal e atualizar automaticamente
curl -X PUT http://localhost:3001/api/admin/plans/YEARLY \
  -H "Content-Type: application/json" \
  -H "Cookie: token=SEU-TOKEN-JWT-AQUI" \
  -d '{
    "createInPayPal": true
  }'
```

**O sistema vai**:
- ✅ Criar o plano no PayPal Sandbox automaticamente
- ✅ Atualizar o `paypal_plan_id` na tabela `plans` automaticamente
- ✅ Mostrar o Plan ID gerado no log

#### Opção C: Atualizar Plan ID Manualmente (Se já tem o ID)

Se você já tem os Plan IDs do Sandbox (criados de outra forma):

```bash
curl -X PUT http://localhost:3001/api/admin/plans/MONTHLY \
  -H "Content-Type: application/json" \
  -H "Cookie: token=SEU-TOKEN-JWT-AQUI" \
  -d '{"paypalPlanId": "P-SANDBOX-MONTHLY-ID-AQUI"}'
```

#### Opção D: Via SQL Direto

Se preferir atualizar diretamente no banco:

```sql
UPDATE plans 
SET paypal_plan_id = 'P-SANDBOX-MONTHLY-ID-AQUI'
WHERE plan_type = 'MONTHLY';

UPDATE plans 
SET paypal_plan_id = 'P-SANDBOX-YEARLY-ID-AQUI'
WHERE plan_type = 'YEARLY';
```

**Mas você ainda precisa criar os planos no PayPal primeiro!** Use a Opção B (API) para isso.

#### Criar Plano Mensal (MONTHLY)

1. Clique em **Create Plan**
2. Configure:
   - **Product**: Crie um produto "Rachid PRO" (se não existir)
   - **Plan Name**: "PRO Mensal Sandbox"
   - **Plan Description**: "Assinatura PRO mensal"
   - **Pricing**: 
     - **Type**: Fixed
     - **Price**: `9.90` (ou o valor que você quer testar)
     - **Currency**: BRL
   - **Billing Cycle**: Monthly
   - **Setup Fee**: None (ou 0)
3. Clique em **Create Plan**
4. **Copie o Plan ID** gerado (começa com `P-...`)
   - Exemplo: `P-SANDBOX-MONTHLY-123456`

#### Criar Plano Anual (YEARLY)

1. Repita o processo acima:
   - **Plan Name**: "PRO Anual Sandbox"
   - **Price**: `89.90`
   - **Billing Cycle**: Yearly
2. **Copie o Plan ID** gerado
   - Exemplo: `P-SANDBOX-YEARLY-123456`

### Passo 3: Atualizar Plan IDs no Banco de Dados

Atualize os Plan IDs na tabela `plans` com os IDs do Sandbox:

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

**Substitua os IDs** pelos IDs reais que você copiou do PayPal Sandbox!

### Passo 4: Verificar Atualização

Confirme que os IDs foram atualizados:

```sql
SELECT plan_type, name, paypal_plan_id FROM plans;
```

### Passo 5: Testar Novamente

Agora teste criar uma assinatura novamente. O erro `RESOURCE_NOT_FOUND` não deve mais ocorrer.

## 🔧 Alternativa: Usar Interface Admin

Se você tem acesso à interface admin (`/admin/plans`):

1. Acesse `/admin/plans` no frontend
2. Edite cada plano (MONTHLY e YEARLY)
3. Atualize o campo `paypal_plan_id` com os IDs do Sandbox
4. Salve

## ⚠️ Importante

### Sandbox vs Live

- **Sandbox** (para testes):
  - Use credenciais da seção **Sandbox** no PayPal Dashboard
  - Plan IDs devem ser criados no ambiente **Sandbox**
  - `PAYPAL_MODE=sandbox`

- **Live** (produção):
  - Use credenciais da seção **Live** no PayPal Dashboard
  - Plan IDs devem ser criados no ambiente **Live**
  - `PAYPAL_MODE=live`

### Você Precisa de Planos Separados

- Planos no **Sandbox** só funcionam com credenciais **Sandbox**
- Planos no **Live** só funcionam com credenciais **Live**
- Não pode misturar!

## 🐛 Debug: Ver Qual Plan ID Está Sendo Usado

O sistema agora loga qual Plan ID está sendo usado. Verifique os logs:

```
[SubscriptionService] Creating subscription with Plan ID: P-4WK10098HA032702DNFXOEFY (Mode: sandbox)
```

Se o Plan ID não existir no Sandbox, você verá o erro `RESOURCE_NOT_FOUND`.

## 📝 Checklist

Antes de testar, verifique:

- [ ] `PAYPAL_MODE=sandbox` no `.env`
- [ ] Credenciais Sandbox configuradas (`PAYPAL_CLIENT_ID` e `PAYPAL_CLIENT_SECRET`)
- [ ] Planos criados no **PayPal Sandbox** (não Live!)
- [ ] Plan IDs atualizados na tabela `plans`
- [ ] Servidor reiniciado após atualizar o banco

## 🚀 Após Resolver

Depois de atualizar os Plan IDs:
1. Teste criar uma assinatura
2. Verifique se o erro `RESOURCE_NOT_FOUND` não ocorre mais
3. Complete o fluxo de pagamento no PayPal Sandbox
4. Verifique se a assinatura é ativada corretamente
