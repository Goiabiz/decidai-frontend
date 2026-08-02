
function Read-Utf8 {
  param([string]$Path)
  # Le sempre como UTF-8 explicito (nunca cai no codepage ANSI do Windows).
  return [System.IO.File]::ReadAllText((Resolve-Path $Path), (New-Object System.Text.UTF8Encoding($false)))
}
# Radar SUS Frontend - v20 submenus
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v20 - submenus e telas por funcionalidade..." -ForegroundColor Cyan

$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v20-css-append.css"
if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Read-Utf8 $cssPath
  $append = Read-Utf8 $cssAppendPath

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
