# Radar SUS Frontend - v20.4 menu limpo
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v20.4 - menu limpo e nomenclaturas..." -ForegroundColor Cyan

$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v20-4-css-append.css"

if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Get-Content $cssPath -Raw
  $append = Get-Content $cssAppendPath -Raw

  if ($current -notmatch "v20.4 - Menu limpo") {
    Add-Content $cssPath "`r`n$append"
    Write-Host "OK CSS v20.4 adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v20.4 ja estava aplicado." -ForegroundColor Yellow
  }
}

Write-Host "v20.4 aplicado. Rode npm run build." -ForegroundColor Cyan
