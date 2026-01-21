# Funcionalidades do Sistema Rachid

## 📱 Plataformas

- **Web**: React + Vite (Frontend)
- **Mobile**: React Native + Expo (Mobile)
- **Backend**: Node.js + Express + TypeORM
- **Banco de Dados**: PostgreSQL (Supabase)

---

## 🔐 Autenticação e Usuários

### Autenticação
- ✅ Login com email e senha
- ✅ Login com Google OAuth
- ✅ Logout
- ✅ Criação de conta (cadastro)
- ✅ Recuperação de senha
- ✅ Redefinição de senha com token
- ✅ Validação de token de recuperação
- ✅ Verificação de usuário autenticado (`/auth/me`)
- ✅ Autenticação via JWT (token)
- ✅ Cookies HTTP-only para segurança
- ✅ Suporte a planos (FREE/PRO)
- ✅ Vinculação automática de contas Google existentes por email

### Perfil de Usuário
- ✅ Visualizar informações do usuário
- ✅ Gerenciar dados pessoais (nome, email, telefone)
- ✅ Gerenciar preferências de email (opt-in/opt-out)
- ✅ Visualizar histórico de opt-out de emails

---

## 👥 Participantes

### Gerenciamento de Participantes
- ✅ Listar todos os participantes
- ✅ Visualizar participante por ID
- ✅ Criar novo participante
- ✅ Editar participante
- ✅ Excluir participante

### Dados do Participante
- ✅ Nome
- ✅ Email (opcional)
- ✅ Chave PIX (opcional)
- ✅ Telefone (opcional)
- ✅ Vinculação com usuário

---

## 📦 Grupos

### Gerenciamento de Grupos
- ✅ Listar todos os grupos do usuário
- ✅ Visualizar grupo por ID
- ✅ Criar novo grupo
- ✅ Criar grupo a partir de template
- ✅ Editar grupo (nome, descrição, data)
- ✅ Excluir grupo
- ✅ Duplicar grupo
- ✅ Gerar link de compartilhamento público
- ✅ Obter link de compartilhamento existente

### Participantes em Grupos
- ✅ Adicionar participante ao grupo
- ✅ Remover participante do grupo
- ✅ Visualizar participantes de um grupo

### Dados do Grupo
- ✅ Nome
- ✅ Descrição (opcional)
- ✅ Data do evento
- ✅ Vinculação com usuário
- ✅ Status do evento (EM_ABERTO, CONCLUIDO, CANCELADO)
- ✅ Link de compartilhamento público (shareToken)

---

## 💰 Despesas

### Gerenciamento de Despesas
- ✅ Listar todas as despesas
- ✅ Listar despesas por grupo
- ✅ Visualizar despesa por ID
- ✅ Criar nova despesa
- ✅ Editar despesa
- ✅ Excluir despesa

### Dados da Despesa
- ✅ Descrição
- ✅ Valor total
- ✅ Participante pagador
- ✅ Grupo vinculado
- ✅ Data da despesa
- ✅ Participações (quem deve pagar quanto)

### Participações em Despesas
- ✅ Adicionar/remover participação (toggle)
- ✅ Recalcular valores das participações
- ✅ Distribuição automática de valores
- ✅ Valor individual por participante

---

## 📊 Relatórios e Cálculos

### Saldos
- ✅ Saldos por participante em um grupo
- ✅ Saldos por grupo (quando há grupos dentro de eventos)
- ✅ Visualização de quem deve e quem deve receber

### Sugestões de Pagamento
- ✅ Sugestões de pagamento entre participantes
- ✅ Sugestões de pagamento entre grupos
- ✅ Otimização de transferências (menor número de pagamentos)

### Controle de Pagamentos
- ✅ Marcar pagamento individual como realizado
- ✅ Marcar pagamento entre grupos como realizado
- ✅ Confirmar recebimento de pagamento (credor confirma)
- ✅ Verificar se todos os pagamentos foram realizados
- ✅ Status de pagamento por sugestão (pago, confirmado, pendente)
- ✅ Matching baseado em IDs (não nomes) para evitar ambiguidade
- ✅ Histórico completo de pagamentos realizados

