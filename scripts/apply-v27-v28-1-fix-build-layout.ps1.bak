# Radar SUS Frontend - v27-v28.1 Fix build/layout
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v27-v28.1 - fix build/layout..." -ForegroundColor Cyan

function Write-Utf8NoBom {
  param([string]$Path, [string]$Content)
  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText((Resolve-Path $Path), $Content, $encoding)
}

# Corrige replaceAll para compatibilidade com tsconfig/lib atual.
$channelFiles = @(
  "src/pages/Canais.tsx",
  "src/pages/parametrizacao/Canais.tsx"
)

foreach ($file in $channelFiles) {
  if (Test-Path $file) {
    $content = Get-Content $file -Raw
    $content = $content.Replace("normalizeFilterText(form.nome).replaceAll(' ', '_')", "normalizeFilterText(form.nome).split(' ').join('_')")
    Write-Utf8NoBom $file $content
    Write-Host "OK replaceAll corrigido em $file" -ForegroundColor Green
  }
}

# Garante imports auxiliares no main.tsx.
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

# Aplica CSS que havia sido bloqueado pelo erro do script anterior.
$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v27-v28-1-css-append.css"

if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Get-Content $cssPath -Raw
  $append = Get-Content $cssAppendPath -Raw

  if ($current -notmatch "v27-v28.1 - fix visual agentes/canais/toast") {
    Write-Utf8NoBom $cssPath "$current`r`n$append"
    Write-Host "OK CSS v27-v28.1 adicionado." -ForegroundColor Green
  } else {
    Write-Host "CSS v27-v28.1 ja estava aplicado." -ForegroundColor Yellow
  }
}

# Correção de mojibake sem regex complexa e sem hashtable.
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
  @("UsuÃ¡rios", "Usuários"),
  @("ParametrizaÃ§Ã£o", "Parametrização"),
  @("AdministraÃ§Ã£o", "Administração"),
  @("IntegraÃ§Ãµes", "Integrações"),
  @("PreferÃªncias", "Preferências"),
  @("SeguranÃ§a", "Segurança"),
  @("ServiÃ§os", "Serviços"),
  @("RelatÃ³rios", "Relatórios"),
  @("ProduÃ§Ã£o", "Produção"),
  @("Ãrea", "Área"),
  @("Ã¡", "á"),
  @("Ã£", "ã"),
  @("Ã§", "ç"),
  @("Ã©", "é"),
  @("Ãª", "ê"),
  @("Ã­", "í"),
  @("Ã³", "ó"),
  @("Ãµ", "õ"),
  @("Ãº", "ú")
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
Write-Host "v27-v28.1 aplicado. Rode npm run build." -ForegroundColor Cyan
