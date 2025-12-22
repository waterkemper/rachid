# Como Testar o App Mobile

Este guia explica como executar e testar o app mobile do Racha Contas.

## Pré-requisitos

### 1. Instalar Dependências do Projeto

```bash
cd mobile
npm install
```

### 2. Backend Rodando

Certifique-se de que o backend está rodando em `http://localhost:3001`:

```bash
# Em outro terminal, na pasta raiz do projeto
cd backend
npm run dev
```

### 3. Configurar URL da API (Se necessário)

Se você for testar em dispositivo físico ou emulador Android, precisará usar o IP da sua máquina ao invés de `localhost`.

1. Descubra o IP da sua máquina:
   - **Windows**: Execute `ipconfig` e procure por "IPv4"
   - **macOS/Linux**: Execute `ifconfig` ou `ip addr`

2. Atualize `mobile/src/constants/config.ts`:

```typescript
export const API_URL = __DEV__ 
  ? 'http://SEU_IP_AQUI:3001/api'  // Exemplo: 'http://192.168.1.100:3001/api'
  : (Constants.expoConfig?.extra?.apiUrl || 'https://api.seusite.com/api');
```

## Formas de Testar

### Opção 1: Expo Go (Mais Fácil - Recomendado para Começar)

⚠️ **IMPORTANTE**: O Expo Go sempre usa a versão mais recente do SDK (atualmente SDK 54). Se seu projeto usa uma versão mais antiga (como SDK 50), você tem duas opções:

1. **Atualizar o projeto para SDK 54** (recomendado) - veja `ATUALIZAR_SDK.md`
2. **Usar simulador/emulador** ao invés do Expo Go (veja opções 2 e 3)

O Expo Go permite testar o app diretamente no seu celular sem precisar compilar.

#### Passo 1: Instalar Expo Go

