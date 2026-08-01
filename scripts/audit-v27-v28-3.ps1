# Auditoria de qualidade v27-v28.3
Write-Host "Auditando charset, BOM e pontos de codigo..." -ForegroundColor Cyan

$files = Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts,*.css -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "textEncoding\.ts$" }
$found = $false

foreach ($file in $files) {
  $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191) {
    Write-Host "BOM encontrado: $($file.FullName)" -ForegroundColor Yellow
    $found = $true
  }

  $content = Get-Content $file.FullName -Raw
  if ($content.Contains("Ã") -or $content.Contains("Â") -or $content.Contains("�")) {
    Write-Host "Possivel mojibake: $($file.FullName)" -ForegroundColor Yellow
    $found = $true
  }

  if ($content.Contains(" as any")) {
    Write-Host "Uso de as any: $($file.FullName)" -ForegroundColor Yellow
    $found = $true
  }

  if ($content.Contains("replaceAll(")) {
    Write-Host "Uso de replaceAll: $($file.FullName)" -ForegroundColor Yellow
    $found = $true
  }
}

if (-not $found) {
  Write-Host "Auditoria limpa para os pontos conhecidos." -ForegroundColor Green
}
