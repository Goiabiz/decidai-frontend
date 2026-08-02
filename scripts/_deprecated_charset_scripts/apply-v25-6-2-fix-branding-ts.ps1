# Radar SUS Frontend - v25.6.2 Fix branding.ts
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v25.6.2 - fix branding.ts..." -ForegroundColor Cyan

function Write-Utf8NoBom {
  param([string]$Path, [string]$Content)
  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText((Resolve-Path $Path), $Content, $encoding)
}

# Este pacote substitui src/lib/branding.ts pelo arquivo corrigido.
# Se estiver usando a estrutura do ZIP, o arquivo já será copiado por cima.
# Este script só garante encoding e import no main.tsx.

$brandingPath = "src/lib/branding.ts"
if (Test-Path $brandingPath) {
  $content = Get-Content $brandingPath -Raw
  Write-Utf8NoBom $brandingPath $content
  Write-Host "OK branding.ts salvo em UTF-8 sem BOM." -ForegroundColor Green
}

$mainPath = "src/main.tsx"
if (Test-Path $mainPath) {
  $main = Get-Content $mainPath -Raw
  if ($main -notmatch "lib/branding") {
    $main = "import './lib/branding';`r`n" + $main
    Write-Utf8NoBom $mainPath $main
    Write-Host "OK main.tsx importa lib/branding." -ForegroundColor Green
  } else {
    Write-Host "main.tsx ja importa lib/branding." -ForegroundColor Yellow
  }
}

Write-Host "v25.6.2 aplicado. Rode npm run build." -ForegroundColor Cyan
