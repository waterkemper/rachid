# Como Exportar Banco de Dados Local

Este guia mostra como exportar seu banco de dados local (PostgreSQL) para usar no Supabase.

## Pré-requisitos

- PostgreSQL instalado (com `pg_dump` no PATH)
- Ou usar Docker se não tiver PostgreSQL instalado localmente

## Método 1: Usando pg_dump (Direto) ⭐ Recomendado

### Exportar apenas o Schema (estrutura das tabelas)

```bash
pg_dump -h localhost -p 5437 -U seu_usuario -d rachid --schema-only --no-owner --no-acl > backend/database/exported_schema.sql
```

### Exportar Schema + Dados

```bash
pg_dump -h localhost -p 5437 -U seu_usuario -d rachid --no-owner --no-acl > backend/database/exported_full.sql
```

### Parâmetros explicados:

- `-h localhost`: Host do banco
- `-p 5437`: Porta do banco
- `-U seu_usuario`: Usuário do PostgreSQL (geralmente `postgres`)
- `-d rachid`: Nome do banco de dados
- `--schema-only`: Apenas estrutura (sem dados)
- `--no-owner`: Remove comandos de ownership (importante para Supabase)
- `--no-acl`: Remove comandos de permissões (importante para Supabase)
- `> arquivo.sql`: Salva a saída no arquivo

## Método 2: Usando Docker (se não tiver pg_dump local)

Se você não tem `pg_dump` instalado, pode usar Docker:

### Exportar Schema

```bash
docker run --rm -e PGPASSWORD=sua_senha postgres:latest pg_dump -h host.docker.internal -p 5437 -U seu_usuario -d rachid --schema-only --no-owner --no-acl > backend/database/exported_schema.sql
```

**Nota para Windows**: Substitua `host.docker.internal` por `192.168.65.254` ou o IP da sua máquina.

### Exportar Schema + Dados

```bash
docker run --rm -e PGPASSWORD=sua_senha postgres:latest pg_dump -h host.docker.internal -p 5437 -U seu_usuario -d rachid --no-owner --no-acl > backend/database/exported_full.sql
```

## Método 3: Script Automático

Crie um script para facilitar:

### Windows (PowerShell) - `export-db.ps1`

```powershell
# backend/database/export-db.ps1
$env:PGPASSWORD = Read-Host "Digite a senha do PostgreSQL"
$dbUser = Read-Host "Digite o usuário (padrão: postgres)" 
if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "postgres" }

$exportType = Read-Host "Exportar apenas schema? (s/n, padrão: s)"
$fileName = if ($exportType -eq "n" -or $exportType -eq "N") { "exported_full.sql" } else { "exported_schema.sql" }
$schemaOnly = if ($exportType -eq "n" -or $exportType -eq "N") { "" } else { "--schema-only" }

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputFile = Join-Path $scriptPath $fileName

Write-Host "Exportando banco de dados..."
Write-Host "Host: localhost"
Write-Host "Porta: 5437"
Write-Host "Banco: rachid"
Write-Host "Usuário: $dbUser"
Write-Host "Arquivo: $outputFile"

pg_dump -h localhost -p 5437 -U $dbUser -d rachid $schemaOnly --no-owner --no-acl > $outputFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Exportação concluída com sucesso!" -ForegroundColor Green
    Write-Host "Arquivo salvo em: $outputFile"
} else {
    Write-Host "Erro ao exportar banco de dados" -ForegroundColor Red
}
```

### Linux/Mac (Bash) - `export-db.sh`

```bash
#!/bin/bash
# backend/database/export-db.sh

read -sp "Digite a senha do PostgreSQL: " PGPASSWORD
echo
read -p "Digite o usuário (padrão: postgres): " dbUser
dbUser=${dbUser:-postgres}

read -p "Exportar apenas schema? (s/n, padrão: s): " exportType
fileName=${exportType:-s}
if [[ $fileName == "n" || $fileName == "N" ]]; then
    fileName="exported_full.sql"
    schemaOnly=""
else
    fileName="exported_schema.sql"
    schemaOnly="--schema-only"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
outputFile="$SCRIPT_DIR/$fileName"

echo "Exportando banco de dados..."
echo "Host: localhost"
echo "Porta: 5437"
echo "Banco: rachid"
echo "Usuário: $dbUser"
echo "Arquivo: $outputFile"

export PGPASSWORD
pg_dump -h localhost -p 5437 -U "$dbUser" -d rachid $schemaOnly --no-owner --no-acl > "$outputFile"

if [ $? -eq 0 ]; then
    echo "✅ Exportação concluída com sucesso!"
    echo "Arquivo salvo em: $outputFile"
else
    echo "❌ Erro ao exportar banco de dados"
    exit 1
fi

unset PGPASSWORD
```

**Tornar executável (Linux/Mac):**
```bash
chmod +x backend/database/export-db.sh
```

## Importar no Supabase

Após exportar:

1. Acesse o **SQL Editor** no Supabase
2. Abra o arquivo exportado
3. Copie e cole no editor
4. Execute (Run)

**⚠️ Atenção**: Se exportou com dados (`exported_full.sql`), certifique-se de que:
- As tabelas já existam no Supabase, OU
- O script inclui os comandos `CREATE TABLE`

## Exemplo de Uso Rápido

Para exportar apenas o schema (estrutura):

```bash
# Windows
pg_dump -h localhost -p 5437 -U postgres -d rachid --schema-only --no-owner --no-acl > backend/database/exported_schema.sql

# Linux/Mac
PGPASSWORD=sua_senha pg_dump -h localhost -p 5437 -U postgres -d rachid --schema-only --no-owner --no-acl > backend/database/exported_schema.sql
```

## Verificar o Arquivo Exportado

Após exportar, você pode verificar o conteúdo:

```bash
# Ver primeiras linhas
head -n 50 backend/database/exported_schema.sql

# Ver tamanho do arquivo
ls -lh backend/database/exported_schema.sql
```

## Troubleshooting

### Erro: "pg_dump: command not found"

**Solução**: Instale o PostgreSQL client ou use Docker:

```bash
# Usar Docker
docker run --rm postgres:latest pg_dump --version
```

### Erro: "password authentication failed"

**Solução**: Use a variável de ambiente PGPASSWORD:

```bash
# Windows (PowerShell)
$env:PGPASSWORD = "sua_senha"
pg_dump -h localhost -p 5437 -U postgres -d rachid --schema-only --no-owner --no-acl > exported.sql

# Linux/Mac
PGPASSWORD=sua_senha pg_dump -h localhost -p 5437 -U postgres -d rachid --schema-only --no-owner --no-acl > exported.sql
```

### Erro: "connection refused"

**Solução**: Verifique se o PostgreSQL está rodando:

```bash
# Verificar se está rodando
# Windows
netstat -an | findstr 5437

# Linux/Mac
lsof -i :5437
```

## Comparar com Schema Atual

Se quiser comparar o exportado com o schema atual do projeto:

```bash
# Ver diferenças (requer diff tool)
diff backend/database/schema.sql backend/database/exported_schema.sql
```

