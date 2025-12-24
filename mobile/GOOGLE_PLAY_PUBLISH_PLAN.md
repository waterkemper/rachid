# Publicação do Aplicativo na Google Play Store

## Visão Geral

Este plano cobre todo o processo de publicação do aplicativo **Rachid** na Google Play Store. O projeto usa **Expo SDK 54** e será publicado usando **EAS Build** (Expo Application Services).

**IMPORTANTE**: Antes de publicar o app, é necessário configurar a infraestrutura de produção (banco de dados e backend), pois o app não funcionará sem uma API pública acessível. Se já configurou para iOS, pode reutilizar a mesma infraestrutura.

## Pré-requisitos e Custos

### Conta de Desenvolvedor Google Play

- **Custo**: $25 USD **único** (taxa única, não anual!)
- **Requisitos**: 
  - Conta Google
  - Informações pessoais ou da empresa
  - Método de pagamento
  - Tempo de aprovação: 1-2 dias (geralmente mais rápido que Apple)

### Ferramentas Necessárias

- Conta Expo (gratuita) - mesma conta usada para iOS
- EAS CLI instalado (já deve ter se configurou iOS)
- Computador (Windows/Mac/Linux - não precisa de Mac para Android)

### Infraestrutura

- **Reutilizar** a mesma infraestrutura configurada para iOS:
  - Banco de dados PostgreSQL (Supabase)
  - Backend hospedado (Railway/Render)
  - Mesma URL da API

## Diferenças Principais: Google Play vs App Store

| Aspecto | Google Play | App Store |
|---------|-------------|-----------|
| **Custo** | $25 USD único | $99 USD/ano |
| **Aprovação** | 1-2 dias | 1-7 dias |
| **Revisão** | Geralmente mais rápida | Mais rigorosa |
| **Assets** | Ícone adaptativo, screenshots diferentes | Ícone 1024x1024, screenshots específicos |
| **Testes** | Internal Testing / Closed Beta | TestFlight |
| **Atualizações** | Rollout gradual possível | Publicação imediata ou agendada |

## Etapas de Implementação

### FASE 1: Verificar Infraestrutura (Se já configurou para iOS)

#### 1.1. Verificar Backend em Produção

**Ações:**
1. Testar se backend está funcionando
2. Verificar se URL da API está acessível
3. Testar endpoints principais
4. Verificar logs

**Se ainda não configurou:**
- Seguir plano de infraestrutura do plano iOS
- Mesma configuração serve para ambos os sistemas

### FASE 2: Configuração do App Android

#### 2.1. Verificar Configuração Android no app.json

**Status atual:**
- ✅ Package name: `com.rachacontas.app` (já configurado)
- ✅ Permissões: `READ_CONTACTS` (já configurado)
- ⚠️ Adaptive icon: Configurado mas precisa verificar se arquivo existe

**Ações:**
1. Verificar se `mobile/assets/adaptive-icon.png` existe
2. Se não existir, criar ícone adaptativo:
   - Tamanho: 1024x1024px
   - Formato: PNG
   - Fundo transparente ou sólido
   - Centralizado (margem de segurança de 20% em cada lado)

**Arquivos a verificar/criar:**
- `mobile/assets/adaptive-icon.png` - Ícone adaptativo Android

#### 2.2. Atualizar URL da API (se ainda não fez)

**Ações:**
1. Verificar se `app.json` tem URL de produção
2. Atualizar se necessário

**Arquivos a modificar:**
- `mobile/app.json` - Verificar `extra.apiUrl`

### FASE 3: Configurar EAS para Android

#### 3.1. Verificar Configuração EAS Existente

**Ações:**
1. Se já tem `eas.json` do iOS, verificar se tem perfil Android
2. Se não tem, adicionar perfil Android ao `eas.json`

**Arquivos a verificar/modificar:**
- `mobile/eas.json` - Adicionar configuração Android se necessário

#### 3.2. Configurar Credenciais Android

