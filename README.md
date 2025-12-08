# Racha Contas

Sistema web para gerenciar e dividir despesas entre grupos de pessoas, calculando automaticamente quanto cada participante deve receber ou pagar.

## ?? Como Executar

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

## ?? Funcionalidades

### Participantes
- Cadastrar, editar e excluir participantes
- Cada participante pode ter nome e email (opcional)

### Eventos
- Criar eventos (ex: "Churrasco dia 12/11")
- Associar participantes aos eventos
- Visualizar histórico de eventos

### Despesas
- Cadastrar despesas com valor total
- Definir quem pagou a despesa
- Selecionar quais participantes devem dividir (não precisa ser todos)
- Divisão automática igual ou valores personalizados por pessoa

### Relatórios
- Cálculo automático de saldos: quem deve receber/pagar quanto
- Visualização de resumo por grupo
- Sugestão de pagamentos otimizados (quem deve pagar para quem, com mínimo de transações)

## ?? Exemplo de Uso

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

## ??? Banco de Dados

O sistema usa SQLite. O banco será criado automaticamente na pasta `backend` com o nome `database.sqlite` na primeira execução.

## ??? Tecnologias

- **Backend**: Node.js + Express + TypeScript + TypeORM + SQLite
- **Frontend**: React + TypeScript + Vite
- **Interface**: HTML/CSS puro (sem frameworks CSS)

## ?? Estrutura do Projeto

```
racha-contas/
??? backend/
?   ??? src/
?   ?   ??? entities/          # Entidades do banco
?   ?   ??? controllers/       # Controladores das rotas
?   ?   ??? services/          # Lógica de negócio
?   ?   ??? routes/            # Definição de rotas
?   ?   ??? database/          # Configuração do banco
?   ??? package.json
??? frontend/
?   ??? src/
?   ?   ??? components/        # Componentes React
?   ?   ??? pages/             # Páginas principais
?   ?   ??? services/          # APIs do frontend
?   ?   ??? types/             # Tipos TypeScript
?   ??? package.json
??? README.md
```

## ?? Scripts Disponíveis

### Backend
- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm run build` - Compila o TypeScript
- `npm start` - Inicia o servidor compilado

### Frontend
- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila para produção
- `npm run preview` - Pré-visualiza a build de produção

