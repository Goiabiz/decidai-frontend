# Radar SUS Frontend - v25.6.1 Fix do script de charset/personalizacao
# Execute na raiz do radar-sus-frontend.
# Corrige o problema de chaves duplicadas em Hashtable do PowerShell.

Write-Host "Aplicando v25.6.1 - fix do script de charset..." -ForegroundColor Cyan

function Write-Utf8NoBom {
  param([string]$Path, [string]$Content)
  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText((Resolve-Path $Path), $Content, $encoding)
}

# Garante import do branding no main.tsx, caso o script anterior tenha parado antes.
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

# Usa lista de pares em vez de Hashtable para evitar erro de chave duplicada.
$replacementPairs = @(
  @("Ãrea", "Área"),
  @("Ãrea", "Área"),
  @("UsuÃ¡rios", "Usuários"),
  @("ParametrizaÃ§Ã£o", "Parametrização"),
  @("RelatÃ³rios", "Relatórios"),
  @("ProduÃ§Ã£o", "Produção"),
  @("IntegraÃ§Ãµes", "Integrações"),
  @("ConcluÃ­das", "Concluídas"),
  @("ConcluÃ­da", "Concluída"),
  @("geraÃ§Ã£o", "geração"),
  @("competÃªncia", "competência"),
  @("ResponsÃ¡vel", "Responsável"),
  @("orientaÃ§Ã£o", "orientação"),
  @("integraÃ§Ã£o", "integração"),
  @("anÃ¡lise", "análise"),
  @("relatÃ³rios", "relatórios"),
  @("aÃ§Ã£o", "ação"),
  @("aÃ§Ãµes", "ações"),
  @("Ã©", "é"),
  @("Ãª", "ê"),
  @("Ã¡", "á"),
  @("Ã£", "ã"),
  @("Ã§", "ç"),
  @("Ã³", "ó"),
  @("Ãº", "ú"),
  @("Ã­", "í")
)

$sourceFiles = Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts,*.css -ErrorAction SilentlyContinue
foreach ($file in $sourceFiles) {
  $content = Get-Content $file.FullName -Raw
  $original = $content

  foreach ($pair in $replacementPairs) {
    $content = $content.Replace($pair[0], $pair[1])
  }

  if ($content -ne $original) {
    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($file.FullName, $content, $encoding)
  }
}
Write-Host "OK caracteres especiais revisados em src." -ForegroundColor Green

# Ajusta nomenclaturas de menu quando ainda estiverem antigas.
$possibleFiles = @("src/App.tsx", "src/components/Layout.tsx")
foreach ($file in $possibleFiles) {
  if (Test-Path $file) {
    $content = Get-Content $file -Raw

    $content = $content -replace "label:\s*'Formulários'", "label: 'Telas'"
    $content = $content -replace 'label:\s*"Formulários"', 'label: "Telas"'
    $content = $content -replace ">Formulários<", ">Telas<"
    $content = $content -replace "label:\s*'Base'", "label: 'Base de Conhecimento'"
    $content = $content -replace 'label:\s*"Base"', 'label: "Base de Conhecimento"'
    $content = $content -replace ">Base<", ">Base de Conhecimento<"

    Write-Utf8NoBom $file $content
    Write-Host "OK nomenclatura revisada em $file" -ForegroundColor Green
  }
}

Write-Host "v25.6.1 aplicado. Rode npm run build." -ForegroundColor Cyan
