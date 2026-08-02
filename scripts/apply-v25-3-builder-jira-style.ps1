
function Read-Utf8 {
  param([string]$Path)
  # Le sempre como UTF-8 explicito (nunca cai no codepage ANSI do Windows).
  return [System.IO.File]::ReadAllText((Resolve-Path $Path), (New-Object System.Text.UTF8Encoding($false)))
}
# Radar SUS Frontend - v25.3 Builder estilo Jira
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v25.3 - builder estilo Jira..." -ForegroundColor Cyan

$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v25-3-css-append.css"

if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Read-Utf8 $cssPath
  $append = Read-Utf8 $cssAppendPath

  if ($current -notmatch "v25.3 - Builder estilo Jira dinamico") {
    Add-Content $cssPath "`r`n$append"
    Write-Host "OK CSS v25.3 adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v25.3 ja estava aplicado." -ForegroundColor Yellow
  }
}

Write-Host "v25.3 aplicado. Rode npm run build." -ForegroundColor Cyan
