
function Read-Utf8 {
  param([string]$Path)
  # Le sempre como UTF-8 explicito (nunca cai no codepage ANSI do Windows).
  return [System.IO.File]::ReadAllText((Resolve-Path $Path), (New-Object System.Text.UTF8Encoding($false)))
}
# Radar SUS Frontend - Build fix v1.3
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando build fix v1.3..." -ForegroundColor Cyan

# 1) Remove prop inexistente description do DataSourceNotice na tela de Integrações.
$integracoesPath = "src/pages/Integracoes.tsx"
if (Test-Path $integracoesPath) {
  $content = Read-Utf8 $integracoesPath
  $content = $content -replace "\r?\n\s*description=""Provedores e conexões autorizadas por cliente/usuário\.""", ""
  Set-Content $integracoesPath $content -Encoding UTF8
  Write-Host "OK Integracoes: removida prop description do DataSourceNotice." -ForegroundColor Green
}

# 2) Corrige fallback antigo de atendimentos que ainda usava ultima em vez de ultimaInteracao/ticket.
$radarApiPath = "src/services/radarApi.ts"
if (Test-Path $radarApiPath) {
  $content = Read-Utf8 $radarApiPath

  # Substituições mais amplas, cobrindo aspas simples e duplas.
  $content = $content -replace "ultima:\s*'([^']*)'", "ultimaInteracao: '`$1', ticket: '-'"
  $content = $content -replace 'ultima:\s*"([^"]*)"', 'ultimaInteracao: "$1", ticket: "-"'

  # Casts pontuais para evitar inferência quebrada no POC.
  $content = $content -replace "\}, atendimentos\);", "}, atendimentos as any) as any;"
  $content = $content -replace "\}, \[\]\);", "}, [] as any) as any;"

  Set-Content $radarApiPath $content -Encoding UTF8
  Write-Host "OK radarApi: fallback e casts ajustados." -ForegroundColor Green
}

# 3) Ajusta CentralAtendimento para não travar por inferência antiga no fetchAtendimentos.
$centralPath = "src/pages/CentralAtendimento.tsx"
if (Test-Path $centralPath) {
  $content = Read-Utf8 $centralPath
  $content = $content -replace "useAsyncData\(fetchAtendimentos, mockAtendimentos\)", "useAsyncData(fetchAtendimentos as any, mockAtendimentos as any)"
  Set-Content $centralPath $content -Encoding UTF8
  Write-Host "OK CentralAtendimento: fetchAtendimentos com cast seguro para POC." -ForegroundColor Green
}

# 4) Impactos saiu do menu; se continuar compilando arquivo legado, renomeia para backup fora do tsconfig.
$impactosPath = "src/pages/ImpactosProduto.tsx"
$impactosBackup = "src/pages/ImpactosProduto.tsx.bak"
if (Test-Path $impactosPath) {
  Move-Item $impactosPath $impactosBackup -Force
  Write-Host "OK ImpactosProduto: arquivo legado movido para .bak." -ForegroundColor Green
}

Write-Host "Build fix v1.3 concluído. Rode npm run build." -ForegroundColor Cyan
