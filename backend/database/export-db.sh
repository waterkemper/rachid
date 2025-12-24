#!/bin/bash
# Script para exportar banco de dados PostgreSQL
# Uso: ./export-db.sh

read -sp "Digite a senha do PostgreSQL: " PGPASSWORD
echo
read -p "Digite o usuário (padrão: postgres): " dbUser
dbUser=${dbUser:-postgres}

read -p "Exportar apenas schema? (s/n, padrão: s): " exportType
exportType=${exportType:-s}
if [[ $exportType == "n" || $exportType == "N" ]]; then
    fileName="exported_full.sql"
    schemaOnly=""
else
    fileName="exported_schema.sql"
    schemaOnly="--schema-only"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
outputFile="$SCRIPT_DIR/$fileName"

echo ""
echo "=== Exportação de Banco de Dados ==="
echo "Host: localhost"
echo "Porta: 5437"
echo "Banco: rachid"
echo "Usuário: $dbUser"
echo "Tipo: $(if [ -z "$schemaOnly" ]; then echo 'Schema + Dados'; else echo 'Schema apenas'; fi)"
echo "Arquivo: $outputFile"
echo ""

echo "Exportando..."

export PGPASSWORD
pg_dump -h localhost -p 5437 -U "$dbUser" -d rachid $schemaOnly --no-owner --no-acl > "$outputFile"
exitCode=$?
unset PGPASSWORD

if [ $exitCode -eq 0 ]; then
    echo ""
    echo "✅ Exportação concluída com sucesso!"
    echo "Arquivo salvo em: $outputFile"
    fileSize=$(du -h "$outputFile" | cut -f1)
    echo "Tamanho: $fileSize"
else
    echo ""
    echo "❌ Erro ao exportar banco de dados"
    echo "Verifique as credenciais e se o PostgreSQL está rodando."
    exit 1
fi

