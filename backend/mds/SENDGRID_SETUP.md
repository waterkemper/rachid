# Configuração do SendGrid

Este documento contém instruções detalhadas para configurar o SendGrid e habilitar o envio de e-mails transacionais no sistema Rachid.

## 📋 Pré-requisitos

1. Conta no SendGrid (plano gratuito disponível - 100 e-mails/dia)
2. Domínio ou e-mail verificado no SendGrid

## 🔧 Passo a Passo

### 1. Criar Conta no SendGrid

1. Acesse [https://sendgrid.com](https://sendgrid.com)
2. Clique em "Start for Free" e crie sua conta
3. Complete o processo de verificação de e-mail

### 2. Criar API Key

1. No dashboard do SendGrid, vá em **Settings** → **API Keys**
2. Clique em **Create API Key**
3. Dê um nome à chave (ex: "Rachid Production" ou "Rachid Development")
4. Selecione as permissões:
   - **Full Access** (recomendado para começar) OU
   - **Restricted Access** → **Mail Send** → **Full Access**
5. Clique em **Create & View**
6. **⚠️ IMPORTANTE:** Copie a API Key imediatamente! Você não poderá vê-la novamente.
7. Guarde a chave em local seguro

### 3. Verificar Remetente (Sender Authentication)

Você precisa verificar um remetente para enviar e-mails. Há duas opções:

#### Opção A: Single Sender Verification (Mais Rápido - Recomendado para Testes)

1. Vá em **Settings** → **Sender Authentication**
2. Clique em **Verify a Single Sender**
3. Preencha o formulário:
   - **From Email Address**: `noreply@seu-dominio.com` (ou e-mail que você controla)
   - **From Name**: `Rachid`
   - **Reply To**: (deixe vazio ou use o mesmo e-mail)
   - **Company Address**: Sua empresa/endereço
4. Clique em **Create**
5. Verifique seu e-mail e clique no link de confirmação enviado pelo SendGrid
6. Status mudará para "Verified" ✅

#### Opção B: Domain Authentication (Recomendado para Produção)

1. Vá em **Settings** → **Sender Authentication**
2. Clique em **Authenticate Your Domain**
3. Selecione seu provedor de DNS (Cloudflare, GoDaddy, etc.)
4. Siga as instruções para adicionar registros DNS
5. Aguarde a verificação (pode levar algumas horas)
6. Status mudará para "Authenticated" ✅

### 4. Configurar Variáveis de Ambiente

#### No Railway (Produção)

1. Acesse seu projeto no Railway
2. Vá em **Settings** → **Variables**
3. Adicione as seguintes variáveis:

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@seu-dominio.com
SENDGRID_FROM_NAME=Rachid
```

4. Clique em **Deploy** para aplicar as mudanças

#### Desenvolvimento Local

1. Crie ou edite o arquivo `.env` na pasta `backend/`
2. Adicione as variáveis:

```env
SENDGRID_API_KEY=sua-api-key-aqui
SENDGRID_FROM_EMAIL=noreply@seu-dominio.com
SENDGRID_FROM_NAME=Rachid
```

**Nota:** Se `SENDGRID_API_KEY` não estiver configurado em desenvolvimento, os e-mails serão apenas logados no console (modo simulado).

### 5. Testar Configuração

#### Via API (Recomendado)

Crie um script de teste temporário:

```typescript
// test-email.ts
import { EmailService } from './src/services/EmailService';

async function test() {
  try {
    await EmailService.enviarEmailBoasVindas(
      'seu-email@exemplo.com',
      'Nome Teste'
    );
    console.log('✅ E-mail enviado com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

test();
```

Execute:
```bash
npx tsx test-email.ts
```

#### Via Fluxo Completo

1. Execute o backend em modo desenvolvimento
2. Crie um novo usuário via API ou interface
3. Verifique se o e-mail de boas-vindas foi enviado

## 📧 Tipos de E-mail Implementados

O sistema envia automaticamente os seguintes e-mails:

1. **Recuperação de Senha** - Quando usuário solicita reset de senha
2. **Boas-vindas** - Quando novo usuário se cadastra
3. **Boas-vindas Google** - Quando usuário faz primeiro login via Google OAuth
4. **Senha Alterada** - Confirmação após alteração de senha

## 🔍 Troubleshooting

### E-mails não estão sendo enviados

1. **Verifique a API Key:**
   ```bash
   echo $SENDGRID_API_KEY  # Deve mostrar a chave (não váloga)
   ```

2. **Verifique logs do backend:**
   - Se ver `⚠️ SENDGRID_API_KEY não configurado`, a variável não está definida
   - Se ver erros SendGrid, verifique a resposta detalhada no log

3. **Verifique status do remetente:**
   - No SendGrid: Settings → Sender Authentication
   - Remetente deve estar "Verified" ou "Authenticated"

### Erro: "The from address does not match a verified Sender Identity"

- O e-mail em `SENDGRID_FROM_EMAIL` não está verificado
- Verifique o remetente no SendGrid e use exatamente o mesmo e-mail

### Erro: "Invalid API Key"

- API Key incorreta ou revogada
- Crie uma nova API Key e atualize a variável de ambiente

### E-mails indo para Spam

1. Configure SPF, DKIM e DMARC (Domain Authentication ajuda)
2. Use um domínio próprio (não e-mail genérico)
3. Mantenha uma boa reputação (não envie para listas não verificadas)

## 📊 Monitoramento

### Dashboard SendGrid

- **Activity**: Veja todos os e-mails enviados, entregues, rejeitados
- **Stats**: Estatísticas de abertura, cliques, etc.
- **Suppressions**: E-mails bloqueados ou que cancelaram inscrição

### Logs do Backend

O sistema registra:
- ✅ E-mails enviados com sucesso
- ❌ Erros de envio (em produção, continua o fluxo sem bloquear)

## 🔒 Segurança

- **Nunca** commite a API Key no código
- Use variáveis de ambiente sempre
- Revogue API Keys antigas ou não utilizadas
- Use diferentes API Keys para desenvolvimento e produção

## 📚 Recursos Adicionais

- [Documentação SendGrid](https://docs.sendgrid.com/)
- [Guia de Autenticação de Domínio](https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication)
- [Rate Limits](https://docs.sendgrid.com/api-reference/how-to-use-the-sendgrid-v3-api/rate-limits)

## 💰 Limites do Plano Gratuito

- **100 e-mails/dia** (perfeito para testes e pequenos projetos)
- Para mais volume, considere planos pagos

## ✅ Checklist de Configuração

- [ ] Conta SendGrid criada
- [ ] API Key criada e copiada
- [ ] Remetente verificado (Single Sender ou Domain)
- [ ] Variáveis de ambiente configuradas (Railway/local)
- [ ] Teste de envio realizado com sucesso
- [ ] E-mails sendo recebidos (verificar spam se necessário)