---

## 💳 Sistema de Pagamentos

### Controle de Pagamentos
- ✅ Marcar pagamento individual como realizado
- ✅ Marcar pagamento entre grupos (famílias, casais) como realizado
- ✅ Confirmar recebimento de pagamento (qualquer participante do grupo credor pode confirmar)
- ✅ Verificar se todos os pagamentos foram realizados
- ✅ Status de pagamento por sugestão (pago, confirmado, pendente)
- ✅ Matching baseado em IDs (não nomes) para evitar ambiguidade com nomes duplicados
- ✅ Histórico completo de pagamentos realizados
- ✅ Tipos de pagamento: INDIVIDUAL (entre participantes) e ENTRE_GRUPOS (entre famílias/casais)

### Funcionalidades
- ✅ Validação de IDs antes de marcar como pago (evita erros de matching)
- ✅ Verificação automática de conclusão de evento quando todos os pagamentos são confirmados
- ✅ Ações desabilitadas para eventos CONCLUIDOS ou CANCELADOS
- ✅ Interface para visualizar status de pagamentos e ações disponíveis

---

## 📧 Sistema de Emails

### Tipos de Emails
- ✅ Boas-vindas (novo usuário)
- ✅ Boas-vindas Google (login via Google)
- ✅ Recuperação de senha
- ✅ Senha alterada
- ✅ Nova despesa
- ✅ Despesa editada
- ✅ Inclusão em evento
- ✅ Participante adicionado a despesa
- ✅ Mudança de saldo
- ✅ Evento finalizado
- ✅ Reativação sem evento (usuário cadastrado mas não criou evento)
- ✅ Reativação sem participantes (evento criado mas sem participantes)
- ✅ Reativação sem despesas (evento com participantes mas sem despesas)

### Funcionalidades de Email
- ✅ Envio assíncrono via fila (pg-boss)
- ✅ Retry automático em caso de falha
- ✅ Log completo de todos os emails enviados na tabela `emails`
- ✅ Controle de opt-out independente do SendGrid
- ✅ Verificação de opt-out antes de enviar qualquer email
- ✅ Status de envio: pendente, enviando, enviado, falhou, cancelado
- ✅ Registro de erros e metadados do SendGrid
- ✅ Tracking de tentativas de envio

### Emails de Reativação
- ✅ Job diário agendado verifica usuários/eventos inativos
- ✅ Envio automático de emails de reativação
- ✅ Prevenção de emails duplicados (tracking de última data de envio)
- ✅ Configurável via cron (padrão: 09:00 BRT diariamente)

### Preferências de Email
- ✅ Usuários podem optar por não receber emails (opt-out)
- ✅ Data e motivo do opt-out registrados
- ✅ Endpoint para visualizar preferências
- ✅ Endpoint para atualizar preferências (opt-in/opt-out)
- ✅ Verificação automática antes de cada envio

### Testes de Email (Desenvolvimento + ADMIN)
- ✅ Endpoints dedicados para testar todos os tipos de emails
- ✅ Apenas disponíveis em ambiente de desenvolvimento (NODE_ENV !== 'production')
- ✅ Requer autenticação ADMIN (role = 'ADMIN')
- ✅ Documentação completa com exemplos
- ✅ Arquivo `.http` com exemplos prontos para uso
- ✅ Proteção via middleware `requireAdmin`

---

## 📊 Status de Eventos

### Status Disponíveis
- ✅ **EM_ABERTO**: Evento ativo, permitindo todas as operações
- ✅ **CONCLUIDO**: Evento finalizado (matematicamente ou manualmente), bloqueando novas ações
- ✅ **CANCELADO**: Evento cancelado, bloqueando todas as ações

### Conclusão de Eventos
- ✅ Conclusão matemática: todos os saldos estão zerados
- ✅ Conclusão manual: todos os pagamentos foram marcados e confirmados
- ✅ Verificação híbrida: combina verificação matemática e manual
- ✅ Marcação manual de evento como concluído
- ✅ Interface desabilita ações para eventos concluídos/cancelados

---

## 🎯 Grupos de Participantes (Eventos)

