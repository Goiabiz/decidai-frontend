# Corrige, em todos os scripts de scripts/, o bug que causa a corrupcao
# recorrente de acentos: Get-Content -Raw sem -Encoding explicito cai no
# codepage ANSI do Windows quando o arquivo alvo nao tem BOM, e o script
# acaba regravando o conteudo ja lido errado. Isso corrompe .ts/.tsx/.css
# um pouco mais a cada execucao.
#
# Uso: a partir da raiz do radar-sus-frontend
#   powershell -ExecutionPolicy Bypass -File scripts/_meta/fix-charset-bug-in-scripts.ps1
#
# Cria um .bak de cada script antes de alterar.

$readUtf8Helper = @'

function Read-Utf8 {
  param([string]$Path)
  # Le sempre como UTF-8 explicito (nunca cai no codepage ANSI do Windows).
  return [System.IO.File]::ReadAllText((Resolve-Path $Path), (New-Object System.Text.UTF8Encoding($false)))
}
'@

$scriptsDir = Split-Path -Parent $PSScriptRoot
$targets = Get-ChildItem -Path $scriptsDir -Filter *.ps1 -Recurse |
  Where-Object { $_.FullName -notmatch '\\_meta\\' -and $_.FullName -notmatch '\\_deprecated' }

$fixedCount = 0

foreach ($file in $targets) {
  $raw = [System.IO.File]::ReadAllText($file.FullName)

  if ($raw -notmatch 'Get-Content\s+[^\r\n]*-Raw(?!\S*-Encoding)') {
    continue
  }
  if ($raw -match 'function Read-Utf8') {
    continue
  }

  Copy-Item $file.FullName "$($file.FullName).bak" -Force

  if ($raw -match 'function Write-Utf8NoBom[^\}]*\}\r?\n') {
    $raw = $raw -replace '(function Write-Utf8NoBom[^\}]*\}\r?\n)', "`$1$readUtf8Helper`r`n"
  } else {
    $raw = $readUtf8Helper + "`r`n" + $raw
  }

  $raw = [System.Text.RegularExpressions.Regex]::Replace(
    $raw,
    'Get-Content\s+(\$[\w\.]+)\s+-Raw',
    'Read-Utf8 $1'
  )

  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($file.FullName, $raw, $encoding)

  Write-Host "OK corrigido: $($file.Name)" -ForegroundColor Green
  $fixedCount++
}

Write-Host ""
Write-Host "$fixedCount script(s) corrigido(s). Backups .bak criados ao lado de cada um." -ForegroundColor Cyan
