# Radar SUS Frontend - v20.3 refinamento menu
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v20.3 - refinamento do menu..." -ForegroundColor Cyan

$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v20-3-css-append.css"

if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Get-Content $cssPath -Raw
  $append = Get-Content $cssAppendPath -Raw

  if ($current -notmatch "v20.3 - Refinamento do menu") {
    Add-Content $cssPath "`r`n$append"
    Write-Host "OK CSS v20.3 adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v20.3 ja estava aplicado." -ForegroundColor Yellow
  }
}

Write-Host "v20.3 aplicado. Rode npm run build." -ForegroundColor Cyan