### Gerenciamento de Grupos de Participantes
- ✅ Listar grupos de participantes de um evento
- ✅ Visualizar grupo de participantes por ID
- ✅ Criar novo grupo de participantes
- ✅ Editar grupo de participantes
- ✅ Excluir grupo de participantes

### Participantes em Grupos de Evento
- ✅ Adicionar participante ao grupo de evento
- ✅ Remover participante do grupo de evento

### Uso
- ✅ Organizar participantes em subgrupos dentro de um evento
- ✅ Gerenciar múltiplos grupos dentro de um mesmo evento

---

## 🏢 Grupos Maiores

### Gerenciamento de Grupos Maiores
- ✅ Listar todos os grupos maiores
- ✅ Listar grupos maiores recentes
- ✅ Visualizar grupo maior por ID
- ✅ Criar novo grupo maior
- ✅ Editar grupo maior
- ✅ Excluir grupo maior

### Conteúdo de Grupos Maiores
- ✅ Adicionar grupo ao grupo maior
- ✅ Remover grupo do grupo maior
- ✅ Adicionar participante ao grupo maior
- ✅ Remover participante do grupo maior
- ✅ Obter todos os participantes de um grupo maior

### Uso
- ✅ Agrupar múltiplos grupos relacionados
- ✅ Gerenciar eventos maiores com vários grupos
- ✅ Organização hierárquica de eventos

---

## 📋 Templates de Eventos

### Gerenciamento de Templates
- ✅ Listar todos os templates disponíveis
- ✅ Visualizar template por ID
- ✅ Criar evento a partir de template
- ✅ Templates pré-configurados com despesas comuns

### Funcionalidades
- ✅ Templates incluem nome, descrição e lista de despesas
- ✅ Criação de eventos com despesas placeholder a partir de templates
- ✅ Personalização de nome e descrição ao usar template

---

## 🌐 Eventos Públicos e Compartilhamento

### Compartilhamento de Eventos
- ✅ Geração de token único para compartilhamento
- ✅ Link público para visualização de eventos
- ✅ Visualização de eventos sem necessidade de login
- ✅ Visualização de saldos e sugestões de pagamento em eventos públicos
- ✅ Visualização de despesas em eventos públicos

### Reivindicação de Participação
- ✅ Reivindicar participação em evento público via email
- ✅ Transferência automática de participantes ao criar conta
- ✅ Vinculação de participantes existentes ao usuário

### Dados Acessíveis Publicamente
- ✅ Informações do evento (nome, descrição, data)
- ✅ Lista de participantes
- ✅ Saldos calculados
- ✅ Sugestões de pagamento
- ✅ Lista de despesas

---

## 📈 Analytics

### Rastreamento de Eventos
- ✅ Tracking de eventos customizados
- ✅ Propriedades personalizadas por evento
- ✅ Autenticação necessária para analytics

---

## 🔧 Funcionalidades Técnicas

### API
- ✅ RESTful API
- ✅ Autenticação JWT
- ✅ Middleware de autenticação
- ✅ Validação de dados
- ✅ Tratamento de erros
- ✅ CORS configurado
- ✅ Health checks (`/health`, `/health/db`)

### Banco de Dados
- ✅ PostgreSQL com TypeORM
- ✅ Migrations (preparado)
- ✅ Relacionamentos entre entidades
- ✅ Índices para performance
- ✅ Constraints e validações

### Segurança
- ✅ Senhas hasheadas (bcrypt)
- ✅ Tokens JWT seguros
- ✅ Cookies HTTP-only
- ✅ CORS configurado
- ✅ Validação de entrada
- ✅ Proteção contra SQL injection (TypeORM)

---

## 📱 Interface do Usuário (Frontend)

### Páginas Principais
- ✅ Login
- ✅ Cadastro
- ✅ Dashboard/Home
- ✅ Participantes
- ✅ Grupos (Meus eventos)
- ✅ Novo Evento
- ✅ Adicionar Participantes ao Evento
- ✅ Despesas
- ✅ Participações
- ✅ Totais por Grupos
- ✅ Grupos Maiores
- ✅ Relatórios
- ✅ Conta (Perfil do usuário)
- ✅ Ajuda (Guia de uso)
- ✅ Convidar Amigos
- ✅ Evento Público (visualização sem login)

