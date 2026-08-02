
function Read-Utf8 {
  param([string]$Path)
  # Le sempre como UTF-8 explicito (nunca cai no codepage ANSI do Windows).
  return [System.IO.File]::ReadAllText((Resolve-Path $Path), (New-Object System.Text.UTF8Encoding($false)))
}
# Radar SUS Frontend - v20.1 menu hover/fixacao
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v20.1 - menu com hover e fixacao..." -ForegroundColor Cyan

$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v20-1-css-append.css"

if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Read-Utf8 $cssPath
  $append = Read-Utf8 $cssAppendPath

  if ($current -notmatch "v20.1 - Menu recolhivel com hover e fixacao") {
    Add-Content $cssPath "`r`n$append"
    Write-Host "OK CSS v20.1 adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v20.1 ja estava aplicado." -ForegroundColor Yellow
  }
}

Write-Host "v20.1 aplicado. Rode npm run build." -ForegroundColor Cyan
