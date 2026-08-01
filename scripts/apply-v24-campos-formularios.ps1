# Radar SUS Frontend - v24 Cadastros Campos e Formularios
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v24 - Cadastros Campos e Formularios..." -ForegroundColor Cyan

$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v24-campos-formularios-css-append.css"

if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Get-Content $cssPath -Raw
  $append = Get-Content $cssAppendPath -Raw

  if ($current -notmatch "v24 - Cadastros Campos e Formularios") {
    Add-Content $cssPath "`r`n$append"
    Write-Host "OK CSS v24 adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v24 ja estava aplicado." -ForegroundColor Yellow
  }
}

Write-Host "v24 aplicado. Rode npm run build." -ForegroundColor Cyan