**Ações:**
1. Executar `eas credentials`
2. Selecionar Android
3. EAS pode gerar keystore automaticamente OU
4. Usar keystore existente (se já tem)

**Opções:**
- **Deixar EAS gerenciar**: Mais fácil, recomendado
- **Usar keystore próprio**: Mais controle, mas precisa guardar senha

**Arquivos a criar/modificar:**
- Credenciais gerenciadas pelo EAS (não commitadas)

### FASE 4: Preparar Assets para Google Play

#### 4.1. Ícone Adaptativo Android

**Requisitos:**
- Tamanho: 1024x1024px
- Formato: PNG
- Conteúdo centralizado (zona segura: 20% de margem)
- Fundo transparente ou sólido (será aplicado `backgroundColor` do app.json)

**Arquivos a criar/verificar:**
- `mobile/assets/adaptive-icon.png`

#### 4.2. Screenshots para Google Play

**Requisitos diferentes do iOS:**

**Tamanhos necessários:**
- **Phone**: 
  - 16:9 (ex: 1080x1920px) - Mínimo 2 screenshots
  - 9:16 (ex: 1080x1920px) - Alternativa
- **7-inch Tablet**: 1200x1920px (opcional)
- **10-inch Tablet**: 1600x2560px (opcional)

**Recomendações:**
- Mínimo: 2 screenshots de phone
- Ideal: 4-8 screenshots mostrando funcionalidades principais
- Primeiro screenshot é o mais importante (aparece na busca)

**Arquivos a criar:**
- Screenshots (não commitados, apenas para Google Play Console)

#### 4.3. Feature Graphic (Banner)

**Requisitos:**
- Tamanho: 1024x500px
- Formato: PNG ou JPG
- Mostra na página do app na Play Store
- Deve ser atrativo e informativo

**Arquivos a criar:**
- `mobile/assets/feature-graphic.png` (não commitado, apenas para upload)

#### 4.4. Descrição do App

**Requisitos:**
- **Título**: Máx. 50 caracteres
- **Descrição curta**: Máx. 80 caracteres (aparece na busca)
- **Descrição completa**: Até 4000 caracteres
- **Palavras-chave**: Não há campo separado (usar na descrição)

**Conteúdo sugerido:**
- O que o app faz
- Principais funcionalidades
- Benefícios
- Como usar

### FASE 5: Criar Conta Google Play Developer

#### 5.1. Criar Conta

