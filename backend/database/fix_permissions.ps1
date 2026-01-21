# Script PowerShell para corrigir permissões da tabela despesas_historico
# Executa o script SQL de correção de permissões

$env:PGPASSWORD = "rachid"
psql -h localhost -p 5437 -U rachid -d rachid -f database/migration_fix_permissions_despesas_historico.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Permissões corrigidas com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao corrigir permissões. Verifique as credenciais e a conexão." -ForegroundColor Red
}
