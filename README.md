# Rachid (Racha Contas)

Sistema web para gerenciar e dividir despesas entre grupos de pessoas, calculando automaticamente quanto cada participante deve receber ou pagar.

**Plataformas**: Web (React), Mobile (React Native + Expo), Landing (Astro)

## 🚀 Como Executar

### Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn
- PostgreSQL (para backend)

### Opção A: Docker

```bash
# Criar arquivo .env na raiz (veja mds/ENV_TEMPLATE.md)
docker-compose up -d
```

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:8080`

### Opção B: Desenvolvimento Local

### 1. Instalar dependências do Backend

```bash
cd backend
npm install
```

### 2. Instalar dependências do Frontend

```bash
cd ../frontend
npm install
```

### 3. Executar o Backend

Em um terminal, na pasta `backend`:

```bash
npm run dev
```

O backend estará rodando em `http://localhost:3001`

### 4. Executar o Frontend

Em outro terminal, na pasta `frontend`:

```bash
npm run dev
```

O frontend estará rodando em `http://localhost:3000`

### 5. Acessar a Aplicação

Abra seu navegador em: `http://localhost:3000`

## ✨ Funcionalidades

### Status de Eventos
- Eventos podem ter status: **EM_ABERTO**, **CONCLUIDO** ou **CANCELADO**
- Eventos concluídos/cancelados bloqueiam novas ações (edição, adição de participantes/despesas)
- Conclusão automática quando todos os saldos estão zerados
- Conclusão manual quando todos os pagamentos são confirmados
- Interface visual com badges de status

### Controle de Pagamentos
- Marcar pagamentos individuais como realizados
- Marcar pagamentos entre grupos (famílias, casais) como realizados
- Confirmar recebimento de pagamentos (qualquer participante do grupo credor pode confirmar)
- Sistema baseado em IDs (não nomes) para evitar ambiguidade com nomes duplicados
- Visualização de status de pagamentos (pago, confirmado, pendente)
- Histórico completo de pagamentos

### Sistema de Emails
- Envio automático de emails para notificações e reativação
- Tipos de emails: boas-vindas, recuperação de senha, nova despesa, despesa editada, inclusão em evento, mudança de saldo, evento finalizado, e emails de reativação
- Envio assíncrono via fila (não bloqueia a aplicação)
- Log completo de todos os emails enviados
- Controle de opt-out: usuários podem optar por não receber emails
- Emails de reativação automáticos para usuários/eventos inativos
- Testes de emails disponíveis em desenvolvimento

### Página Inicial (Home)
- Explicação clara sobre o que é o Racha Contas
- Guia de como usar o sistema
- Acesso rápido para começar ou fazer login

### Cadastro e Autenticação
- Cadastro simplificado com nome, email (obrigatórios) e telefone opcional
- Login seguro com autenticação por cookies
- Redirecionamento automático após cadastro para criar primeiro evento

### Fluxo Guiado de Criação de Eventos
O sistema agora oferece um fluxo intuitivo e guiado:

1. **Criar Evento**: Nome e data do evento
   - Sugestão automática de grupos maiores salvos
   - Opção de criar evento do zero

2. **Adicionar Participantes**: Interface simplificada para adicionar pessoas
   - Busca rápida de participantes existentes
   - Adicionar por grupo (ex: "Família Antony")
   - Criar novos participantes rapidamente
   - Criar novos grupos durante o processo
   - Suporte a grupos maiores (ex: "Grupo de Basquete" que contém várias famílias)

3. **Cadastrar Despesas**: Registrar gastos do evento
   - Botão rápido para adicionar participante esquecido
   - Definir quem pagou cada despesa
   - Filtrar por evento

4. **Totais por Grupo**: Visualização e ajuste de participações
   - Por padrão, assume que todos consumiram tudo
   - Interface com checkboxes para desmarcar participações específicas
   - Cálculo automático de saldos
   - Salvar automaticamente ao desmarcar

### Participantes
- Cadastrar, editar e excluir participantes
- Cada participante pode ter nome e email (opcional)
- Adição rápida durante o cadastro de despesas

### Eventos
- Criar eventos (ex: "Churrasco dia 12/11")
- Associar participantes aos eventos
- Visualizar histórico de eventos
- Fluxo guiado para criação rápida

### Despesas
- Cadastrar despesas com valor total
- Definir quem pagou a despesa
- Selecionar quais participantes devem dividir (não precisa ser todos)
- Divisão automática igual ou valores personalizados por pessoa
- Adicionar participantes esquecidos rapidamente
- **Anexos** (cupons, recibos): upload de imagens/PDFs, armazenamento em S3/CloudFront (plano PRO)

