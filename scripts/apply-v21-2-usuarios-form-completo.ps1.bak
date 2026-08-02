# Radar SUS Frontend - v21.2 Usuarios formulario completo
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v21.2 - Usuarios formulario completo..." -ForegroundColor Cyan

$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v21-2-usuarios-css-append.css"

if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Get-Content $cssPath -Raw
  $append = Get-Content $cssAppendPath -Raw

  if ($current -notmatch "v21.2 - Cadastros > Usuarios formulario completo") {
    Add-Content $cssPath "`r`n$append"
    Write-Host "OK CSS v21.2 Usuarios adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v21.2 Usuarios ja estava aplicado." -ForegroundColor Yellow
  }
}

Write-Host "v21.2 Usuarios aplicado. Rode npm run build." -ForegroundColor Cyan
