# Radar SUS Frontend - v29 Consolidação Parametrização, Integrações, Campos API e Ajustes Finais
# Execute na raiz do radar-sus-frontend depois de extrair o ZIP.

Write-Host "Aplicando v29 - consolidação de parametrização, integrações e API guiada..." -ForegroundColor Cyan

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

# Garantia de imports side-effect seguros no main.tsx.
$mainPath = "src/main.tsx"
if (Test-Path $mainPath) {
  $main = Read-Utf8 $mainPath
  if ($main -notmatch "lib/appToast") { $main = "import './lib/appToast';`r`n" + $main }
  if ($main -notmatch "lib/sidebarHoverDelay") { $main = "import './lib/sidebarHoverDelay';`r`n" + $main }
  if ($main -notmatch "lib/branding") { $main = "import './lib/branding';`r`n" + $main }
  Write-Utf8NoBom $mainPath $main
  Write-Host "OK main.tsx revisado." -ForegroundColor Green
}

# Regrava arquivos fonte como UTF-8 sem BOM, sem fazer substituição de caracteres.
$sourceFiles = Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts,*.css -ErrorAction SilentlyContinue
foreach ($file in $sourceFiles) {
  $content = Read-Utf8 $file.FullName
  Write-Utf8NoBom $file.FullName $content
}
Write-Host "OK arquivos src gravados em UTF-8 sem BOM." -ForegroundColor Green

Write-Host "v29 aplicado. Rode npm run build, npm run dev e scripts/audit-v29.ps1." -ForegroundColor Cyan
