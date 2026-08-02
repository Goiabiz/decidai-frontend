
function Read-Utf8 {
  param([string]$Path)
  # Le sempre como UTF-8 explicito (nunca cai no codepage ANSI do Windows).
  return [System.IO.File]::ReadAllText((Resolve-Path $Path), (New-Object System.Text.UTF8Encoding($false)))
}
# Radar SUS Frontend - v25.1 Campos, Telas e Base de Conhecimento
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v25.1 - Campos, Telas e Base de Conhecimento..." -ForegroundColor Cyan

$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v25-1-css-append.css"

if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Read-Utf8 $cssPath
  $append = Read-Utf8 $cssAppendPath

  if ($current -notmatch "v25.1 - Campos Telas e Base de Conhecimento") {
    Add-Content $cssPath "`r`n$append"
    Write-Host "OK CSS v25.1 adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v25.1 ja estava aplicado." -ForegroundColor Yellow
  }
}

# Ajuste de nomenclatura no menu/App sem mexer na lógica das rotas.
$possibleFiles = @("src/App.tsx", "src/components/Layout.tsx")
foreach ($file in $possibleFiles) {
  if (Test-Path $file) {
    $content = Read-Utf8 $file

    $content = $content -replace "label:\s*'Formulários'", "label: 'Telas'"
    $content = $content -replace 'label:\s*"Formulários"', 'label: "Telas"'
    $content = $content -replace ">Formulários<", ">Telas<"
    $content = $content -replace "title:\s*'Formulários'", "title: 'Telas'"
    $content = $content -replace 'title:\s*"Formulários"', 'title: "Telas"'

    $content = $content -replace "label:\s*'Base'", "label: 'Base de Conhecimento'"
    $content = $content -replace 'label:\s*"Base"', 'label: "Base de Conhecimento"'
    $content = $content -replace ">Base<", ">Base de Conhecimento<"
    $content = $content -replace "title:\s*'Base'", "title: 'Base de Conhecimento'"
    $content = $content -replace 'title:\s*"Base"', 'title: "Base de Conhecimento"'

    Set-Content -Path $file -Value $content -Encoding UTF8
    Write-Host "OK nomenclatura revisada em $file" -ForegroundColor Green
  }
}

Write-Host "v25.1 aplicado. Rode npm run build." -ForegroundColor Cyan
