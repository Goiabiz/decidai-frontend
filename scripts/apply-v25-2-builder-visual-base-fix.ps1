# Radar SUS Frontend - v25.2 Builder visual + Base fix
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v25.2 - builder visual e base fix..." -ForegroundColor Cyan

$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v25-2-css-append.css"

if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Get-Content $cssPath -Raw
  $append = Get-Content $cssAppendPath -Raw

  if ($current -notmatch "v25.2 - Builder visual e Base botao") {
    Add-Content $cssPath "`r`n$append"
    Write-Host "OK CSS v25.2 adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v25.2 ja estava aplicado." -ForegroundColor Yellow
  }
}

$possibleFiles = @("src/App.tsx", "src/components/Layout.tsx")
foreach ($file in $possibleFiles) {
  if (Test-Path $file) {
    $content = Get-Content $file -Raw

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

Write-Host "v25.2 aplicado. Rode npm run build." -ForegroundColor Cyan