**Ações:**
1. Acessar [play.google.com/console](https://play.google.com/console)
2. Clicar em "Criar conta" ou fazer login
3. Preencher informações:
   - Nome do desenvolvedor (aparece na loja)
   - Email de contato
   - Telefone
   - País
4. Aceitar termos e condições
5. Pagar taxa única de $25 USD
6. Aguardar aprovação (1-2 dias)

**Arquivos a criar/modificar:**
- Nenhum (processo online)

### FASE 6: Configurar App no Google Play Console

#### 6.1. Criar Novo App

**Ações:**
1. Acessar Google Play Console
2. Clicar em "Criar app"
3. Preencher informações:
   - **Nome do app**: "Rachid"
   - **Idioma padrão**: Português (Brasil)
   - **Tipo de app**: App
   - **Gratuito ou pago**: Gratuito
   - **Declarações**: Preencher conforme necessário

**Arquivos a criar/modificar:**
- Nenhum (processo online)

#### 6.2. Preencher Informações da Loja

**Ações:**
1. **Presença na loja** → **Principais informações**:
   - Título do app
   - Descrição curta
   - Descrição completa
   - Screenshots
   - Feature graphic
   - Ícone do app (512x512px - será gerado do adaptive-icon)

2. **Categorização**:
   - Categoria: Finance, Utilities, etc.
   - Tags: Adicionar tags relevantes

3. **Classificação de conteúdo**:
   - Preencher questionário sobre conteúdo do app
   - Classificação geralmente: "Todos" ou "3+"

4. **Preços e distribuição**:
   - Países onde o app estará disponível
   - Preço (se for pago)

**Arquivos a criar/modificar:**
- Nenhum (processo online)

#### 6.3. Configurar Privacidade e Segurança

**Ações:**
1. **Política de privacidade**:
   - Adicionar URL da Privacy Policy (mesma do iOS)
   - Deve estar acessível publicamente

2. **Declaração de permissões**:
   - Declarar uso de `READ_CONTACTS`
   - Explicar por que o app precisa dessa permissão

3. **Dados coletados** (se aplicável):
   - Declarar tipos de dados coletados
   - Finalidades de uso
   - Compartilhamento de dados

**Arquivos a criar/modificar:**
- Reutilizar Privacy Policy do iOS

### FASE 7: Criar Build de Produção Android

#### 7.1. Criar Build AAB (Android App Bundle)

**Ações:**
1. Executar build para Android:
   ```bash
   cd mobile
   eas build --platform android --profile production
   ```

2. Aguardar conclusão (15-30 minutos):
   - Build é feito na nuvem pelo EAS
   - Receberá notificação quando concluir

3. Verificar build:
   - Acessar [expo.dev](https://expo.dev)
   - Verificar status do build
   - Baixar .aab se necessário

**Nota**: Google Play requer formato AAB (Android App Bundle), não APK. EAS gera AAB automaticamente.

**Arquivos a criar:**
- Build gerado pelo EAS (não commitado)

### FASE 8: Submeter Build para Google Play

#### 8.1. Upload do Build

**Ações:**
1. **Opção A - Via EAS (Recomendado)**:
   ```bash
   eas submit --platform android
   ```
   - EAS fará upload automático para Google Play Console
   - Pode precisar de credenciais do Google Play API

2. **Opção B - Upload Manual**:
   - Baixar .aab do EAS
   - Acessar Google Play Console
   - Ir em "Produção" → "Criar nova versão"
   - Fazer upload do arquivo .aab

**Arquivos a criar:**
- Nenhum (processo via EAS/Google Play Console)

#### 8.2. Preencher Informações da Versão

**Ações:**
1. Após upload do build:
   - Versão do app (ex: 1.0.0)
   - Versão do código (ex: 1)
   - Notas de versão (o que mudou)

2. Revisar todas as informações:
   - Screenshots
   - Descrições
   - Categorias
   - Privacidade

**Arquivos a criar:**
- Nenhum (processo online)

#### 8.3. Testes Internos (Opcional mas Recomendado)

**Ações:**
1. Criar track de "Internal testing"
2. Adicionar emails de testadores
3. Testar app antes de publicar
4. Corrigir problemas se necessário

**Vantagens:**
- Testar em dispositivos reais
- Verificar se tudo funciona
- Identificar problemas antes da publicação

### FASE 9: Publicar App

#### 9.1. Revisar e Publicar

**Ações:**
1. Revisar todas as informações uma última vez
2. Clicar em "Revisar versão"
3. Se tudo estiver OK, clicar em "Iniciar rollout para produção"
4. App será publicado (geralmente em algumas horas)

**Tempo de publicação:**
- Geralmente: 2-4 horas
- Pode levar até 7 dias em casos raros
- Você receberá notificação quando estiver disponível

#### 9.2. Monitoramento Pós-Publicação

**Ações:**
1. Monitorar downloads
2. Ler e responder avaliações
3. Verificar relatórios de erros (se houver)
4. Preparar atualizações futuras

## Arquivos que Serão Criados/Modificados

### Novos Arquivos
- `mobile/assets/adaptive-icon.png` - Ícone adaptativo Android (se não existir)
- `mobile/assets/feature-graphic.png` - Banner para Play Store (opcional, não commitado)
- Screenshots Android (não commitados, apenas para upload)

### Arquivos Modificados
- `mobile/eas.json` - Adicionar perfil Android se necessário
- `mobile/app.json` - Verificar configurações Android (já está OK)
- `mobile/README.md` - Adicionar seção sobre publicação Android

## Checklist Completo

### Infraestrutura (Reutilizar do iOS)
- [ ] Backend em produção funcionando
- [ ] URL da API configurada no app
- [ ] Testes end-to-end realizados

### Configuração Android
- [ ] Adaptive icon criado/verificado (1024x1024px)
- [ ] Package name verificado (`com.rachacontas.app`)
- [ ] Permissões declaradas corretamente
- [ ] `app.json` atualizado com URL de produção

### EAS e Build
- [ ] EAS CLI instalado
- [ ] `eas.json` configurado com perfil Android
- [ ] Credenciais Android configuradas (keystore)
- [ ] Build de produção criado (.aab)

### Google Play Console
- [ ] Conta de desenvolvedor criada e aprovada ($25 USD)
- [ ] App criado no Google Play Console
- [ ] Informações da loja preenchidas:
  - [ ] Título e descrições
  - [ ] Screenshots (mínimo 2)
  - [ ] Feature graphic
  - [ ] Categoria e tags
- [ ] Privacy Policy adicionada (URL)
- [ ] Declarações de permissões preenchidas
- [ ] Classificação de conteúdo preenchida

### Publicação
- [ ] Build (.aab) feito upload
- [ ] Informações da versão preenchidas
- [ ] Testes internos realizados (opcional)
- [ ] App revisado e publicado
- [ ] Monitoramento configurado

## Custos e Prazos

### Custos
- **Google Play Developer**: $25 USD **único** (não anual!)
- **EAS Build**: Gratuito (plano básico) ou $29/mês (plano Production)
- **Infraestrutura**: Reutilizar do iOS (~$5-7/mês)
- **Total**: ~$30 USD (taxa única) + ~$5-7/mês (infraestrutura)

### Prazos Estimados
- Criação de conta Google: 1-2 dias
- Configuração EAS: 30 minutos (se já tem do iOS)
- Preparação de assets: 1-2 horas
- Build de produção: 15-30 minutos
- Publicação: 2-4 horas (após submissão)
- **Total**: 2-4 dias úteis

## Vantagens do Google Play vs App Store

1. **Custo menor**: $25 único vs $99/ano
2. **Aprovação mais rápida**: Geralmente 1-2 dias vs 1-7 dias
3. **Processo mais simples**: Menos rigoroso que Apple
4. **Rollout gradual**: Pode liberar para % de usuários primeiro
5. **Testes mais fáceis**: Internal testing muito simples
6. **Atualizações mais rápidas**: Geralmente publica em horas

## Notas Importantes

1. **Package Name**: Já configurado como `com.rachacontas.app` - deve ser único na Play Store
2. **Versão do App**: Atualmente em `1.0.0` - incrementar para cada release
3. **Keystore**: **CRÍTICO** - Guardar senha do keystore! Se perder, não poderá atualizar o app
4. **AAB vs APK**: Google Play agora requer AAB (Android App Bundle), não APK. EAS gera AAB automaticamente
5. **Testes**: Recomendado fazer testes internos antes de publicar
6. **Rollout Gradual**: Pode publicar para 20% dos usuários primeiro, depois aumentar

## Próximos Passos Após Publicação

1. Monitorar downloads e avaliações
2. Responder a avaliações dos usuários
3. Configurar analytics (Google Analytics, Firebase)
4. Preparar atualizações regulares
5. Considerar promoções e marketing

## Comparação: iOS vs Android

| Aspecto | iOS | Android |
|---------|-----|---------|
| **Custo** | $99/ano | $25 único |
| **Tempo aprovação** | 1-7 dias | 1-2 dias |
| **Complexidade** | Mais rigoroso | Mais simples |
| **Build** | .ipa | .aab |
| **Testes** | TestFlight | Internal Testing |
| **Atualizações** | Imediatas | Rollout gradual possível |

**Recomendação**: Publicar em ambos para alcançar todos os usuários!
