# Como Testar Emails no Localhost

Com o SendGrid configurado, você pode testar todos os tipos de emails usando os endpoints de teste abaixo.

## ⚠️ Importante

- Estes endpoints **só funcionam em desenvolvimento** (NODE_ENV !== 'production')
- **Requer autenticação**: Você precisa estar logado como usuário ADMIN
- Os emails serão **enviados de verdade** via SendGrid se `SENDGRID_API_KEY` estiver configurado
- Se `SENDGRID_API_KEY` não estiver configurado, os emails serão apenas logados no console
- **Segurança**: Apenas usuários com role `ADMIN` podem acessar estes endpoints

## Endpoints Disponíveis

**Todos os endpoints abaixo requerem:**
- Autenticação (token JWT no header ou cookie)
- Role `ADMIN` do usuário autenticado

### 1. Listar Tipos de Emails

```bash
GET http://localhost:3001/api/test/email/tipos
Authorization: Bearer <seu-token-jwt>
```

Retorna lista de todos os tipos de emails disponíveis para teste.

**Nota:** Se você estiver usando cookies HTTP-only, o token será enviado automaticamente. Para APIs externas (Postman, cURL), inclua o header `Authorization: Bearer <token>`.

### 2. Email de Boas-Vindas

```bash
POST http://localhost:3001/api/test/email/boas-vindas
Content-Type: application/json
Authorization: Bearer <seu-token-jwt>

{
  "email": "teste@example.com",
  "nome": "João Teste"
}
```

### 3. Email de Nova Despesa

```bash
POST http://localhost:3001/api/test/email/nova-despesa
Content-Type: application/json
Authorization: Bearer <seu-token-jwt>

{
  "email": "teste@example.com",
  "nomeDestinatario": "João Teste",
  "eventoNome": "Churrasco de Domingo",
  "eventoId": 1,
  "despesaDescricao": "Carne",
  "despesaValorTotal": 150.00,
  "despesaData": "2024-01-15",
  "valorPorPessoa": 25.00,
  "pagadorNome": "Maria"
}
```

### 4. Email de Despesa Editada

```bash
POST http://localhost:3001/api/test/email/despesa-editada
Content-Type: application/json

{
  "email": "teste@example.com",
  "nomeDestinatario": "João Teste",
  "eventoNome": "Churrasco de Domingo",
  "eventoId": 1,
  "despesaDescricao": "Carne",
  "despesaValorTotal": 180.00,
  "despesaData": "2024-01-15",
  "mudancas": ["Valor alterado de R$ 150,00 para R$ 180,00"]
}
```

### 5. Email de Inclusão em Evento

```bash
POST http://localhost:3001/api/test/email/inclusao-evento
Content-Type: application/json

{
  "email": "teste@example.com",
  "nomeDestinatario": "João Teste",
  "eventoNome": "Churrasco de Domingo",
  "eventoId": 1,
  "eventoDescricao": "Churrasco na casa do João",
  "eventoData": "2024-01-20",
  "adicionadoPor": "Maria"
}
```

### 6. Email de Reativação Sem Evento

```bash
POST http://localhost:3001/api/test/email/reativacao-sem-evento
Content-Type: application/json

{
  "email": "teste@example.com",
  "nomeDestinatario": "João Teste",
  "diasDesdeCadastro": "3"
}
```

### 7. Email de Reativação Sem Participantes

```bash
POST http://localhost:3001/api/test/email/reativacao-sem-participantes
Content-Type: application/json

{
  "email": "teste@example.com",
  "nomeDestinatario": "João Teste",
  "eventoNome": "Churrasco de Domingo",
  "eventoId": 1,
  "diasDesdeCriacao": "2"
}
```

### 8. Email de Reativação Sem Despesas

```bash
POST http://localhost:3001/api/test/email/reativacao-sem-despesas
Content-Type: application/json

{
  "email": "teste@example.com",
  "nomeDestinatario": "João Teste",
  "eventoNome": "Churrasco de Domingo",
  "eventoId": 1,
  "numeroParticipantes": "5",
  "diasDesdeUltimaParticipacao": "3"
}
```

## Exemplo com cURL

```bash
# Email de boas-vindas (substitua <seu-token-jwt> pelo token real)
curl -X POST http://localhost:3001/api/test/email/boas-vindas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu-token-jwt>" \
  -d '{"email": "seu-email@example.com", "nome": "Seu Nome"}'
```

**Como obter o token JWT:**
1. Faça login usando `POST /api/auth/login` ou `POST /api/auth/google`
2. O token será retornado no body da resposta
3. Use este token no header `Authorization: Bearer <token>`

## Exemplo com PowerShell

```powershell
# Email de boas-vindas (substitua <seu-token-jwt> pelo token real)
$token = "<seu-token-jwt>"
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}
$body = @{
    email = "seu-email@example.com"
    nome = "Seu Nome"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/test/email/boas-vindas" `
  -Method POST `
  -Headers $headers `
  -Body $body | ConvertTo-Json
```

## Exemplo com Postman/Insomnia

1. Crie uma nova requisição POST
2. URL: `http://localhost:3001/api/test/email/boas-vindas`
3. Headers: 
   - `Content-Type: application/json`
   - `Authorization: Bearer <seu-token-jwt>` (obtenha o token fazendo login primeiro)
4. Body (JSON): `{"email": "seu-email@example.com", "nome": "Seu Nome"}`
5. Envie a requisição

**Como obter o token:**
1. Faça uma requisição POST para `http://localhost:3001/api/auth/login` com `{"email": "admin@example.com", "senha": "senha123"}`
2. Copie o token do campo `token` na resposta
3. Use este token no header `Authorization: Bearer <token>`

## Notas

- **Autenticação obrigatória**: Você precisa estar logado como usuário ADMIN
- **Produção**: Estes endpoints são automaticamente bloqueados em produção
- Os emails serão enviados para o endereço especificado no campo `email`
- Verifique sua caixa de entrada (e spam) após enviar
- Se `SENDGRID_API_KEY` não estiver configurado, os emails serão apenas logados no console do servidor
- Certifique-se de que `FRONTEND_URL` está configurado corretamente para que os links funcionem
- **Como tornar um usuário ADMIN**: Atualmente, você precisa atualizar o banco de dados diretamente: `UPDATE usuarios SET role = 'ADMIN' WHERE email = 'seu-email@example.com';`
