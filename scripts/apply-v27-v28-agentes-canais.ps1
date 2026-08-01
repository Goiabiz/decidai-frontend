# Radar SUS Frontend - v27-v28 Agentes + Canais + correcoes visuais
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v27-v28 - Agentes, Canais e estabilidade visual..." -ForegroundColor Cyan

function Write-Utf8NoBom {
  param([string]$Path, [string]$Content)
  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText((Resolve-Path $Path), $Content, $encoding)
}

# Imports seguros no main.tsx
$mainPath = "src/main.tsx"
if (Test-Path $mainPath) {
  $main = Get-Content $mainPath -Raw

  if ($main -notmatch "lib/appToast") {
    $main = "import './lib/appToast';`r`n" + $main
    Write-Host "OK appToast importado." -ForegroundColor Green
  }

  if ($main -notmatch "lib/sidebarHoverDelay") {
    $main = "import './lib/sidebarHoverDelay';`r`n" + $main
    Write-Host "OK sidebarHoverDelay importado." -ForegroundColor Green
  }

  Write-Utf8NoBom $mainPath $main
}

# CSS v27-v28
$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v27-v28-css-append.css"
if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Get-Content $cssPath -Raw
  $append = Get-Content $cssAppendPath -Raw

  if ($current -notmatch "v27-v28 - Agentes, Canais e estabilidade visual") {
    Write-Utf8NoBom $cssPath "$current`r`n$append"
    Write-Host "OK CSS v27-v28 adicionado." -ForegroundColor Green
  } else {
    Write-Host "CSS v27-v28 ja estava aplicado." -ForegroundColor Yellow
  }
}

# Correção dupla de mojibake, sem Hashtable.
$replacementPairs = @(
  @("ÃƒÂ�rea", "Área"),
  @("ÃƒÂrea", "Área"),
  @("ÃƒÂ", "Á"),
  @("ÃƒÂ¡", "á"),
  @("ÃƒÂ¢", "â"),
  @("ÃƒÂ£", "ã"),
  @("ÃƒÂ§", "ç"),
  @("ÃƒÂ©", "é"),
  @("ÃƒÂª", "ê"),
  @("ÃƒÂ­", "í"),
  @("ÃƒÂ³", "ó"),
  @("ÃƒÂ´", "ô"),
  @("ÃƒÂµ", "õ"),
  @("ÃƒÂº", "ú"),
  @("ÃƒÂ‡", "Ç"),
  @("ÃƒÂ‰", "É"),
  @("ÃƒÂª", "ê"),
  @("Ãƒ", "Ã"),
  @("Â", ""),
  @("Â¡", ""),
  @("Â£", ""),
  @("Â§", ""),
  @("Âª", ""),
  @("Â©", ""),
  @("Â³", ""),
  @("Âº", ""),
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
  @("Ãµ", "õ"),
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

# Tenta ajustar nomenclatura e adicionar Canais no menu caso exista item Agentes.
$layoutFiles = @("src/App.tsx", "src/components/Layout.tsx")
foreach ($file in $layoutFiles) {
  if (Test-Path $file) {
    $content = Get-Content $file -Raw
    $content = $content.Replace("Ambiente: ProduÃƒÂ§ÃƒÂ£o", "Ambiente: Produção")
    $content = $content.Replace("Ambiente: ProduÃ§Ã£o", "Ambiente: Produção")
    $content = $content.Replace("ParametrizaÃƒÂ§ÃƒÂ£o", "Parametrização")
    $content = $content.Replace("ParametrizaÃ§Ã£o", "Parametrização")
    $content = $content.Replace("RelatÃƒÂ³rios", "Relatórios")
    $content = $content.Replace("RelatÃ³rios", "Relatórios")
    $content = $content.Replace("UsuÃƒÂ¡rios", "Usuários")
    $content = $content.Replace("UsuÃ¡rios", "Usuários")

    if (($content -match "Agentes") -and ($content -notmatch "Canais")) {
      $content = $content -replace "(Agentes['\"`][,\s\S]{0,220})", "`$1"
    }

    Write-Utf8NoBom $file $content
    Write-Host "OK revisão de texto em $file" -ForegroundColor Green
  }
}

Write-Host "v27-v28 aplicado. Rode npm run build." -ForegroundColor Cyan
