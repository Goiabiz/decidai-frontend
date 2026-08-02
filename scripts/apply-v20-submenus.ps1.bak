# Radar SUS Frontend - v20 submenus
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v20 - submenus e telas por funcionalidade..." -ForegroundColor Cyan

$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v20-css-append.css"
if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Get-Content $cssPath -Raw
  $append = Get-Content $cssAppendPath -Raw

  if ($current -notmatch "v20 - Submenus e telas por funcionalidade") {
    Add-Content $cssPath "`r`n$append"
    Write-Host "OK CSS v20 adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v20 ja estava aplicado." -ForegroundColor Yellow
  }
}

$impactosPath = "src/pages/ImpactosProduto.tsx"
$impactosBackup = "src/pages/ImpactosProduto.tsx.bak"
if (Test-Path $impactosPath) {
  Move-Item $impactosPath $impactosBackup -Force
  Write-Host "OK ImpactosProduto movido para backup." -ForegroundColor Green
}

Write-Host "v20 aplicado. Rode npm run build." -ForegroundColor Cyan
