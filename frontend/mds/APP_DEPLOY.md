# Deploy do App - app.orachid.com.br

## Configuração no Vercel

### 1. Criar Novo Projeto

1. Acesse [vercel.com](https://vercel.com)
2. Crie um novo projeto
3. Conecte o mesmo repositório GitHub
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`

### 2. Variáveis de Ambiente

Adicione no painel da Vercel (Settings → Environment Variables):

```
VITE_API_URL=https://api.orachid.com.br
```

### 3. Configurar Domínio

1. No painel da Vercel, vá em **Settings** → **Domains**
2. Adicione `app.orachid.com.br`
3. Configure DNS conforme instruções

### 4. Atualizar Código (Opcional)

O código já está preparado para funcionar. Se quiser redirecionar usuários não autenticados da home para a landing:

```typescript
// Em App.tsx, adicionar verificação
if (!usuario && (location.pathname === '/' || location.pathname === '/home')) {
  window.location.href = 'https://orachid.com.br/';
}
```

## Estrutura de URLs

- `app.orachid.com.br/` - App principal (requer autenticação para áreas protegidas)
- `app.orachid.com.br/login` - Login
- `app.orachid.com.br/cadastro` - Cadastro
- `app.orachid.com.br/eventos` - Dashboard (protegido)

## Notas

- O app continua funcionando como SPA (Single Page Application)
- Não precisa de SSR/SSG - é uma aplicação autenticada
- SEO não é prioridade para o app (apenas para a landing)

