# Debug - Problemas de Login/Cadastro

## Checklist de Problemas Comuns

### 1. ✅ Backend Está Rodando?

Verifique se o backend está rodando:
```bash
# Em outro terminal
cd backend
npm run dev
```

Deve aparecer: `Server running on http://localhost:3001`

### 2. ✅ URL da API Está Correta?

**Se você está usando dispositivo físico ou emulador:**

O `localhost` não funciona! Você precisa usar o IP da sua máquina.

#### Como descobrir seu IP:

**Windows:**
```bash
ipconfig
# Procure por "IPv4" - exemplo: 192.168.1.100
```

**macOS/Linux:**
```bash
ifconfig
# ou
ip addr
```

#### Atualizar Config:

Edite `mobile/src/constants/config.ts`:

```typescript
export const API_URL = __DEV__ 
  ? 'http://SEU_IP_AQUI:3001/api'  // Exemplo: 'http://192.168.1.100:3001/api'
  : (Constants.expoConfig?.extra?.apiUrl || 'https://api.seusite.com/api');
```

**⚠️ IMPORTANTE**: Celular e computador devem estar na mesma rede Wi-Fi!

### 3. ✅ CORS Está Configurado no Backend?

O backend precisa aceitar requisições do mobile. Verifique `backend/src/server.ts`:

```typescript
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:8081', // Expo dev web
    'exp://localhost:8081', // Expo dev
    /^exp:\/\/192\.168\.\d+\.\d+:8081$/, // Expo dev em rede local
    /^http:\/\/192\.168\.\d+\.\d+:8081$/, // Expo dev web em rede local
  ],
  credentials: true,
}));
```

### 4. ✅ Ver Logs no Console

Com os logs que adicionei, você deve ver:

**No Login:**
```
🔐 Tentando fazer login...
Email: seu@email.com
📤 REQUEST: POST /auth/login
Request Data: { "email": "...", "senha": "..." }
✅ RESPONSE: 200 /auth/login
Response Data: { "usuario": {...}, "token": "..." }
✅ Login bem-sucedido, token recebido: Sim
```

**Se der erro:**
```
❌ ERROR: 401 /auth/login
Error Data: { "error": "Email ou senha inválidos" }
❌ Erro no login: [erro completo]
```

### 5. ✅ Verificar Resposta do Backend

Os logs mostram a resposta completa. Verifique:
- Status code (200 = OK, 401 = não autorizado, 500 = erro servidor)
- Se o token está vindo na resposta
- Se há mensagem de erro específica

## Problemas Específicos

### Erro: "Network request failed"

**Causa**: Backend não acessível ou URL incorreta

**Solução**:
1. Verifique se backend está rodando
2. Se usar dispositivo físico, use IP ao invés de localhost
3. Verifique se estão na mesma rede Wi-Fi

### Erro: "401 Unauthorized"

**Causa**: Email/senha incorretos ou problema de autenticação

**Solução**:
1. Verifique email e senha
2. Verifique se o usuário existe no banco
3. Verifique logs do backend para mais detalhes

### Erro: "CORS policy"

**Causa**: Backend não está aceitando requisições do mobile

**Solução**:
1. Atualize CORS no backend para incluir URLs do Expo
2. Reinicie o backend após mudar CORS

### Erro: "Token não recebido"

**Causa**: Backend não está retornando token no body

**Solução**:
1. Verifique `backend/src/controllers/AuthController.ts`
2. Deve retornar: `res.json({ usuario: resultado.usuario, token: resultado.token });`

## Como Ver Logs Detalhados

### Método 1: Terminal do Expo
Os logs aparecem diretamente no terminal onde você executou `npm start`.

### Método 2: Chrome DevTools (Melhor para debug)

1. No app (dispositivo/simulador):
   - Agite o dispositivo OU
   - Pressione `Cmd+D` (iOS) ou `Cmd+M` (Android)

2. Selecione "Debug Remote JS"

3. Abra o Chrome e vá em `chrome://inspect`

4. Clique em "inspect" no seu app

5. Vá na aba **Console** para ver todos os logs

### Método 3: React Native Debugger
Para uma experiência mais completa, use o React Native Debugger:
https://github.com/jhen0409/react-native-debugger

## Teste Rápido

Para testar se a conexão está funcionando, adicione temporariamente no início do `handleSubmit`:

```typescript
console.log('🔍 URL da API:', API_URL);
console.log('🔍 Email:', email);
```

Isso ajuda a verificar se a configuração está correta.

