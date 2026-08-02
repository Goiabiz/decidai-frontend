# v29-v34 - Ajustes finais e novas frentes
# Este pacote e um overlay de arquivos. Extraia o ZIP na raiz do projeto substituindo os arquivos antes de rodar este script.

Write-Host "v29-v34 aplicado como overlay." -ForegroundColor Cyan
Write-Host "Arquivando scripts antigos de charset, se existirem..." -ForegroundColor Cyan

$deprecatedDir = "scripts/_deprecated_charset_scripts"
if (-not (Test-Path $deprecatedDir)) {
  New-Item -ItemType Directory -Path $deprecatedDir | Out-Null
}

$oldScripts = Get-ChildItem -Path "scripts" -Filter "apply-v25-6*.ps1" -ErrorAction SilentlyContinue
foreach ($script in $oldScripts) {
  $target = Join-Path $deprecatedDir $script.Name
  if (-not (Test-Path $target)) {
    Move-Item $script.FullName $target
    Write-Host "Movido para deprecated: $($script.Name)" -ForegroundColor Yellow
  }
}

Write-Host "Rode agora:" -ForegroundColor Green
Write-Host "npm run build" -ForegroundColor White
Write-Host "npm run dev" -ForegroundColor White
Write-Host "powershell -ExecutionPolicy Bypass -File scripts/audit-v29-v34.ps1" -ForegroundColor White
