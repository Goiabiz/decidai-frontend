# Radar SUS Frontend - v23.1 refino seguro Cadastros
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v23.1 - refino seguro de Cadastros..." -ForegroundColor Cyan

$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v23-1-css-append.css"

if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Get-Content $cssPath -Raw
  $append = Get-Content $cssAppendPath -Raw

  if ($current -notmatch "v23.1 - Refino seguro Cadastros") {
    Add-Content $cssPath "`r`n$append"
    Write-Host "OK CSS v23.1 adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v23.1 ja estava aplicado." -ForegroundColor Yellow
  }
}

Write-Host "v23.1 aplicado. Rode npm run build." -ForegroundColor Cyan
