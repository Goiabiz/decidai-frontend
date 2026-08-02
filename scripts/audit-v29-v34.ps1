
function Read-Utf8 {
  param([string]$Path)
  # Le sempre como UTF-8 explicito (nunca cai no codepage ANSI do Windows).
  return [System.IO.File]::ReadAllText((Resolve-Path $Path), (New-Object System.Text.UTF8Encoding($false)))
}
# Auditoria v29-v34
# Verifica charset, BOM e padrões de código que causaram erros nos pacotes anteriores.

Write-Host "Auditando v29-v34..." -ForegroundColor Cyan
$hasIssue = $false

$files = Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx,*.css -ErrorAction SilentlyContinue
$patterns = @("Ãƒ", "Ã", "Â", "�")
$ignoreFiles = @("src\utils\textEncoding.ts", "src/utils/textEncoding.ts")

foreach ($file in $files) {
  $relative = $file.FullName.Replace((Resolve-Path ".").Path + [System.IO.Path]::DirectorySeparatorChar, "")
  $content = Read-Utf8 $file.FullName

  $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191) {
    Write-Host "BOM encontrado: $relative" -ForegroundColor Yellow
    $hasIssue = $true
  }

  $ignored = $ignoreFiles -contains $relative
  if (-not $ignored) {
    foreach ($pattern in $patterns) {
      if ($content.Contains($pattern)) {
        Write-Host "Possivel mojibake: $relative" -ForegroundColor Yellow
        $hasIssue = $true
        break
      }
    }
  }

  if ($content.Contains("window.confirm")) {
    Write-Host "Confirmacao nativa do navegador encontrada: $relative" -ForegroundColor Yellow
    $hasIssue = $true
  }

  if ($content.Contains("replaceAll(")) {
    Write-Host "replaceAll encontrado: $relative" -ForegroundColor Yellow
    $hasIssue = $true
  }

  if ($content.Contains(" as any")) {
    Write-Host "Uso de as any encontrado: $relative" -ForegroundColor Yellow
    $hasIssue = $true
  }
}

if (-not $hasIssue) {
  Write-Host "Auditoria limpa para os pontos conhecidos." -ForegroundColor Green
} else {
  Write-Host "Auditoria encontrou pontos para revisar." -ForegroundColor Yellow
}