### Planos e Assinaturas
- Planos FREE, PRO e LIFETIME
- Checkout via PayPal (mensal/anual) ou Asaas (PIX/boleto)
- Limites configuráveis por plano (eventos, participantes, anexos, etc.)
- Painel admin para gerenciar assinaturas e limites

### Grupos Maiores
- Criar grupos que contêm outros grupos ou participantes
- Exemplos: "Grupo de Basquete" (contém várias famílias), "Pais da Escola" (contém famílias)
- Reutilizar grupos maiores ao criar novos eventos
- Facilitar organização de eventos recorrentes

### Relatórios
- Cálculo automático de saldos: quem deve receber/pagar quanto
- Visualização de resumo por grupo/família
- Sugestão de pagamentos otimizados (quem deve pagar para quem, com mínimo de transações)
- Visualização de status de pagamentos (pago, confirmado, pendente)
- Histórico completo de pagamentos realizados
- **Gráficos**: área, barras, pizza, linhas para visualização de dados

### Compartilhamento
- Gerar mensagem formatada para **WhatsApp** com resumo, saldos e sugestões de pagamento
- Incluir chaves PIX dos participantes na mensagem
- Compartilhar via WhatsApp, email ou link público

## 📖 Exemplo de Uso

### Fluxo Completo (Novo)

1. **Acesse a Home**: Veja explicações sobre o sistema
2. **Cadastre-se**: Crie sua conta com nome, email e senha
3. **Crie um Evento**: 
   - Dê um nome (ex: "Churrasco dia 12/11")
   - Escolha a data
   - Opcionalmente, use um grupo maior salvo
4. **Adicione Participantes**:
   - Busque participantes existentes ou crie novos
   - Use grupos salvos (ex: "Família Antony")
   - Crie novos grupos durante o processo
5. **Cadastre as Despesas**: 
   - Registre cada gasto
   - Defina quem pagou
   - Adicione participantes esquecidos se necessário
6. **Veja os Totais**: 
   - O sistema assume que todos consumiram tudo
   - Desmarque as participações que não se aplicam
   - Veja os saldos calculados automaticamente

### Fluxo Tradicional (Ainda Disponível)

1. **Cadastre os participantes**: Vá em "Participantes" e cadastre todas as pessoas
2. **Crie um evento**: Vá em "Eventos" e crie um evento (ex: "Churrasco dia 12/11")
3. **Adicione participantes ao evento**: Ao criar/editar o evento, selecione os participantes
4. **Cadastre as despesas**: 
   - Vá em "Despesas"
   - Crie uma despesa (ex: "Chopp")
   - Selecione o evento relacionado
   - Defina quem pagou
   - Selecione apenas os participantes que consumiram (não precisa ser todos do evento)
   - Divida o valor igualmente ou defina valores personalizados
5. **Veja os relatórios**: Vá em "Relatórios", selecione o evento e veja quem deve receber/pagar quanto

## 🗄️ Banco de Dados

O sistema usa PostgreSQL. O banco será criado automaticamente na primeira execução se o TypeORM estiver configurado com `synchronize: true`.

**Importante**: Certifique-se de ter um banco PostgreSQL configurado. As variáveis de ambiente devem estar configuradas no arquivo `.env` do backend:

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=racha_contas
```

## 🛠️ Tecnologias

- **Backend**: Node.js + Express + TypeScript + TypeORM + PostgreSQL
- **Frontend**: React + TypeScript + Vite
- **Mobile**: React Native + Expo
- **Landing**: Astro (marketing)
- **Interface**: HTML/CSS puro (sem frameworks CSS)
- **Emails**: SendGrid (com fallback para log em desenvolvimento)
- **Fila de Jobs**: pg-boss (para processamento assíncrono de emails)
- **Storage**: AWS S3 + CloudFront (anexos de despesas)
- **Pagamentos**: PayPal (assinaturas) e Asaas (PIX/boleto)

## 📁 Estrutura do Projeto

```
Rachid/
├── backend/           # API Node.js + Express + TypeORM
│   ├── src/
│   │   ├── entities/          # Entidades do banco
│   │   ├── controllers/       # Controladores das rotas
│   │   ├── services/          # Lógica de negócio
│   │   ├── routes/            # Definição de rotas
│   │   ├── database/          # Configuração do banco
│   │   └── middleware/        # Auth, rate limit, feature limits
│   └── package.json
├── frontend/          # Web app React + Vite
│   ├── src/
│   │   ├── components/        # Componentes React (ShareButtons, graficos, etc.)
│   │   ├── pages/             # Páginas principais
│   │   ├── services/          # APIs do frontend
│   │   ├── types/             # Tipos TypeScript
│   │   ├── contexts/          # Contextos React (Auth)
│   │   └── utils/             # whatsappFormatter, plan
│   └── package.json
├── mobile/            # App React Native + Expo
├── landing/           # Landing page Astro (marketing)
├── mds/               # Documentação adicional
├── docker-compose.yml # Deploy local com Docker
└── README.md
```

## 📝 Scripts Disponíveis

### Backend
- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm run build` - Compila o TypeScript
- `npm start` - Inicia o servidor compilado

