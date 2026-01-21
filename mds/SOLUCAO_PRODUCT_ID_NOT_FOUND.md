# Solução: Erro "Invalid product id" - Product ID não encontrado no PayPal

## 🔍 Problema

O erro `RESOURCE_NOT_FOUND` com `INVALID_RESOURCE_ID` e `"Invalid product id"` significa que o **Product ID** usado para criar o plano não existe no PayPal.

Isso acontece quando:
- `PAYPAL_PRODUCT_ID` não está configurado no `.env`
- `PAYPAL_PRODUCT_ID` está configurado com um valor inválido (ex: `PROD_DEFAULT`)
- O Product ID não existe no ambiente PayPal (Sandbox ou Live)

## ✅ Solução Automática (IMPLEMENTADA)

O sistema **cria o Product automaticamente** se ele não existir! 🎉

### Como Funciona

1. **O sistema verifica** se `PAYPAL_PRODUCT_ID` está configurado e válido
2. **Se não existir ou for inválido**, o sistema cria um novo Product automaticamente
3. **O Product ID criado** é usado para criar o plano
4. **Você verá no log** o Product ID criado

### Exemplo de Log

```
[PayPalService] Product PROD_DEFAULT not found, creating new one...
[PayPalService] Creating new product: PRO Mensal
[PayPalService] ✅ Product created: PROD-1234567890ABCDEF
[PayPalService] 💡 Add to .env: PAYPAL_PRODUCT_ID=PROD-1234567890ABCDEF
```

### O Que Fazer

1. **Deixe o sistema criar automaticamente** (recomendado)
2. **Ou configure manualmente**:

#### Opção 1: Deixar Criar Automaticamente (Mais Fácil)

Apenas execute o comando para criar o plano:
```bash
curl -X PUT http://localhost:3001/api/admin/plans/MONTHLY \
  -H "Content-Type: application/json" \
  -H "Cookie: token=SEU-TOKEN-JWT-AQUI" \
  -d '{
    "createInPayPal": true
  }'
```

O sistema vai criar o Product automaticamente!

#### Opção 2: Criar Product Manualmente e Configurar

1. **Crie o Product via API do PayPal**:
   ```bash
   # Obtenha o access token primeiro
   curl -X POST https://api-m.sandbox.paypal.com/v1/oauth2/token \
     -u "CLIENT_ID:CLIENT_SECRET" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials"

   # Crie o Product
   curl -X POST https://api-m.sandbox.paypal.com/v1/catalogs/products \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ACCESS_TOKEN" \
     -d '{
       "name": "Rachid PRO",
       "description": "Assinatura PRO",
       "type": "SERVICE",
       "category": "SOFTWARE"
     }'
   ```

2. **Copie o Product ID** retornado (começa com `PROD-...`)

3. **Configure no `.env`**:
   ```env
   PAYPAL_PRODUCT_ID=PROD-1234567890ABCDEF
   ```

#### Opção 3: Usar Interface Admin

Se o Product foi criado automaticamente, você pode:
1. Ver o Product ID no log do backend
2. Copiar o ID
3. Adicionar ao `.env` para reutilizar

## 🎯 Recomendação

**Deixe o sistema criar automaticamente!** É mais fácil e não precisa configurar nada manualmente.

## ⚠️ Importante

### Sandbox vs Live

- **Sandbox**: O Product criado automaticamente será no ambiente Sandbox
- **Live**: Em produção, configure `PAYPAL_PRODUCT_ID` no `.env` com um Product ID do Live

### Reutilização

- Se você configurar `PAYPAL_PRODUCT_ID` no `.env`, o sistema **reutilizará** esse Product
- Se não configurar, o sistema **criará um novo** Product a cada vez (não é ideal para produção)

## 📝 Checklist

Antes de criar planos:
- [ ] `PAYPAL_MODE=sandbox` configurado (para testes)
- [ ] Credenciais Sandbox configuradas
- [ ] (Opcional) `PAYPAL_PRODUCT_ID` configurado no `.env`

Após criar planos:
- [ ] Verificar se Product foi criado (log do backend)
- [ ] (Opcional) Copiar Product ID e adicionar ao `.env` para reutilizar

## 🚀 Após Resolver

Depois de resolver:
1. O sistema criará o Product automaticamente
2. O plano será criado com sucesso
3. O erro `INVALID_RESOURCE_ID` não deve mais ocorrer
