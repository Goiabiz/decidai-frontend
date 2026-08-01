# Radar SUS Frontend - v21.1 Cadastros > Usuarios sem indicadores
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v21.1 - Cadastros > Usuarios sem indicadores..." -ForegroundColor Cyan

$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v21-1-usuarios-css-append.css"

if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Get-Content $cssPath -Raw
  $append = Get-Content $cssAppendPath -Raw

  if ($current -notmatch "v21.1 - Cadastros > Usuarios sem indicadores") {
    Add-Content $cssPath "`r`n$append"
    Write-Host "OK CSS v21.1 Usuarios adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v21.1 Usuarios ja estava aplicado." -ForegroundColor Yellow
  }
}

Write-Host "v21.1 Usuarios aplicado. Rode npm run build." -ForegroundColor Cyan