### Frontend
- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila para produção
- `npm run preview` - Pré-visualiza a build de produção

## 🎯 Principais Melhorias

### Interface Simplificada
- Fluxo guiado desde o cadastro até a visualização dos totais
- Mensagens de ajuda contextuais
- Validações claras e feedback imediato
- Botões grandes e fáceis de clicar

### Grupos Aninhados
- Sistema de grupos maiores para organizar melhor
- Reutilização de grupos em eventos recorrentes
- Facilita adicionar múltiplos participantes de uma vez

### Consumo Padrão
- Sistema assume que todos consumiram tudo por padrão
- Interface simples para desmarcar exceções
- Economiza tempo na configuração inicial

### Adição Rápida
- Criar participantes rapidamente durante o cadastro de despesas
- Criar grupos durante a adição de participantes ao evento
- Fluxo mais fluido e menos interrupções

## 🔐 Segurança

- Autenticação por cookies HTTP-only
- Senhas criptografadas com bcrypt
- Validação de dados no backend
- Proteção de rotas no frontend
- Controle de opt-out de emails (independente do SendGrid)
- Log completo de emails enviados para auditoria
- Matching de pagamentos baseado em IDs (não nomes) para segurança

## 📧 Sistema de Emails

### Configuração

O sistema utiliza SendGrid para envio de emails. Configure as variáveis de ambiente no backend:

```env
SENDGRID_API_KEY=sua-api-key-aqui
SENDGRID_FROM_EMAIL=noreply@seu-dominio.com
SENDGRID_FROM_NAME=Rachid
FRONTEND_URL=http://localhost:3000
```

> **Nota**: O Vite usa porta 5173 por padrão em dev; ajuste conforme sua configuração.

### Tipos de Emails

O sistema envia automaticamente os seguintes emails:

1. **Boas-vindas**: Quando um novo usuário se cadastra
2. **Recuperação de senha**: Quando o usuário solicita reset de senha
3. **Nova despesa**: Quando uma nova despesa é criada em um evento
4. **Despesa editada**: Quando uma despesa é alterada
5. **Inclusão em evento**: Quando um participante é adicionado a um evento
6. **Evento finalizado**: Quando um evento é marcado como concluído
7. **Reativação**: Emails automáticos para usuários/eventos inativos

### Preferências de Email

Usuários podem gerenciar suas preferências de email através da API:

- `GET /api/auth/email-preferences` - Ver preferências
- `PUT /api/auth/email-preferences` - Atualizar preferências (opt-in/opt-out)

### Testes de Email (Desenvolvimento)

Em ambiente de desenvolvimento, você pode testar os emails usando os endpoints:

- `GET /api/test/email/tipos` - Listar tipos disponíveis
- `POST /api/test/email/[tipo]` - Enviar email de teste

Veja `backend/TEST_EMAILS.md` para documentação completa e exemplos.

## 💳 Controle de Pagamentos

### Funcionalidades

- **Marcar como pago**: Qualquer participante pode marcar um pagamento como realizado
- **Confirmar recebimento**: Qualquer participante do grupo credor pode confirmar o recebimento
- **Status visual**: Interface mostra claramente quais pagamentos foram realizados e confirmados
- **Baseado em IDs**: Sistema usa IDs (não nomes) para matching, evitando problemas com nomes duplicados
- **Histórico completo**: Todos os pagamentos são registrados para auditoria

### Tipos de Pagamento

1. **INDIVIDUAL**: Entre participantes individuais
2. **ENTRE_GRUPOS**: Entre grupos (famílias, casais, etc.)

## 📊 Status de Eventos

Os eventos podem ter os seguintes status:

- **EM_ABERTO**: Evento ativo, permitindo todas as operações
- **CONCLUIDO**: Evento finalizado (todos os saldos zerados e/ou pagamentos confirmados)
- **CANCELADO**: Evento cancelado, bloqueando todas as ações

Eventos concluídos ou cancelados não permitem:
- Edição de participantes
- Adição/edição de despesas
- Novos pagamentos

## 📄 Licença

Este projeto é de código aberto e está disponível para uso livre.
