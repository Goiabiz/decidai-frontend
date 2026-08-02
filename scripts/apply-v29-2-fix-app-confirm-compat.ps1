# Radar SUS Frontend - v29.2 Fix appConfirm compatibility
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v29.2 - compatibilidade appConfirm..." -ForegroundColor Cyan

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

if (!(Test-Path $target)) {
  Write-Host "ERRO: src/lib/appConfirm.ts nao encontrado." -ForegroundColor Red
  exit 1
}

$content = Read-Utf8 $target
Write-Utf8NoBom $target $content

Write-Host "OK appConfirm.ts atualizado com confirmApp, showAppConfirm e description." -ForegroundColor Green
Write-Host "v29.2 aplicado. Rode npm run build." -ForegroundColor Cyan
