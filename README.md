# Racha Contas

Sistema web para gerenciar e dividir despesas entre grupos de pessoas, calculando automaticamente quanto cada participante deve receber ou pagar.

## 🚀 Como Executar

### Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn

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

### Grupos Maiores
- Criar grupos que contêm outros grupos ou participantes
- Exemplos: "Grupo de Basquete" (contém várias famílias), "Pais da Escola" (contém famílias)
- Reutilizar grupos maiores ao criar novos eventos
- Facilitar organização de eventos recorrentes

### Relatórios
- Cálculo automático de saldos: quem deve receber/pagar quanto
- Visualização de resumo por grupo/família
- Sugestão de pagamentos otimizados (quem deve pagar para quem, com mínimo de transações)

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
- **Interface**: HTML/CSS puro (sem frameworks CSS)

## 📁 Estrutura do Projeto

```
racha-contas/
├── backend/
│   ├── src/
│   │   ├── entities/          # Entidades do banco
│   │   ├── controllers/       # Controladores das rotas
│   │   ├── services/          # Lógica de negócio
│   │   ├── routes/            # Definição de rotas
│   │   ├── database/          # Configuração do banco
│   │   └── scripts/           # Scripts de migração
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   ├── pages/             # Páginas principais
│   │   ├── services/          # APIs do frontend
│   │   ├── types/             # Tipos TypeScript
│   │   └── contexts/          # Contextos React (Auth)
│   └── package.json
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

## 📄 Licença

Este projeto é de código aberto e está disponível para uso livre.
