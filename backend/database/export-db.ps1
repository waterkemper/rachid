# Script para exportar banco de dados PostgreSQL
# Uso: .\export-db.ps1

$env:PGPASSWORD = Read-Host "Digite a senha do PostgreSQL"
$dbUser = Read-Host "Digite o usuário (padrão: postgres)" 
if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "postgres" }

$exportType = Read-Host "Exportar apenas schema? (s/n, padrão: s)"
$fileName = if ($exportType -eq "n" -or $exportType -eq "N") { "exported_full.sql" } else { "exported_schema.sql" }
$schemaOnly = if ($exportType -eq "n" -or $exportType -eq "N") { "" } else { "--schema-only" }

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputFile = Join-Path $scriptPath $fileName

Write-Host "`n=== Exportação de Banco de Dados ===" -ForegroundColor Cyan
Write-Host "Host: localhost"
Write-Host "Porta: 5437"
Write-Host "Banco: rachid"
Write-Host "Usuário: $dbUser"
Write-Host "Tipo: $(if ($schemaOnly) { 'Schema apenas' } else { 'Schema + Dados' })"
Write-Host "Arquivo: $outputFile"
Write-Host ""

Write-Host "Exportando..." -ForegroundColor Yellow

pg_dump -h localhost -p 5437 -U $dbUser -d rachid $schemaOnly --no-owner --no-acl > $outputFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Exportação concluída com sucesso!" -ForegroundColor Green
    Write-Host "Arquivo salvo em: $outputFile" -ForegroundColor Green
    $fileSize = (Get-Item $outputFile).Length / 1KB
    Write-Host "Tamanho: $([math]::Round($fileSize, 2)) KB" -ForegroundColor Gray
} else {
    Write-Host "`n❌ Erro ao exportar banco de dados" -ForegroundColor Red
    Write-Host "Verifique as credenciais e se o PostgreSQL está rodando." -ForegroundColor Yellow
    exit 1
}

$env:PGPASSWORD = $null