### Funcionalidades de UI
- ✅ Formatação de valores monetários
- ✅ Formatação para WhatsApp
- ✅ Exportação de dados (PDF)
- ✅ Navegação entre páginas
- ✅ Modais para ações
- ✅ Formulários validados
- ✅ Feedback visual (loading, erros)

---

## 🔄 Fluxos Principais

### 1. Criação de Evento Completo
1. Criar grupo
2. Adicionar participantes ao grupo
3. Criar despesas
4. Definir participações nas despesas
5. Visualizar saldos e sugestões de pagamento

### 2. Gerenciamento de Participantes
1. Criar participantes
2. Adicionar informações (PIX, telefone)
3. Associar participantes a grupos
4. Gerenciar participantes em múltiplos grupos

### 3. Cálculo de Contas
1. Registrar despesas
2. Definir quem participa de cada despesa
3. Sistema calcula valores automaticamente
4. Visualizar saldos finais
5. Obter sugestões de pagamento

### 4. Eventos Complexos
1. Criar grupo maior
2. Adicionar múltiplos grupos
3. Adicionar participantes diretamente ao grupo maior
4. Gerenciar tudo de forma hierárquica

---

## 📋 Endpoints da API

### Autenticação (Públicas)
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Login com Google OAuth
- `POST /api/auth/logout` - Logout
- `POST /api/auth/create-user` - Criar conta
- `POST /api/auth/solicitar-recuperacao-senha` - Solicitar recuperação
- `POST /api/auth/validar-token-recuperacao` - Validar token
- `POST /api/auth/resetar-senha` - Redefinir senha

### Autenticação (Protegidas)
- `GET /api/auth/me` - Obter usuário atual
- `PUT /api/auth/me` - Atualizar dados do usuário
- `GET /api/auth/email-preferences` - Obter preferências de email
- `PUT /api/auth/email-preferences` - Atualizar preferências de email (opt-in/opt-out)

### Participantes (Protegidas)
- `GET /api/participantes` - Listar todos
- `GET /api/participantes/:id` - Obter por ID
- `POST /api/participantes` - Criar
- `PUT /api/participantes/:id` - Atualizar
- `DELETE /api/participantes/:id` - Excluir

### Grupos (Protegidas)
- `GET /api/grupos` - Listar todos
- `GET /api/grupos/:id` - Obter por ID
- `POST /api/grupos` - Criar (suporta `templateId` para criar a partir de template)
- `PUT /api/grupos/:id` - Atualizar
- `DELETE /api/grupos/:id` - Excluir
- `POST /api/grupos/:id/duplicar` - Duplicar
- `POST /api/grupos/:id/participantes` - Adicionar participante
- `DELETE /api/grupos/:id/participantes` - Remover participante
- `POST /api/grupos/:id/gerar-link` - Gerar link de compartilhamento
- `GET /api/grupos/:id/link` - Obter link de compartilhamento existente
- `PUT /api/grupos/:id/status` - Atualizar status do evento (EM_ABERTO, CONCLUIDO, CANCELADO)

### Despesas (Protegidas)
- `GET /api/despesas` - Listar todas (opcional: ?grupoId=X)
- `GET /api/despesas/:id` - Obter por ID
- `POST /api/despesas` - Criar
- `PUT /api/despesas/:id` - Atualizar
- `DELETE /api/despesas/:id` - Excluir

### Participações (Protegidas)
- `POST /api/despesas/:despesaId/participacoes` - Toggle participação
- `POST /api/despesas/:despesaId/recalcular` - Recalcular valores

### Relatórios (Protegidas)
- `GET /api/grupos/:id/saldos` - Saldos por participante
- `GET /api/grupos/:id/saldos-por-grupo` - Saldos por grupo
- `GET /api/grupos/:id/sugestoes-pagamento` - Sugestões entre participantes
- `GET /api/grupos/:id/sugestoes-pagamento-grupos` - Sugestões entre grupos

