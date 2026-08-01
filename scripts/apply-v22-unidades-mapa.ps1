# Radar SUS Frontend - v22 Cadastros > Unidades com mapa
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v22 - Cadastros > Unidades com mapa..." -ForegroundColor Cyan

$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v22-unidades-css-append.css"

if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Get-Content $cssPath -Raw
  $append = Get-Content $cssAppendPath -Raw

  if ($current -notmatch "v22 - Cadastros > Unidades com mapa") {
    Add-Content $cssPath "`r`n$append"
    Write-Host "OK CSS v22 Unidades adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v22 Unidades ja estava aplicado." -ForegroundColor Yellow
  }
}

Write-Host "v22 Unidades aplicado. Rode npm run build." -ForegroundColor Cyan
