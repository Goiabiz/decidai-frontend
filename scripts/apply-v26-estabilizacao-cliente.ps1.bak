# Radar SUS Frontend - v26 Estabilizacao da aplicacao cliente
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v26 - estabilizacao da aplicacao cliente..." -ForegroundColor Cyan

function Write-Utf8NoBom {
  param([string]$Path, [string]$Content)
  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText((Resolve-Path $Path), $Content, $encoding)
}

# Garante import seguro de branding no main.tsx.
$mainPath = "src/main.tsx"
if (Test-Path $mainPath) {
  $main = Get-Content $mainPath -Raw
  if ($main -notmatch "lib/branding") {
    $main = "import './lib/branding';`r`n" + $main
    Write-Utf8NoBom $mainPath $main
    Write-Host "OK main.tsx importa branding seguro." -ForegroundColor Green
  } else {
    Write-Host "main.tsx ja importa branding." -ForegroundColor Yellow
  }
}

# CSS v26
$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v26-css-append.css"
if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Get-Content $cssPath -Raw
  $append = Get-Content $cssAppendPath -Raw

  if ($current -notmatch "v26 - Estabilizacao aplicacao cliente") {
    Write-Utf8NoBom $cssPath "$current`r`n$append"
    Write-Host "OK CSS v26 adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v26 ja estava aplicado." -ForegroundColor Yellow
  }
}

# Correção de mojibake em arquivos fonte sem usar Hashtable.
$replacementPairs = @(
  @("Ãrea", "Área"),
  @("Ã�rea", "Área"),
  @("Ãrea", "Área"),
  @("UsuÃ¡rios", "Usuários"),
  @("UsuÃ¡rio", "Usuário"),
  @("ParametrizaÃ§Ã£o", "Parametrização"),
  @("AdministraÃ§Ã£o", "Administração"),
  @("IntegraÃ§Ãµes", "Integrações"),
  @("IntegraÃ§Ã£o", "Integração"),
  @("PreferÃªncias", "Preferências"),
  @("SeguranÃ§a", "Segurança"),
  @("ServiÃ§os", "Serviços"),
  @("RelatÃ³rios", "Relatórios"),
  @("ProduÃ§Ã£o", "Produção"),
  @("AÃ§Ãµes", "Ações"),
  @("AÃ§Ã£o", "Ação"),
  @("InformaÃ§Ã£o", "Informação"),
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
  @("Ã­", "í"),
  @("Ã‰", "É"),
  @("Ã‡", "Ç"),
  @("Ã•", "Õ")
)

$sourceFiles = Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts,*.css -ErrorAction SilentlyContinue
foreach ($file in $sourceFiles) {
  $content = Get-Content $file.FullName -Raw
  $original = $content

  foreach ($pair in $replacementPairs) {
    $content = $content.Replace($pair[0], $pair[1])
  }

  if ($content -ne $original) {
    Write-Utf8NoBom $file.FullName $content
  }
}
Write-Host "OK charset revisado em src." -ForegroundColor Green

# Padroniza nomenclatura de menu sem adicionar rotas novas.
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

Write-Host "v26 aplicado. Rode npm run build." -ForegroundColor Cyan
