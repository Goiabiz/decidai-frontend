
function Read-Utf8 {
  param([string]$Path)
  # Le sempre como UTF-8 explicito (nunca cai no codepage ANSI do Windows).
  return [System.IO.File]::ReadAllText((Resolve-Path $Path), (New-Object System.Text.UTF8Encoding($false)))
}
# Radar SUS Frontend - v25.5 Telas com secoes
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v25.5 - telas com secoes e contexto global..." -ForegroundColor Cyan

$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v25-5-css-append.css"

if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Read-Utf8 $cssPath
  $append = Read-Utf8 $cssAppendPath

  if ($current -notmatch "v25.5 - Telas com secoes, contexto global e acoes funcionais") {
    Add-Content $cssPath "`r`n$append"
    Write-Host "OK CSS v25.5 adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v25.5 ja estava aplicado." -ForegroundColor Yellow
  }
}

Write-Host "v25.5 aplicado. Rode npm run build." -ForegroundColor Cyan
