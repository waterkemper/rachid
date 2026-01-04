# Configuração do Schema pg-boss

Este script configura o schema do pg-boss no banco de dados PostgreSQL.

## Quando executar

Execute este script:
- **Uma vez** após instalar o pg-boss
- Quando atualizar a versão do pg-boss
- Se o schema estiver desatualizado ou corrompido

## Como executar

```bash
# No diretório backend
npm run setup-pgboss
```

O script irá:
1. Conectar ao banco de dados
2. Remover o schema antigo (se existir)
3. Criar o schema novo na versão correta
4. Finalizar

## Requisitos

- Banco de dados PostgreSQL configurado e acessível
- Variáveis de ambiente configuradas (DATABASE_URL ou DB_*)

## Notas

- O script é seguro e pode ser executado múltiplas vezes
- Ele remove o schema antigo antes de criar um novo
- Não afeta outras tabelas do banco de dados

