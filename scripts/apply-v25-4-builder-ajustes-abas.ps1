
function Read-Utf8 {
  param([string]$Path)
  # Le sempre como UTF-8 explicito (nunca cai no codepage ANSI do Windows).
  return [System.IO.File]::ReadAllText((Resolve-Path $Path), (New-Object System.Text.UTF8Encoding($false)))
}
# Radar SUS Frontend - v25.4 Builder ajustes abas
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v25.4 - builder ajustes abas..." -ForegroundColor Cyan

$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v25-4-css-append.css"

if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Read-Utf8 $cssPath
  $append = Read-Utf8 $cssAppendPath

  if ($current -notmatch "v25.4 - Ajustes builder abas e remover campo") {
    Add-Content $cssPath "`r`n$append"
    Write-Host "OK CSS v25.4 adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v25.4 ja estava aplicado." -ForegroundColor Yellow
  }
}

Write-Host "v25.4 aplicado. Rode npm run build." -ForegroundColor Cyan
