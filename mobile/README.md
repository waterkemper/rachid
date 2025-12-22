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

- ✅ Autenticação (Login/Cadastro)
- ✅ Gerenciamento de Participantes
- ✅ Gerenciamento de Eventos
- ✅ Gerenciamento de Despesas
- ✅ Relatórios e Saldos
- ✅ Grupos Maiores

## Notas

- O app usa Bearer token para autenticação (armazenado no AsyncStorage)
- Todos os tipos TypeScript são compartilhados com o frontend web via pasta `shared/`
- O backend precisa ter CORS configurado para aceitar requisições do app mobile

