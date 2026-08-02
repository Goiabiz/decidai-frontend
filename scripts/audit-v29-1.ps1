
function Read-Utf8 {
  param([string]$Path)
  # Le sempre como UTF-8 explicito (nunca cai no codepage ANSI do Windows).
  return [System.IO.File]::ReadAllText((Resolve-Path $Path), (New-Object System.Text.UTF8Encoding($false)))
}
# Auditoria v29.1
Write-Host "Auditando confirmApp..." -ForegroundColor Cyan

$target = "src/lib/appConfirm.ts"

if (!(Test-Path $target)) {
  Write-Host "ERRO: appConfirm.ts nao encontrado." -ForegroundColor Red
  exit 1
}

$content = Read-Utf8 $target

if ($content -notmatch "export function confirmApp") {
  Write-Host "ERRO: confirmApp nao exportado." -ForegroundColor Red
  exit 1
}

if ($content -match "window\.confirm") {
  Write-Host "ERRO: window.confirm encontrado." -ForegroundColor Red
  exit 1
}

Write-Host "Auditoria v29.1 limpa." -ForegroundColor Green
