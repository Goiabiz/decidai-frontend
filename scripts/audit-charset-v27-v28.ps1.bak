# Auditoria de mojibake v27-v28
Write-Host "Auditando caracteres quebrados..." -ForegroundColor Cyan

$patterns = @("Ãƒ", "Ã", "Â", "�")
$files = Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts,*.css -ErrorAction SilentlyContinue
$found = $false

foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw
  foreach ($pattern in $patterns) {
    if ($content.Contains($pattern)) {
      Write-Host "Possivel mojibake: $($file.FullName)" -ForegroundColor Yellow
      $found = $true
      break
    }
  }
}

if (-not $found) {
  Write-Host "Nenhum padrao comum de mojibake encontrado em src." -ForegroundColor Green
}
