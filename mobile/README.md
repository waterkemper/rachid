# Racha Contas - Mobile App

App mobile para o sistema Racha Contas, desenvolvido com React Native e Expo.

## Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Para iOS: Xcode e CocoaPods (apenas macOS)
- Para Android: Android Studio e Android SDK

## Instalação

1. Instalar dependências:
```bash
cd mobile
npm install
```

2. Certifique-se de que o backend está rodando em `http://localhost:3001`

3. Iniciar o app:
```bash
npm start
```

Isso abrirá o Expo Dev Tools. Você pode:
- Pressionar `i` para abrir no simulador iOS
- Pressionar `a` para abrir no emulador Android
- Escanear o QR code com o app Expo Go no seu dispositivo físico

---

## Como rodar com Expo Go

1. **Instale o Expo Go** no celular:
   - [Android – Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS – App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Na pasta do projeto**, suba o backend e o app:
   ```bash
   # Terminal 1 – backend (na raiz do projeto)
   cd backend
   npm run dev

   # Terminal 2 – app mobile
   cd mobile
   npm install
   npm start
   ```

3. **Abra com Expo Go**:
   - No terminal onde rodou `npm start` vai aparecer um **QR code**.
   - **Android**: abra o app Expo Go e escaneie o QR code.
   - **iOS**: abra o app **Câmera**, aponte para o QR code e toque na notificação para abrir no Expo Go.

4. **API no celular físico**  
   No celular, `localhost` é a própria máquina do telefone, não o seu PC. Por isso a API precisa usar o **IP do seu computador**:
   - Edite `mobile/src/constants/config.ts`.
   - Troque `localhost` pelo IP da sua máquina, por exemplo:
     ```ts
     export const API_URL = __DEV__
       ? 'http://192.168.15.25:3001/api'   // use seu IP (ipconfig / ifconfig)
       : (Constants.expoConfig?.extra?.apiUrl || 'https://api.seusite.com/api');
     ```
   - Celular e PC devem estar na **mesma rede Wi‑Fi**.
   - No **emulador/simulador** no PC, `localhost` ou `10.0.2.2` (Android) costuma funcionar sem mudar o IP.

## Estrutura do Projeto

```
mobile/
├── src/
│   ├── screens/          # Telas do app
│   │   ├── auth/        # Telas de autenticação
│   │   └── ...          # Outras telas
│   ├── components/      # Componentes reutilizáveis
│   ├── navigation/      # Configuração de navegação
│   ├── services/        # API client
│   ├── contexts/        # Contextos React (Auth)
│   └── constants/       # Constantes e configurações
├── App.tsx              # Componente principal
├── app.json             # Configuração Expo
└── package.json
```

## Configuração da API

A URL da API é configurada em `src/constants/config.ts`. 

- Em desenvolvimento: `http://localhost:3001/api`
- Em produção: configurar via variável de ambiente no `app.json`

Para desenvolvimento em dispositivo físico, você precisará usar o IP da sua máquina ao invés de `localhost`:
```
http://SEU_IP:3001/api
```

## Build para Produção

### Desenvolvimento
```bash
npm start
```

### Build Standalone (iOS)
```bash
eas build --platform ios
```

### Build Standalone (Android)
```bash
eas build --platform android
```

### Publicar nas Lojas
Veja a documentação do Expo sobre publicação:
- [iOS App Store](https://docs.expo.dev/distribution/app-stores/)
- [Google Play Store](https://docs.expo.dev/distribution/app-stores/)

## Tecnologias Utilizadas

- **React Native**: Framework mobile
- **Expo**: Plataforma e ferramentas
- **React Navigation**: Navegação
- **React Native Paper**: Componentes UI
- **Axios**: Cliente HTTP
- **AsyncStorage**: Armazenamento local (tokens)
- **TypeScript**: Tipagem estática

## Funcionalidades

- ✅ **Autenticação**: Login (email/senha e Google OAuth*), cadastro, recuperação e redefinição de senha, logout
- ✅ **Participantes**: Listar, criar, editar, excluir (nome, email, chave PIX)
- ✅ **Eventos**: Listar, criar, editar, excluir, duplicar; status (Em aberto / Concluído / Cancelado); concluir, cancelar ou reabrir evento; link de compartilhamento
- ✅ **Despesas**: Listar por evento, criar, editar, excluir; **anexos** (listar, enviar foto, visualizar, excluir); participações e recalcular
- ✅ **Relatórios**: Saldos por participante e por grupo; sugestões de pagamento; marcar como pago e confirmar recebimento; compartilhar via WhatsApp; **botão Ver gráficos**
- ✅ **Gráficos**: Tela com dados por pagador (pizza), gastos por participante (barras), evolução no tempo, top despesas, evolução dos saldos (requer plano PRO)
- ✅ **Grupos Maiores**: Listar, criar, editar, excluir; usar ao criar novo evento
- ✅ **Templates**: Criar evento a partir de template
- ✅ **Conta**: Ver dados e plano; **editar perfil** (nome, email, telefone); **preferências de email** (receber ou não); **Ver planos e assinatura**; sair
- ✅ **Planos e assinatura**: Listar planos, assinar com PIX (QR/código), LIFETIME, cancelar/retomar assinatura, ver uso
- ✅ **Evento público**: Ver evento por link (sem login); colar token na tela "Ver evento por link" (Login); reivindicar participação ao criar conta com token

\* Google OAuth funciona em development build ou produção; não no Expo Go.

## Notas

- O app usa Bearer token para autenticação (armazenado no AsyncStorage)
- Todos os tipos TypeScript são compartilhados com o frontend web via pasta `shared/`
- O backend precisa ter CORS configurado para aceitar requisições do app mobile

