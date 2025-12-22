# Como Ver Logs no Expo

## Métodos para Ver Logs

### 1. Terminal do Expo (Mais Fácil)

Os logs aparecem diretamente no terminal onde você executou `npm start`:

```bash
cd mobile
npm start
```

Você verá:
- ✅ Erros de compilação
- ✅ Console.log() do JavaScript
- ✅ Erros de runtime
- ✅ Warnings

### 2. Metro Bundler Logs

No terminal onde o Expo está rodando, você verá os logs do Metro bundler que incluem:
- Erros de JavaScript
- Warnings
- Logs do console

### 3. Chrome DevTools (Para Debug Mais Avançado)

#### Passo 1: Abrir Menu de Desenvolvimento

**No Dispositivo Físico:**
- Agite o dispositivo (shake gesture)
- Ou use 3 dedos para tocar a tela

**No Simulador iOS:**
- Pressione `Cmd + D` (macOS)
- Ou Device → Shake

**No Emulador Android:**
- Pressione `Cmd + M` (macOS) ou `Ctrl + M` (Windows/Linux)
- Ou adb: `adb shell input keyevent 82`

#### Passo 2: Selecionar "Debug Remote JS"

No menu que aparecer, selecione:
- **"Debug Remote JS"** ou **"Debug"**

Isso abrirá o Chrome DevTools no navegador.

#### Passo 3: Ver Logs no Chrome

1. Abra o Chrome
2. Vá em `chrome://inspect` (ou será aberto automaticamente)
3. Clique em "inspect" no seu app
4. Vá na aba **Console** para ver logs e erros

### 4. React Native Debugger (Ferramenta Dedicada)

Para uma experiência de debug mais completa:

```bash
# Instalar (opcional)
# Baixe em: https://github.com/jhen0409/react-native-debugger
```

### 5. Flipper (Facebook Debugging Tool)

Para debug avançado com network inspector, etc:

1. Instale o Flipper: https://fbflipper.com/
2. Configure no projeto (já vem integrado com Expo em algumas versões)

## Logs Específicos

### Ver Logs de Requisições HTTP

Para ver requisições para a API, adicione logs no código ou use:

**No Chrome DevTools:**
- Aba **Network** mostra todas as requisições HTTP
- Filtre por "Fetch/XHR" para ver apenas chamadas de API

**No código (temporário para debug):**
```typescript
// Em src/services/api.ts
api.interceptors.request.use((config) => {
  console.log('📤 REQUEST:', config.method?.toUpperCase(), config.url);
  console.log('Data:', config.data);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('✅ RESPONSE:', response.status, response.config.url);
    console.log('Data:', response.data);
    return response;
  },
  (error) => {
    console.log('❌ ERROR:', error.response?.status, error.config?.url);
    console.log('Error Data:', error.response?.data);
    console.log('Full Error:', error);
    return Promise.reject(error);
  }
);
```

### Ver Logs do AsyncStorage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ver todos os itens salvos
AsyncStorage.getAllKeys().then((keys) => {
  console.log('📦 AsyncStorage keys:', keys);
  AsyncStorage.multiGet(keys).then((pairs) => {
    console.log('📦 AsyncStorage values:', pairs);
  });
});
```

## Logs Mais Comuns de Problemas

### Problema: "Network request failed"
- Verifique se o backend está rodando
- Verifique a URL da API em `src/constants/config.ts`
- Para dispositivo físico, use o IP da máquina, não `localhost`

### Problema: "401 Unauthorized"
- Token expirado ou inválido
- Verifique se o login está salvando o token corretamente
- Verifique se o token está sendo enviado nas requisições

### Problema: "CORS error"
- Backend precisa aceitar requisições do mobile
- Verifique CORS no backend

### Problema: "Unable to resolve module"
- Limpe o cache: `npm start -- --clear`
- Reinstale dependências: `rm -rf node_modules && npm install`

## Comandos Úteis

### Limpar Cache e Reiniciar
```bash
npm start -- --clear
```

### Ver Versões Instaladas
```bash
npm list --depth=0
```

### Verificar Erros de TypeScript
```bash
npx tsc --noEmit
```

### Ver Logs do Sistema (macOS)
```bash
# iOS Simulator logs
xcrun simctl spawn booted log stream --level=debug
```

### Ver Logs do Sistema (Android)
```bash
# Android logs
adb logcat *:E
```

## Dicas de Debug

1. **Use console.log() estrategicamente:**
```typescript
const handleLogin = async () => {
  console.log('🔐 Tentando fazer login...');
  console.log('Email:', email);
  console.log('Senha:', senha ? '***' : 'vazia');
  
  try {
    const result = await authApi.login(email, senha);
    console.log('✅ Login bem-sucedido:', result);
  } catch (error) {
    console.error('❌ Erro no login:', error);
    console.error('Response:', error.response);
  }
};
```

2. **Verifique o estado do React:**
   - Use React DevTools (se instalado)
   - Ou adicione logs nos estados

3. **Verifique a rede:**
   - Use Chrome DevTools Network tab
   - Verifique se as requisições estão sendo feitas
   - Verifique o status code das respostas

