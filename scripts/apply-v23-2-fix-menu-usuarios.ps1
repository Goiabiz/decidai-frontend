
function Read-Utf8 {
  param([string]$Path)
  # Le sempre como UTF-8 explicito (nunca cai no codepage ANSI do Windows).
  return [System.IO.File]::ReadAllText((Resolve-Path $Path), (New-Object System.Text.UTF8Encoding($false)))
}
# Radar SUS Frontend - v23.2 fix menu e usuarios
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v23.2 - fix menu e usuarios..." -ForegroundColor Cyan

$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v23-2-css-append.css"

if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Read-Utf8 $cssPath
  $append = Read-Utf8 $cssAppendPath

  if ($current -notmatch "v23.2 - Fix menu hover/fixo e telefone usuario") {
    Add-Content $cssPath "`r`n$append"
    Write-Host "OK CSS v23.2 adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v23.2 ja estava aplicado." -ForegroundColor Yellow
  }
}

Write-Host "v23.2 aplicado. Rode npm run build." -ForegroundColor Cyan
