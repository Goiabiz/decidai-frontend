
function Read-Utf8 {
  param([string]$Path)
  # Le sempre como UTF-8 explicito (nunca cai no codepage ANSI do Windows).
  return [System.IO.File]::ReadAllText((Resolve-Path $Path), (New-Object System.Text.UTF8Encoding($false)))
}
# Radar SUS Frontend - v21.3 Usuarios modal refinada
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v21.3 - Usuarios modal refinada..." -ForegroundColor Cyan

$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v21-3-usuarios-css-append.css"

if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Read-Utf8 $cssPath
  $append = Read-Utf8 $cssAppendPath

  if ($current -notmatch "v21.3 - Usuarios modal refinada") {
    Add-Content $cssPath "`r`n$append"
    Write-Host "OK CSS v21.3 Usuarios adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v21.3 Usuarios ja estava aplicado." -ForegroundColor Yellow
  }
}

Write-Host "v21.3 Usuarios aplicado. Rode npm run build." -ForegroundColor Cyan