### Pagamentos (Protegidas)
- `POST /api/grupos/:id/pagamentos` - Marcar pagamento individual como pago
- `POST /api/grupos/:id/pagamentos-grupos` - Marcar pagamento entre grupos como pago
- `PUT /api/pagamentos/:id/confirmar` - Confirmar recebimento de pagamento
- `GET /api/grupos/:id/pagamentos` - Listar pagamentos do evento

### Grupos de Participantes/Eventos (Protegidas)
- `GET /api/grupos/:eventoId/grupos-participantes` - Listar todos
- `GET /api/grupos/:eventoId/grupos-participantes/:id` - Obter por ID
- `POST /api/grupos/:eventoId/grupos-participantes` - Criar
- `PUT /api/grupos/:eventoId/grupos-participantes/:id` - Atualizar
- `DELETE /api/grupos/:eventoId/grupos-participantes/:id` - Excluir
- `POST /api/grupos/:eventoId/grupos-participantes/:grupoId/participantes` - Adicionar participante
- `DELETE /api/grupos/:eventoId/grupos-participantes/:grupoId/participantes/:participanteId` - Remover participante

### Grupos Maiores (Protegidas)
- `GET /api/grupos-maiores` - Listar todos
- `GET /api/grupos-maiores/recentes` - Listar recentes
- `GET /api/grupos-maiores/:id` - Obter por ID
- `POST /api/grupos-maiores` - Criar
- `PUT /api/grupos-maiores/:id` - Atualizar
- `DELETE /api/grupos-maiores/:id` - Excluir
- `POST /api/grupos-maiores/:id/grupos` - Adicionar grupo
- `DELETE /api/grupos-maiores/:id/grupos` - Remover grupo
- `POST /api/grupos-maiores/:id/participantes` - Adicionar participante
- `DELETE /api/grupos-maiores/:id/participantes/:participanteId` - Remover participante
- `GET /api/grupos-maiores/:id/participantes` - Obter todos participantes

### Analytics (Protegidas)
- `POST /api/analytics/event` - Rastrear evento

### Templates (Públicas)
- `GET /api/templates` - Listar todos os templates
- `GET /api/templates/:id` - Obter template por ID

### Eventos Públicos (Públicas)
- `GET /api/public/eventos/:token` - Obter evento por token
- `GET /api/public/eventos/:token/saldos` - Obter saldos do evento
- `GET /api/public/eventos/:token/saldos-por-grupo` - Obter saldos por grupo
- `GET /api/public/eventos/:token/sugestoes` - Obter sugestões de pagamento
- `GET /api/public/eventos/:token/despesas` - Obter despesas do evento

### Eventos Públicos (Protegidas)
- `POST /api/public/eventos/:token/reivindicar` - Reivindicar participação no evento

### Health Checks (Públicas)
- `GET /api/health` - Health check básico
- `GET /api/health/db` - Health check com verificação de banco

### Testes de Email (Desenvolvimento + ADMIN)
- `GET /api/test/email/tipos` - Listar tipos de emails disponíveis (requer ADMIN)
- `POST /api/test/email/boas-vindas` - Testar email de boas-vindas (requer ADMIN)
- `POST /api/test/email/nova-despesa` - Testar email de nova despesa (requer ADMIN)
- `POST /api/test/email/despesa-editada` - Testar email de despesa editada (requer ADMIN)
- `POST /api/test/email/inclusao-evento` - Testar email de inclusão em evento (requer ADMIN)
- `POST /api/test/email/reativacao-sem-evento` - Testar email de reativação sem evento (requer ADMIN)
- `POST /api/test/email/reativacao-sem-participantes` - Testar email de reativação sem participantes (requer ADMIN)
- `POST /api/test/email/reativacao-sem-despesas` - Testar email de reativação sem despesas (requer ADMIN)

**Notas:**
- Todos os endpoints de teste requerem autenticação ADMIN
- Apenas disponíveis em desenvolvimento (NODE_ENV !== 'production')
- Veja `backend/TEST_EMAILS.md` para documentação completa

---

## 🎨 Funcionalidades de Interface

