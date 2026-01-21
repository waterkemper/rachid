# Como Criar Planos PayPal Sandbox (Menu "Products" Não Disponível)

## ⚠️ Problema

O menu **"Products"** não aparece no PayPal Developer Dashboard no ambiente Sandbox.

## ✅ Solução: Usar a API do Sistema

O sistema tem funcionalidade para criar planos no PayPal automaticamente via API!

### Método 1: Via Interface Admin (Mais Fácil)

1. **Acesse**: `http://localhost:5173/admin/plans`
2. **Faça login como admin** (se não estiver logado)
3. **Para cada plano MONTHLY e YEARLY**:
   - Clique em **"Editar"**
   - O sistema suporta criar planos no PayPal automaticamente!
   - Use o botão ou opção disponível na interface

### Método 2: Via API com createInPayPal ⭐ (RECOMENDADO)

Use a API para atualizar planos existentes e criar no PayPal automaticamente:

#### Passo 1: Obter Token de Autenticação

1. **Faça login** no sistema: `http://localhost:5173/login`
2. **Abra o DevTools do navegador** (F12)
3. **Vá em Application/Storage → Cookies**
4. **Copie o valor do cookie `token`** (é um JWT)

#### Passo 2: Certificar-se que está em Sandbox

Verifique no `backend/.env`:
```env
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=seu-sandbox-client-id
PAYPAL_CLIENT_SECRET=seu-sandbox-client-secret
```

#### Passo 3: Criar Planos via API

**Criar Plano MONTHLY no PayPal:**
```bash
curl -X PUT http://localhost:3001/api/admin/plans/MONTHLY \
  -H "Content-Type: application/json" \
  -H "Cookie: token=SEU-TOKEN-JWT-AQUI" \
  -d '{
    "createInPayPal": true
  }'
```

**Criar Plano YEARLY no PayPal:**
```bash
curl -X PUT http://localhost:3001/api/admin/plans/YEARLY \
  -H "Content-Type: application/json" \
  -H "Cookie: token=SEU-TOKEN-JWT-AQUI" \
  -d '{
    "createInPayPal": true
  }'
```

**O sistema vai**:
- ✅ Criar o plano no PayPal Sandbox automaticamente
- ✅ Copiar o Plan ID gerado (começa com `P-...`)
- ✅ Atualizar a tabela `plans` automaticamente
- ✅ Logar o Plan ID criado no console

#### Verificar Resultado

Depois de executar, verifique os logs do backend ou execute:
```sql
SELECT plan_type, name, paypal_plan_id FROM plans;
```

Você deve ver os novos Plan IDs do Sandbox!

### Método 3: Usar Postman ou Insomnia

1. **Configure**:
   - URL: `PUT http://localhost:3001/api/admin/plans/MONTHLY`
   - Headers:
     - `Content-Type: application/json`
     - `Cookie: token=SEU-TOKEN-JWT`
   - Body (JSON):
     ```json
     {
       "createInPayPal": true
     }
     ```

2. **Execute** para cada plano (MONTHLY e YEARLY)

### Método 4: Criar Product Primeiro (SE NECESSÁRIO)

⚠️ **IMPORTANTE**: O sistema **cria o Product automaticamente** se não existir! Você não precisa criar manualmente.

Se ainda assim receber erro sobre `product_id`:

1. **O sistema criará automaticamente** - apenas execute o comando de criar plano normalmente
2. **Verifique o log** do backend para ver o Product ID criado
3. **(Opcional) Configure no `.env`** para reutilizar:
   ```env
   PAYPAL_PRODUCT_ID=PROD-1234567890ABCDEF
   ```

**Veja o guia completo**: `SOLUCAO_PRODUCT_ID_NOT_FOUND.md`

### Método 5: Atualizar Manualmente (Se já tem os IDs)

Se você já conseguiu criar os planos no PayPal de outra forma:

1. **Copie os Plan IDs** do PayPal (começam com `P-...`)
2. **Atualize via API**:
   ```bash
   curl -X PUT http://localhost:3001/api/admin/plans/MONTHLY \
     -H "Content-Type: application/json" \
     -H "Cookie: token=SEU-TOKEN-JWT" \
     -d '{"paypalPlanId": "P-SANDBOX-MONTHLY-ID-AQUI"}'
   ```

3. **Ou atualize via SQL**:
   ```sql
   UPDATE plans SET paypal_plan_id = 'P-SANDBOX-MONTHLY-ID' WHERE plan_type = 'MONTHLY';
   ```

## 🎯 Método Recomendado

**Use o Método 2 (API com createInPayPal)** - é o mais automático e confiável!

## ✅ Checklist

Antes de criar planos:
- [ ] `PAYPAL_MODE=sandbox` configurado no `.env`
- [ ] Credenciais Sandbox configuradas
- [ ] Planos MONTHLY e YEARLY existem na tabela `plans`
- [ ] Token JWT de admin obtido (fazer login)
- [ ] Backend rodando e acessível

Após criar planos:
- [ ] Verificar Plan IDs atualizados na tabela `plans`
- [ ] Testar criação de assinatura
- [ ] Verificar se erro `RESOURCE_NOT_FOUND` não ocorre mais