- **iOS**: [App Store - Expo Go](https://apps.apple.com/app/expo-go/id982107779)
  - ⚠️ **iOS só suporta a versão mais recente do Expo Go (SDK 54)**
- **Android**: [Google Play - Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)

#### Passo 2: Iniciar o Servidor de Desenvolvimento

```bash
cd mobile
npm start
```

Isso abrirá o Expo Dev Tools no navegador com um QR Code.

#### Passo 3: Conectar o Dispositivo

- **iOS**: 
  - Abra a câmera do iPhone
  - Aponte para o QR Code
  - Toque na notificação que aparecer
  - O app abrirá no Expo Go

- **Android**:
  - Abra o app Expo Go
  - Toque em "Scan QR code"
  - Escaneie o QR Code
  - O app será carregado

#### Vantagens:
- ✅ Rápido e fácil
- ✅ Não precisa compilar
- ✅ Hot reload automático
- ✅ Funciona em dispositivos físicos

#### Desvantagens:
- ⚠️ **iOS requer que o projeto use o mesmo SDK do Expo Go instalado (atualmente SDK 54)**
- ⚠️ Algumas APIs nativas podem não estar disponíveis
- ⚠️ Pode ser mais lento que versão compilada

#### Se Receber Erro de Incompatibilidade de SDK:

**iOS**: Você precisa atualizar o projeto para SDK 54 ou usar simulador iOS (veja Opção 2)

**Android**: Geralmente é mais flexível, mas pode ter problemas similares com versões muito antigas

---

### Opção 2: Simulador iOS (Apenas macOS)

#### Passo 1: Instalar Xcode

Baixe e instale o Xcode da App Store (requer macOS).

#### Passo 2: Instalar Simulador iOS

O simulador vem com o Xcode. Para abrir:
- Abra o Xcode
- Vá em Xcode → Open Developer Tool → Simulator

Ou instale via linha de comando:
```bash
xcode-select --install
```

#### Passo 3: Iniciar o App

```bash
cd mobile
npm run ios
```

Isso irá:
1. Abrir o simulador iOS
2. Compilar o app
3. Instalar e executar o app no simulador

#### Vantagens:
- ✅ Simula dispositivo iOS real
- ✅ Bom para desenvolvimento
- ✅ Acesso a todas as APIs nativas

---

### Opção 3: Emulador Android

#### Passo 1: Instalar Android Studio

Baixe e instale o [Android Studio](https://developer.android.com/studio).

#### Passo 2: Configurar AVD (Android Virtual Device)

1. Abra o Android Studio
2. Vá em Tools → Device Manager
3. Clique em "Create Device"
4. Escolha um dispositivo (ex: Pixel 5)
5. Escolha uma imagem do sistema (recomendado: API 33 ou superior)
6. Finalize a criação

#### Passo 3: Iniciar o Emulador

1. Abra o Device Manager no Android Studio
2. Clique em "Play" no dispositivo criado

Ou via linha de comando:
```bash
# Listar emuladores disponíveis
emulator -list-avds

# Iniciar emulador específico
emulator -avd NOME_DO_AVD
```

#### Passo 4: Iniciar o App

Com o emulador rodando:

```bash
cd mobile
npm run android
```

#### Vantagens:
- ✅ Simula dispositivo Android real
- ✅ Bom para desenvolvimento
- ✅ Acesso a todas as APIs nativas

---

### Opção 4: Dispositivo Físico (Desenvolvimento)

#### iOS (macOS necessário)

1. **Conectar o iPhone via USB**
2. **Confiar no computador** (no iPhone, aparecerá um popup)
3. **Executar**:
   ```bash
   cd mobile
   npm run ios
   ```
4. Selecione seu dispositivo na lista que aparecer

#### Android

1. **Habilitar Modo Desenvolvedor**:
   - Vá em Configurações → Sobre o telefone
   - Toque 7 vezes em "Número da versão"

2. **Habilitar Depuração USB**:
   - Vá em Configurações → Opções do desenvolvedor
   - Ative "Depuração USB"

3. **Conectar via USB** e autorizar o computador

4. **Executar**:
   ```bash
   cd mobile
   npm run android
   ```

---

## Comandos Úteis

### Iniciar em modo desenvolvimento
```bash
npm start
```

### Limpar cache (se tiver problemas)
```bash
npm start -- --clear
```

### Executar em plataforma específica
```bash
npm run ios        # iOS (macOS)
npm run android    # Android
npm run web        # Web browser (experimental)
```

### Ver logs
Quando o app estiver rodando, você pode ver logs em:
- Terminal onde executou `npm start`
- React Native Debugger (se configurado)
- Chrome DevTools (se habilitado)

---

## Solução de Problemas Comuns

### Problema: "Unable to resolve module"

**Solução**: Limpe o cache e reinstale dependências:
```bash
cd mobile
rm -rf node_modules
npm install
npm start -- --clear
```

### Problema: Erro de conexão com o backend

**Causas comuns**:
1. Backend não está rodando
2. URL da API incorreta
3. Firewall bloqueando conexão

**Solução**:
- Verifique se o backend está rodando em `http://localhost:3001`
- Para dispositivo físico, use o IP da máquina na configuração da API
- Verifique se a porta 3001 está aberta no firewall

### Problema: Metro bundler não inicia

**Solução**:
```bash
cd mobile
npm start -- --reset-cache
```

### Problema: App não carrega no Expo Go

**Soluções**:
1. Certifique-se de que o celular e computador estão na mesma rede Wi-Fi
2. Tente usar "Tunnel" ao invés de "LAN" no Expo Dev Tools
3. Verifique se o firewall não está bloqueando a conexão

### Problema: Erro de porta já em uso

**Solução**: Mate o processo usando a porta:
```bash
# Windows
netstat -ano | findstr :8081
taskkill /PID [PID_NUMBER] /F

# macOS/Linux
lsof -ti:8081 | xargs kill -9
```

---

## Testando Funcionalidades

### 1. Autenticação
- [ ] Criar nova conta
- [ ] Fazer login
- [ ] Fazer logout
- [ ] Verificar persistência do login (fechar e reabrir app)

### 2. Participantes
- [ ] Listar participantes
- [ ] Criar novo participante
- [ ] Editar participante
- [ ] Excluir participante

### 3. Eventos
- [ ] Listar eventos
- [ ] Criar novo evento
- [ ] Ver detalhes do evento
- [ ] Excluir evento

### 4. Despesas
- [ ] Listar despesas
- [ ] Filtrar por evento
- [ ] Criar nova despesa
- [ ] Editar despesa
- [ ] Excluir despesa

### 5. Relatórios
- [ ] Ver saldos dos participantes
- [ ] Ver sugestões de pagamento
- [ ] Filtrar por evento

---

## Próximos Passos

Após testar o app:

1. **Corrigir bugs encontrados**
2. **Melhorar UI/UX conforme necessário**
3. **Adicionar funcionalidades faltantes**
4. **Otimizar performance**
5. **Preparar para build de produção**

Para mais informações sobre desenvolvimento com Expo, consulte:
- [Documentação Expo](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)

