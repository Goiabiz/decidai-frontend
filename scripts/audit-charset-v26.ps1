
function Read-Utf8 {
  param([string]$Path)
  # Le sempre como UTF-8 explicito (nunca cai no codepage ANSI do Windows).
  return [System.IO.File]::ReadAllText((Resolve-Path $Path), (New-Object System.Text.UTF8Encoding($false)))
}
# Auditoria simples de caracteres quebrados
# Execute na raiz do radar-sus-frontend.

Write-Host "Auditando caracteres especiais quebrados..." -ForegroundColor Cyan

$patterns = @("Ã", "Â", "�")
$files = Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts,*.css -ErrorAction SilentlyContinue
$found = $false

foreach ($file in $files) {
  $content = Read-Utf8 $file.FullName
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
