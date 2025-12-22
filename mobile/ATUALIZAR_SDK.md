# Atualizar Expo SDK 50 para 54

## Passo a Passo

### 1. Fazer backup (recomendado)
```bash
cd mobile
git add .
git commit -m "Backup antes de atualizar para SDK 54"
```

### 2. Atualizar o Expo CLI globalmente (opcional mas recomendado)
```bash
npm install -g expo-cli@latest
```

### 3. Atualizar o Expo SDK
```bash
cd mobile
npx expo install expo@latest
```

### 4. Atualizar todas as dependências relacionadas ao Expo
```bash
npx expo install --fix
```

### 5. Verificar e atualizar dependências manualmente (se necessário)

Verifique se há dependências que precisam ser atualizadas:
```bash
npx expo-doctor
```

### 6. Testar o app
```bash
npm start
```

## Mudanças Esperadas

- React Native será atualizado (provavelmente para 0.76.x)
- Algumas APIs podem ter mudado
- Verifique o changelog: https://expo.dev/changelog/

## Se Encontrar Erros

1. Limpe o cache:
```bash
npm start -- --clear
```

2. Reinstale node_modules:
```bash
rm -rf node_modules
npm install
```

3. Verifique compatibilidade de pacotes:
```bash
npx expo-doctor
```

