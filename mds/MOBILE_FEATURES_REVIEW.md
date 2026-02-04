# Revisão de Funcionalidades – App Mobile (Rachid)

Documento de alinhamento entre README/FEATURES.md e o app mobile (`/mobile`).  
Objetivo: listar o que está implementado e o que falta para paridade com o sistema web.

---

## ✅ Já implementado no mobile

### Autenticação
- Login com email e senha
- Login com Google OAuth (development build / produção; não no Expo Go)
- Cadastro (create-user)
- Recuperação e redefinição de senha
- Logout
- Verificação de sessão (token em AsyncStorage)

### Participantes
- Listar, criar, editar, excluir
- Nome, email, chave PIX (api e tipos)

### Eventos (Grupos)
- Listar, criar, editar, excluir
- Nome, descrição, data
- Adicionar/remover participantes do evento
- Duplicar evento (API disponível; botão adicionado nesta revisão)
- Gerar/obter link de compartilhamento
- Criar evento a partir de template (NovoEventoScreen)
- Sugestão de grupos maiores ao criar evento

### Despesas
- Listar por grupo, criar, editar, excluir
- Descrição, valor total, pagador, participações
- Participação toggle e recalcular (API)

### Relatórios
- Saldos por participante
- Saldos por grupo (subgrupos)
- Sugestões de pagamento (individual e entre grupos)
- Detalhes por participante/grupo (despesas relacionadas)
- Compartilhar via WhatsApp (mensagem formatada, link público, chaves PIX)
- Copiar mensagem / PIX

### Grupos maiores
- Listar, criar, editar, excluir
- Adicionar/remover grupos e participantes
- Obter participantes do grupo maior
- Tela dedicada e uso em Novo Evento

### Navegação e UI
- Abas: Eventos, Participantes, Despesas, Relatórios, Conta
- Telas: Login, Cadastro, Recuperar/Resetar senha, Novo Evento, Adicionar Participantes, Grupos Maiores, Ajuda
- Tema escuro, React Native Paper

### Conta
- Exibir nome, email, telefone, plano (FREE/PRO)
- Logout

---

## 🔄 Implementado nesta revisão

1. **Status de eventos**
   - Badge de status no card do evento (EM_ABERTO, CONCLUIDO, CANCELADO)
   - Ação para atualizar status (Concluir / Cancelar / Reabrir) quando permitido
   - Bloqueio de edição/exclusão para eventos CONCLUIDO/CANCELADO (comportamento alinhado ao backend)

2. **Controle de pagamentos**
   - Exibição de status por sugestão (pago / confirmado) no Relatório
   - Ações “Marcar como pago” e “Confirmar recebimento” no Relatório (eventos EM_ABERTO)
   - API de pagamentos no cliente: marcarComoPago, marcarComoPagoEntreGrupos, confirmarPagamento, getPagamentosPorEvento

3. **Duplicar evento**
   - Botão “Duplicar” na lista de eventos (GruposScreen) usando `grupoApi.duplicar`

4. **Config e API**
   - Correção do typo na `API_URL` em `config.ts` (removido `image.png`)
   - `grupoApi.updateStatus(id, status)`
   - `pagamentoApi` completo no `api.ts`

5. **WhatsApp**
   - `isDespesaPlaceholder` no mobile alinhado ao frontend (considera `pagador?.id`)

6. **Documentação**
   - README do mobile atualizado com a lista atual de funcionalidades

---

## ✅ Implementado (atualização)

### Perfil / Conta
- Editar dados do usuário (nome, email, DDD, telefone) – ContaScreen
- Preferências de email (opt-in/opt-out) – ContaScreen com Switch

### Eventos públicos
- Tela EventoPublico: colar token ou abrir por link
- Visualizar evento por token sem login (saldos, sugestões, despesas)
- Botão "Ver evento por link" na tela de Login
- Reivindicar participação: ao criar conta a partir do link do evento (Cadastro com token)

### Anexos de despesas
- Listar anexos por despesa – modal "Anexos" em DespesasScreen
- Upload de foto (expo-image-picker) – botão "Enviar foto"
- Visualizar anexo (abrir URL de download)
- Excluir anexo
- Limite por plano (PRO) – backend retorna 402 se não tiver plano

### Assinaturas / Planos
- Tela Planos: listar planos, assinatura atual, uso
- Assinar com PIX (QR Code e copiar código)
- Assinar LIFETIME com PIX
- Cancelar e retomar assinatura
- Navegação a partir de Conta ("Ver planos e assinatura")

### Gráficos
- Tela Graficos: seleção de evento, dados por pagador (pizza), gastos por participante (barras), evolução no tempo, top despesas, evolução dos saldos
- Botão "Ver gráficos" na tela de Relatório
- Requer plano PRO (backend requirePro nas rotas de gráficos)

### Ainda não implementado
- Exportar relatório em PDF
- Abrir link do WhatsApp diretamente (hoje só copia mensagem)
- Checkout com cartão de crédito no app (hoje apenas PIX)

---

## 📋 Endpoints usados pelo mobile

| Área        | Endpoints utilizados |
|------------|------------------------|
| Auth       | login, google, logout, create-user, me, solicitar-recuperacao-senha, validar-token-recuperacao, resetar-senha |
| Participantes | GET/POST /participantes, GET/PUT/DELETE /participantes/:id |
| Grupos     | CRUD grupos, participantes, duplicar, gerar-link, link, **PUT /grupos/:id/status** (adicionado) |
| Despesas   | CRUD despesas, participacoes, recalcular |
| Relatórios | saldos, saldos-por-grupo, sugestoes-pagamento, sugestoes-pagamento-grupos |
| Pagamentos | **POST /grupos/:id/pagamentos**, **POST /grupos/:id/pagamentos-grupos**, **GET /grupos/:id/pagamentos**, **PUT /pagamentos/:id/confirmar** (adicionado) |
| Grupos maiores | CRUD grupos-maiores, grupos, participantes, recentes |
| Templates  | GET /templates, GET /templates/:id |

---

## 🔧 Configuração

- **API base:** `src/constants/config.ts` – `API_URL` em dev (ex.: `http://SEU_IP:3001/api`) e em produção via `expo.extra.apiUrl`.
- **Google Sign-In:** `webClientId` em `LoginScreen`; só funciona em development build ou produção, não no Expo Go.

---

## Referências

- README.md (raiz do projeto)
- mds/FEATURES.md
- backend: rotas em `backend/src/routes/index.ts`, controllers em `backend/src/controllers/`
