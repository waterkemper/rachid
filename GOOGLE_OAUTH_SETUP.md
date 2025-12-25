# Configuração do Login via Google OAuth

Este documento descreve como configurar o login via Google OAuth no sistema Rachid.

## Pré-requisitos

1. Conta no Google Cloud Console
2. Projeto criado no Google Cloud Console
3. OAuth 2.0 Client ID configurado

## Passo 1: Configurar no Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure a tela de consentimento OAuth (se ainda não tiver feito)
6. Crie um OAuth 2.0 Client ID:
   - **Application type**: Web application (para frontend)
   - **Name**: Rachid Web App
   - **Authorized JavaScript origins**: 
     - `http://localhost:5173` (desenvolvimento)
     - `https://seu-dominio.com` (produção)
   - **Authorized redirect URIs**: 
     - `http://localhost:5173` (desenvolvimento)
     - `https://seu-dominio.com` (produção)

7. Para Mobile, crie outro OAuth 2.0 Client ID:
   - **Application type**: Android ou iOS
   - **Package name**: (do seu app React Native)
   - **SHA-1 certificate fingerprint**: (para Android)

## Passo 2: Instalar Dependências

### Backend

```bash
cd backend
npm install google-auth-library
```

### Frontend (Web)

```bash
cd frontend
npm install @react-oauth/google
```

### Mobile (React Native)

```bash
cd mobile
npm install @react-native-google-signin/google-signin
```

Para iOS, também execute:
```bash
cd ios
pod install
```

## Passo 3: Configurar Variáveis de Ambiente

### Backend

Adicione no arquivo `.env` do backend:

```env
GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
```

### Frontend

Adicione no arquivo `.env` do frontend:

```env
VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
```

### Mobile

No arquivo `mobile/src/screens/auth/LoginScreen.tsx`, atualize a configuração do GoogleSignin:

```typescript
GoogleSignin.configure({
  webClientId: 'seu-web-client-id-aqui.apps.googleusercontent.com', // Use o Client ID do tipo Web
});
```

## Passo 4: Executar Migration do Banco de Dados

Execute a migration SQL para adicionar os campos necessários:

```bash
# No Supabase ou seu cliente PostgreSQL, execute:
psql -U seu_usuario -d seu_banco -f backend/database/migration_add_google_oauth.sql
```

Ou execute manualmente no seu banco de dados:

```sql
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_id VARCHAR UNIQUE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS auth_provider VARCHAR DEFAULT 'local';
ALTER TABLE usuarios ALTER COLUMN senha DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usuarios_google_id ON usuarios(google_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_provider ON usuarios(auth_provider);
```

## Passo 5: Configuração Adicional para Mobile

### Android

1. Adicione o `google-services.json` no diretório `android/app/`
2. Configure o `build.gradle` conforme a documentação do `@react-native-google-signin/google-signin`

### iOS

1. Configure o `Info.plist` com as URLs schemes necessárias
2. Siga a documentação do pacote para configuração completa

## Como Funciona

1. **Usuário clica em "Entrar com Google"**
2. **Frontend/Mobile**: Obtém token ID do Google via OAuth
3. **Frontend/Mobile**: Envia token para `/api/auth/google`
4. **Backend**: Valida token com Google usando `google-auth-library`
5. **Backend**: Busca ou cria usuário no banco de dados
   - Se email já existe: faz login automático e vincula `google_id`
   - Se não existe: cria novo usuário sem senha
6. **Backend**: Retorna JWT token (mesmo formato do login tradicional)
7. **Frontend/Mobile**: Salva token e redireciona usuário

## Testando

1. Inicie o backend: `cd backend && npm run dev`
2. Inicie o frontend: `cd frontend && npm run dev`
3. Acesse a página de login
4. Clique em "Entrar com Google"
5. Faça login com sua conta Google
6. Verifique se foi redirecionado corretamente

## Troubleshooting

### Erro: "GOOGLE_CLIENT_ID não configurado"
- Verifique se a variável de ambiente está definida no `.env` do backend
- Reinicie o servidor após adicionar a variável

### Erro: "Token do Google inválido ou expirado"
- Verifique se o `GOOGLE_CLIENT_ID` está correto
- Verifique se o token não expirou (tokens do Google expiram rapidamente)

### Erro no Frontend: "GoogleOAuthProvider clientId is required"
- Verifique se `VITE_GOOGLE_CLIENT_ID` está definido no `.env` do frontend
- Reinicie o servidor de desenvolvimento do Vite

### Erro no Mobile: "Google Play Services not available"
- Verifique se o Google Play Services está instalado no dispositivo Android
- Para iOS, verifique a configuração do `Info.plist`

## Segurança

- ✅ Tokens são sempre validados no backend
- ✅ Nunca confie apenas na validação do frontend
- ✅ Tokens do Google são verificados com a API do Google
- ✅ Usuários OAuth não têm senha (campo nullable)
- ✅ JWT tokens são gerados da mesma forma que login tradicional

