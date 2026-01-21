# Configuração do pg-boss no Railway

## O que é necessário

O **pg-boss** precisa criar um schema no banco de dados PostgreSQL antes de ser usado. Este schema contém as tabelas necessárias para gerenciar a fila de jobs.

## ⚠️ Importante

- **Não precisa de variáveis de ambiente adicionais** - o pg-boss usa as mesmas credenciais do banco de dados já configuradas
- O schema precisa ser criado **uma vez** antes do primeiro uso
- Após criado, o schema persiste no banco de dados

## Como configurar no Railway

### Opção 1: Executar script via Railway CLI (Recomendado)

1. **Instalar Railway CLI** (se ainda não tiver):
   ```bash
   npm install -g @railway/cli
   ```

2. **Fazer login no Railway**:
   ```bash
   railway login
   ```

3. **Conectar ao projeto**:
   ```bash
   cd backend
   railway link
   ```

4. **Executar o script de setup**:
   ```bash
   railway run npm run setup-pgboss
   ```

   Este comando executa o script no ambiente do Railway com acesso ao banco de dados de produção.

### Opção 2: Executar via Console do Railway

1. Acesse seu projeto no Railway
2. Vá em **Deployments** → Selecione o último deploy
3. Clique em **View Logs** ou **Shell**
4. Execute:
   ```bash
   npm run setup-pgboss
   ```

### Opção 3: Adicionar ao processo de deploy (Automático)

Se quiser que o schema seja criado automaticamente em cada deploy (não recomendado, mas possível):

1. Modifique o `railway.json` para executar o script antes de iniciar:
   ```json
   {
     "deploy": {
       "startCommand": "npm run setup-pgboss && npm start"
     }
   }
   ```

   **⚠️ Atenção**: Isso pode causar problemas se o schema já existir. Melhor executar manualmente uma vez.

## Verificação

Após executar o script, você deve ver no log:
```
✅ Schema do pg-boss criado com sucesso!
✅ Configuração concluída
```

## Troubleshooting

### Erro: "Schema already exists"
- Normal se já foi executado antes
- O script tenta deletar o schema antigo primeiro, então é seguro executar novamente

### Erro: "Permission denied"
- Verifique se as credenciais do banco de dados estão corretas
- O usuário precisa ter permissão para criar schemas

### Erro: "Connection refused"
- Verifique se `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` estão configuradas corretamente no Railway
- Lembre-se de usar o **Session Pooler** do Supabase (porta 6543) para Railway

## Após a configuração

Uma vez que o schema foi criado:
- ✅ O backend iniciará normalmente
- ✅ O `EmailQueueService` funcionará automaticamente
- ✅ Não precisa executar o script novamente (a menos que atualize o pg-boss)

## Variáveis de Ambiente Necessárias

O pg-boss usa as mesmas variáveis do banco de dados que já estão configuradas:

```env
# Já configuradas no Railway
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=6543
DB_USERNAME=postgres
DB_PASSWORD=sua-senha
DB_DATABASE=postgres

# Ou usando DATABASE_URL
DATABASE_URL=postgresql://postgres:senha@host:6543/postgres
```

**Não precisa adicionar nenhuma variável nova!**

