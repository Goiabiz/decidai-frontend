# Radar SUS Frontend - v25.7 Base de Conhecimento simplificada
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v25.7 - Base de Conhecimento simplificada..." -ForegroundColor Cyan

function Write-Utf8NoBom {
  param([string]$Path, [string]$Content)
  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText((Resolve-Path $Path), $Content, $encoding)
}

$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v25-7-css-append.css"

if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Get-Content $cssPath -Raw
  $append = Get-Content $cssAppendPath -Raw

  if ($current -notmatch "v25.7 - Base de Conhecimento simplificada") {
    Write-Utf8NoBom $cssPath "$current`r`n$append"
    Write-Host "OK CSS v25.7 adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v25.7 ja estava aplicado." -ForegroundColor Yellow
  }
}

# Correção ampliada de mojibake em fonte.
$replacementPairs = @(
  @("Ãrea", "Área"),
  @("Ã�rea", "Área"),
  @("Ãrea", "Área"),
  @("UsuÃ¡rios", "Usuários"),
  @("UsuÃ¡rio", "Usuário"),
  @("ParametrizaÃ§Ã£o", "Parametrização"),
  @("AdministraÃ§Ã£o", "Administração"),
  @("IntegraÃ§Ãµes", "Integrações"),
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
Write-Host "OK caracteres especiais corrigidos em src." -ForegroundColor Green

Write-Host "v25.7 aplicado. Rode npm run build." -ForegroundColor Cyan
