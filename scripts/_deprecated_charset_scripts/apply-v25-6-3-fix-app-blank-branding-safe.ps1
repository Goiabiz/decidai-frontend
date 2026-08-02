# Radar SUS Frontend - v25.6.3 Fix app em branco
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v25.6.3 - branding seguro para app carregar..." -ForegroundColor Cyan

function Write-Utf8NoBom {
  param([string]$Path, [string]$Content)
  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText((Resolve-Path $Path), $Content, $encoding)
}

$brandingPath = "src/lib/branding.ts"
if (Test-Path $brandingPath) {
  $content = Get-Content $brandingPath -Raw
  Write-Utf8NoBom $brandingPath $content
  Write-Host "OK branding.ts estabilizado." -ForegroundColor Green
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

Write-Host "v25.6.3 aplicado. Rode npm run build." -ForegroundColor Cyan
