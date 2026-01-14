# Guia de Operação do PayPal - Sistema de Assinaturas

## 📋 Como Funciona o Sistema Atual

### Estrutura de Dados no Banco

1. **Tabela `plan_limits`** (✅ Editável via Admin)
   - **Onde**: `/admin/feature-limits`
   - **O que armazena**: Limites e features por plano (FREE, PRO, LIFETIME)
   - **Exemplo**: 
     - FREE: max_events = 5, max_participants_per_event = 20
     - PRO: max_events = NULL (ilimitado)
   - **Editável**: ✅ Sim, via interface admin

2. **Preços dos Planos** (⚠️ Atualmente Hardcoded)
   - **Onde**: `backend/src/controllers/SubscriptionController.ts` (método `getPlans`)
   - **Valores atuais**:
     - PRO Mensal: R$ 19,90
     - PRO Anual: R$ 199,00
     - PRO Lifetime: R$ 499,00
   - **Editável**: ❌ Não (requer mudança de código)

3. **Planos PayPal** (Criados no Dashboard PayPal)
   - **Onde**: PayPal Developer Dashboard
   - **O que armazena**: IDs dos planos nas variáveis de ambiente:
     - `PAYPAL_PLAN_ID_MONTHLY`
     - `PAYPAL_PLAN_ID_YEARLY`
   - **Para mudar preços**: Precisa criar novos planos no PayPal Dashboard

## 🔧 Operação Atual do PayPal

### 1. Configuração Inicial

#### Criar Planos no PayPal Dashboard:

1. Acesse [PayPal Developer Dashboard](https://developer.paypal.com)
2. Vá em **My Apps & Credentials** → Selecione seu app
3. Vá em **Products** → **Create Product**
4. Crie um produto (ex: "Rachid PRO")

5. Vá em **Subscriptions** → **Create Plan**
   - **Plano Mensal**:
     - Nome: "PRO Mensal"
     - Preço: R$ 19,90
     - Intervalo: Mensal
     - Copie o Plan ID (começa com `P-`)
   - **Plano Anual**:
     - Nome: "PRO Anual"
     - Preço: R$ 199,00
     - Intervalo: Anual
     - Copie o Plan ID (começa com `P-`)

6. Configure Webhook:
   - URL: `https://api.orachid.com.br/api/subscriptions/webhook`
   - Eventos:
     - `BILLING.SUBSCRIPTION.*`
     - `PAYMENT.SALE.*`
     - `PAYMENT.CAPTURE.*`
   - Copie o Webhook ID

7. Configure variáveis de ambiente:
   ```env
   PAYPAL_PLAN_ID_MONTHLY=P-xxxxxxxxxxxxx
   PAYPAL_PLAN_ID_YEARLY=P-yyyyyyyyyyyyy
   PAYPAL_WEBHOOK_ID=WH-zzzzzzzzzzzzz
   ```

### 2. Como Editar Features/Limites

✅ **Pode editar via Admin**:
- Acesse `/admin/feature-limits` (requer permissão admin)
- Edite limites dinamicamente (ex: mudar FREE de 5 para 7 eventos)
- Mudanças são aplicadas imediatamente, sem deploy

### 3. Como Mudar Preços (Situação Atual)

⚠️ **Processo Atual (Requer Deploy)**:

1. **Editar Código**:
   - Abra `backend/src/controllers/SubscriptionController.ts`
   - Método `getPlans()` (linha ~204)
   - Altere os valores hardcoded

2. **Se necessário, criar novos planos no PayPal**:
   - Se mudar preços, precisa criar novos planos no PayPal Dashboard
   - Atualizar `PAYPAL_PLAN_ID_MONTHLY` e `PAYPAL_PLAN_ID_YEARLY`

3. **Deploy**:
   - Commit e deploy do código

### 4. Problemas da Abordagem Atual

❌ **Preços hardcoded**:
- Requer deploy para mudar preços
- Não há interface admin para gerenciar preços
- Difícil gerenciar promoções ou descontos

❌ **Planos PayPal separados**:
- Preços estão no PayPal Dashboard
- IDs estão nas variáveis de ambiente
- Difícil manter sincronizado

## 💡 Solução Proposta (Melhoria Futura)

### Tabela `plans` no Banco de Dados

Criar uma tabela `plans` para armazenar:
- Preços dos planos
- Configurações (nome, descrição)
- ID do plano PayPal
- Status (habilitado/desabilitado)

**Benefícios**:
- ✅ Editar preços via admin (sem deploy)
- ✅ Centralizar configurações
- ✅ Gerenciar promoções facilmente
- ✅ Desabilitar planos temporariamente

**Migração criada**: `migration_create_plans_table.sql`

## 🎯 Resumo Rápido

| Item | Onde Está | Editável? | Como Editar |
|------|-----------|-----------|-------------|
| **Features/Limites** | `plan_limits` table | ✅ Sim | `/admin/feature-limits` |
| **Preços** | Código (hardcoded) | ❌ Não | Mudar código + deploy |
| **Planos PayPal** | PayPal Dashboard | ✅ Sim | PayPal Dashboard |
| **IDs Planos PayPal** | `.env` variables | ✅ Sim | Editar `.env` + restart |

## 📝 Próximos Passos Recomendados

1. **Curto Prazo**:
   - Documentar processo atual (este guia)
   - Manter preços hardcoded por enquanto

2. **Médio Prazo**:
   - Implementar tabela `plans` no banco
   - Criar interface admin para gerenciar preços
   - Atualizar código para ler preços do banco

3. **Longo Prazo**:
   - Sincronização com PayPal
   - Sistema de promoções mais robusto
   - Histórico de mudanças de preços