### Formatação
- ✅ Formatação de valores monetários (R$)
- ✅ Formatação para compartilhamento no WhatsApp
- ✅ Formatação de telefones
- ✅ Formatação de datas

### Exportação
- ✅ Exportação de relatórios em PDF
- ✅ Geração de tabelas formatadas
- ✅ Compartilhamento via WhatsApp

### UX
- ✅ Loading states
- ✅ Error handling
- ✅ Validação de formulários
- ✅ Feedback visual
- ✅ Navegação intuitiva
- ✅ Responsive design

---

## 🔒 Segurança

- ✅ Autenticação JWT
- ✅ Senhas hasheadas (bcrypt, salt rounds: 10)
- ✅ Cookies HTTP-only
- ✅ CORS configurado
- ✅ Validação de entrada
- ✅ Proteção contra SQL injection
- ✅ Tokens de recuperação de senha com expiração
- ✅ Middleware de autenticação em rotas protegidas

---

## 📊 Estrutura de Dados

### Entidades Principais
- **Usuario**: Usuários do sistema (suporta Google OAuth via `google_id` e `auth_provider`, inclui controle de opt-out de emails)
- **Participante**: Pessoas que participam dos eventos
- **Grupo**: Grupos de despesas (eventos) (inclui `shareToken` para compartilhamento público, status: EM_ABERTO, CONCLUIDO, CANCELADO)
- **Despesa**: Despesas registradas (inclui histórico de alterações em `DespesaHistorico`)
- **ParticipacaoDespesa**: Participações em despesas
- **ParticipanteGrupo**: Relação participantes-grupos
- **GrupoParticipantesEvento**: Grupos de participantes dentro de eventos
- **ParticipanteGrupoEvento**: Participantes em grupos de evento
- **GrupoMaior**: Agrupamento de múltiplos grupos
- **GrupoMaiorGrupo**: Relação grupos maiores-grupos
- **GrupoMaiorParticipante**: Relação grupos maiores-participantes
- **PasswordResetToken**: Tokens de recuperação de senha
- **Pagamento**: Registro de pagamentos realizados (individuais e entre grupos, com confirmação)
- **Email**: Log completo de todos os emails enviados pelo sistema (status, erros, metadados)
- **DespesaHistorico**: Histórico de alterações em despesas para auditoria

---

## 🚀 Deploy e Infraestrutura

### Produção
- ✅ Frontend: Vercel
- ✅ Backend: Railway
- ✅ Banco: Supabase (PostgreSQL)
- ✅ Domínio: orachid.com.br
- ✅ API: api.orachid.com.br
- ✅ SSL/HTTPS automático
- ✅ Deploy automático via GitHub

---

## 📝 Notas

- Todas as rotas protegidas requerem autenticação via JWT
- O sistema suporta múltiplos usuários (cada usuário vê apenas seus dados)
- Cálculos de saldos são feitos automaticamente
- Sugestões de pagamento otimizam o número de transferências
- Suporte a planos FREE e PRO (estrutura preparada)
- Eventos públicos podem ser visualizados sem autenticação através de token único
- Templates permitem criar eventos rapidamente com despesas pré-configuradas
- Google OAuth vincula automaticamente contas existentes por email
- Consumo por padrão: ao criar despesas, todos os participantes são marcados por padrão
- **Status de eventos**: Eventos podem ser marcados como EM_ABERTO, CONCLUIDO ou CANCELADO
- **Controle de pagamentos**: Sistema completo de marcação e confirmação de pagamentos usando IDs (não nomes) para evitar ambiguidade
- **Sistema de emails**: Todos os emails são enviados via fila assíncrona (pg-boss) e registrados na tabela `emails` para auditoria
- **Opt-out de emails**: Usuários podem optar por não receber emails do sistema, e o sistema verifica isso antes de enviar qualquer email
- **Emails de reativação**: Job diário agendado verifica usuários/eventos inativos e envia emails de reativação automaticamente
- **Histórico de despesas**: Todas as alterações em despesas são registradas em `DespesaHistorico` para auditoria
- **Matching por IDs**: Sistema de pagamentos usa IDs (não nomes) para matching, evitando problemas com nomes duplicados

