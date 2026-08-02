# Radar SUS Frontend - v29.1 Fix confirmApp
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v29.1 - fix confirmApp..." -ForegroundColor Cyan

function Write-Utf8NoBom {
  param([string]$Path, [string]$Content)
  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText((Resolve-Path $Path), $Content, $encoding)
}

function Read-Utf8 {
  param([string]$Path)
  # Le sempre como UTF-8 explicito. Get-Content -Raw sem -Encoding cai no
  # codepage ANSI do Windows quando o arquivo nao tem BOM, corrompendo acentos
  # a cada execucao (bug que causou a corrupcao repetida do projeto).
  return [System.IO.File]::ReadAllText((Resolve-Path $Path), (New-Object System.Text.UTF8Encoding($false)))
}

$target = "src/lib/appConfirm.ts"

if (Test-Path $target) {
  $content = Read-Utf8 $target
  Write-Utf8NoBom $target $content
  Write-Host "OK appConfirm.ts gravado em UTF-8 sem BOM." -ForegroundColor Green
} else {
  Write-Host "ERRO: src/lib/appConfirm.ts nao encontrado. Copie o arquivo do pacote para src/lib/." -ForegroundColor Red
  exit 1
}

Write-Host "v29.1 aplicado. Rode npm run build." -ForegroundColor Cyan
