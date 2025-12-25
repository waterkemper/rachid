# Guia de Deploy - Landing Page

## Deploy na Vercel

### 1. Preparação

1. Certifique-se de que a imagem OG está criada:
   - `public/og-image.png` (1200x630px)
   - Veja `public/OG_IMAGE_README.md` para instruções

2. Teste localmente:
   ```bash
   npm install
   npm run build
   npm run preview
   ```

### 2. Deploy na Vercel

#### Opção A: Via GitHub (Recomendado)

1. Faça commit e push do código para o repositório
2. Acesse [vercel.com](https://vercel.com)
3. Importe o projeto
4. Configure:
   - **Root Directory**: `landing`
   - **Framework Preset**: Astro
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Adicione variáveis de ambiente (se necessário)
6. Deploy!

#### Opção B: Via CLI

```bash
cd landing
npm install -g vercel
vercel
```

### 3. Configurar Domínio

1. No painel da Vercel, vá em **Settings** → **Domains**
2. Adicione `orachid.com.br`
3. Configure os registros DNS conforme instruções da Vercel:
   - Tipo: CNAME ou A
   - Valor: fornecido pela Vercel

### 4. Verificações Pós-Deploy

- [ ] Acesse `https://orachid.com.br` e verifique se carrega
- [ ] Verifique `view-source:https://orachid.com.br/` - HTML deve estar renderizado
- [ ] Teste `https://orachid.com.br/robots.txt`
- [ ] Teste `https://orachid.com.br/sitemap.xml`
- [ ] Valide OG tags: https://developers.facebook.com/tools/debug/
- [ ] Teste Lighthouse: Performance > 90, SEO > 90

## Separar App para app.orachid.com.br

### 1. Criar Novo Projeto Vercel para o App

1. No painel Vercel, crie um novo projeto
2. Conecte o mesmo repositório
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Adicione domínio: `app.orachid.com.br`

### 2. Atualizar Frontend para Redirecionar

No `frontend/src/App.tsx`, adicione redirecionamento:

```typescript
// Se usuário não autenticado e estiver em / ou /home, redirecionar para landing
if (!usuario && (location.pathname === '/' || location.pathname === '/home')) {
  window.location.href = 'https://orachid.com.br/';
}
```

### 3. Configurar Variáveis de Ambiente

No projeto do app na Vercel, certifique-se de que:
- `VITE_API_URL` aponta para `https://api.orachid.com.br`

## DNS

Configure os seguintes registros no seu provedor de DNS:

```
A/CNAME  orachid.com.br        → Vercel (landing)
A/CNAME  app.orachid.com.br    → Vercel (app)
A/CNAME  api.orachid.com.br    → Railway (já configurado)
```

## Troubleshooting

### Build falha
- Verifique se `npm install` funciona localmente
- Verifique logs de build na Vercel

### Domínio não funciona
- Aguarde propagação DNS (pode levar até 48h)
- Verifique configurações DNS no provedor

### OG tags não aparecem
- Verifique se `og-image.png` existe em `public/`
- Use Facebook Debugger para limpar cache

