
function Read-Utf8 {
  param([string]$Path)
  # Le sempre como UTF-8 explicito (nunca cai no codepage ANSI do Windows).
  return [System.IO.File]::ReadAllText((Resolve-Path $Path), (New-Object System.Text.UTF8Encoding($false)))
}
# Radar SUS Frontend - v22 Cadastros > Unidades com mapa
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v22 - Cadastros > Unidades com mapa..." -ForegroundColor Cyan

$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v22-unidades-css-append.css"

if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Read-Utf8 $cssPath
  $append = Read-Utf8 $cssAppendPath

  if ($current -notmatch "v22 - Cadastros > Unidades com mapa") {
    Add-Content $cssPath "`r`n$append"
    Write-Host "OK CSS v22 Unidades adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v22 Unidades ja estava aplicado." -ForegroundColor Yellow
  }
}

Write-Host "v22 Unidades aplicado. Rode npm run build." -ForegroundColor Cyan
