# Radar SUS Frontend - v20.2 consolidado
# Inclui v20 submenus + v20.1 menu hover/fixacao.
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v20.2 consolidado - submenus + menu hover/fixacao..." -ForegroundColor Cyan

$cssPath = "src/styles/global.css"

$cssV20 = "docs/v20-css-append.css"
if ((Test-Path $cssPath) -and (Test-Path $cssV20)) {
  $current = Get-Content $cssPath -Raw
  $append = Get-Content $cssV20 -Raw
  if ($current -notmatch "v20 - Submenus e telas por funcionalidade") {
    Add-Content $cssPath "`r`n$append"
    Write-Host "OK CSS v20 adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v20 ja estava aplicado." -ForegroundColor Yellow
  }
}

$cssV201 = "docs/v20-1-css-append.css"
if ((Test-Path $cssPath) -and (Test-Path $cssV201)) {
  $current = Get-Content $cssPath -Raw
  $append = Get-Content $cssV201 -Raw
  if ($current -notmatch "v20.1 - Menu recolhivel com hover e fixacao") {
    Add-Content $cssPath "`r`n$append"
    Write-Host "OK CSS v20.1 adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v20.1 ja estava aplicado." -ForegroundColor Yellow
  }
}

$impactosPath = "src/pages/ImpactosProduto.tsx"
$impactosBackup = "src/pages/ImpactosProduto.tsx.bak"
if (Test-Path $impactosPath) {
  Move-Item $impactosPath $impactosBackup -Force
  Write-Host "OK ImpactosProduto movido para backup." -ForegroundColor Green
}

Write-Host "v20.2 consolidado aplicado. Rode npm run build." -ForegroundColor Cyan
