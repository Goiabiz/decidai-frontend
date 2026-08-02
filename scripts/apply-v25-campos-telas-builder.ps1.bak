# Radar SUS Frontend - v25 Campos e Telas Builder
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v25 - Campos e Telas Builder..." -ForegroundColor Cyan

$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v25-campos-telas-builder-css-append.css"

if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Get-Content $cssPath -Raw
  $append = Get-Content $cssAppendPath -Raw

  if ($current -notmatch "v25 - Campos e Telas Builder") {
    Add-Content $cssPath "`r`n$append"
    Write-Host "OK CSS v25 adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v25 ja estava aplicado." -ForegroundColor Yellow
  }
}

Write-Host "v25 aplicado. Rode npm run build." -ForegroundColor Cyan
