
function Read-Utf8 {
  param([string]$Path)
  # Le sempre como UTF-8 explicito (nunca cai no codepage ANSI do Windows).
  return [System.IO.File]::ReadAllText((Resolve-Path $Path), (New-Object System.Text.UTF8Encoding($false)))
}
# Auditoria v29.2
Write-Host "Auditando appConfirm v29.2..." -ForegroundColor Cyan

$target = "src/lib/appConfirm.ts"

if (!(Test-Path $target)) {
  Write-Host "ERRO: appConfirm.ts nao encontrado." -ForegroundColor Red
  exit 1
}

$content = Read-Utf8 $target

$required = @(
  "export function confirmApp",
  "export const showAppConfirm",
  "description?: string",
  "export const appConfirm",
  "export const showConfirm"
)

foreach ($item in $required) {
  if ($content -notmatch [regex]::Escape($item)) {
    Write-Host "ERRO: ausente $item" -ForegroundColor Red
    exit 1
  }
}

if ($content -match "window\.confirm") {
  Write-Host "ERRO: window.confirm encontrado." -ForegroundColor Red
  exit 1
}

Write-Host "Auditoria v29.2 limpa." -ForegroundColor Green
