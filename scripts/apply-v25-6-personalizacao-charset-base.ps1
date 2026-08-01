# Radar SUS Frontend - v25.6 Personalizacao, charset e Base
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v25.6 - personalizacao, tema, charset e base..." -ForegroundColor Cyan

function Write-Utf8NoBom {
  param([string]$Path, [string]$Content)
  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText((Resolve-Path $Path), $Content, $encoding)
}

$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v25-6-css-append.css"

if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Get-Content $cssPath -Raw
  $append = Get-Content $cssAppendPath -Raw

  if ($current -notmatch "v25.6 - Personalizacao, tema e correcoes de marca") {
    Write-Utf8NoBom $cssPath "$current`r`n$append"
    Write-Host "OK CSS v25.6 adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v25.6 ja estava aplicado." -ForegroundColor Yellow
  }
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

$replacements = [ordered]@{
  "Ãrea" = "Área"
  "Ãrea" = "Área"
  "UsuÃ¡rios" = "Usuários"
  "ParametrizaÃ§Ã£o" = "Parametrização"
  "RelatÃ³rios" = "Relatórios"
  "ProduÃ§Ã£o" = "Produção"
  "IntegraÃ§Ãµes" = "Integrações"
  "ConcluÃ­das" = "Concluídas"
  "ConcluÃ­da" = "Concluída"
  "geraÃ§Ã£o" = "geração"
  "competÃªncia" = "competência"
  "ResponsÃ¡vel" = "Responsável"
  "orientaÃ§Ã£o" = "orientação"
  "integraÃ§Ã£o" = "integração"
  "anÃ¡lise" = "análise"
  "relatÃ³rios" = "relatórios"
  "aÃ§Ã£o" = "ação"
  "aÃ§Ãµes" = "ações"
  "Ã©" = "é"
  "Ãª" = "ê"
  "Ã¡" = "á"
  "Ã£" = "ã"
  "Ã§" = "ç"
  "Ã³" = "ó"
  "Ãº" = "ú"
  "Ã­" = "í"
}

$sourceFiles = Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts,*.css -ErrorAction SilentlyContinue
foreach ($file in $sourceFiles) {
  $content = Get-Content $file.FullName -Raw
  $original = $content

  foreach ($key in $replacements.Keys) {
    $content = $content.Replace($key, $replacements[$key])
  }

  if ($content -ne $original) {
    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($file.FullName, $content, $encoding)
  }
}
Write-Host "OK substituicoes de caracteres especiais aplicadas em src." -ForegroundColor Green

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

Write-Host "v25.6 aplicado. Rode npm run build." -ForegroundColor Cyan
