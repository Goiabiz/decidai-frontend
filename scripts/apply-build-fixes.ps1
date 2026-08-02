
function Read-Utf8 {
  param([string]$Path)
  # Le sempre como UTF-8 explicito (nunca cai no codepage ANSI do Windows).
  return [System.IO.File]::ReadAllText((Resolve-Path $Path), (New-Object System.Text.UTF8Encoding($false)))
}
# Radar SUS Frontend - Build fix v1.2
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando ajustes pontuais de build..." -ForegroundColor Cyan

$workspacePath = "src/components/WorkspaceCustomizeModal.tsx"
if (Test-Path $workspacePath) {
  $content = Read-Utf8 $workspacePath
  $content = $content -replace "(?m)^\s*impactos:\s*'[^']*',\r?\n", ""
  $content = $content -replace "(?m)^\s*impactos:\s*\[[^\]]*\],\r?\n", ""
  Set-Content $workspacePath $content -Encoding UTF8
  Write-Host "OK WorkspaceCustomizeModal: removidas referências a impactos." -ForegroundColor Green
}

$operationalStorePath = "src/services/operationalStore.ts"
if (Test-Path $operationalStorePath) {
  $content = Read-Utf8 $operationalStorePath
  $content = $content -replace "title,\s*\r?\n\s*\.\.\.previous,", "...previous,`r`n    title,"
  Set-Content $operationalStorePath $content -Encoding UTF8
  Write-Host "OK operationalStore: ajustada ordem do spread/title." -ForegroundColor Green
}

$radarApiPath = "src/services/radarApi.ts"
if (Test-Path $radarApiPath) {
  $content = Read-Utf8 $radarApiPath
  $content = $content -replace "ultima:\s*'([^']*)',\s*status:", "ultimaInteracao: '`$1', ticket: '-', status:"
  $content = $content -replace 'ultima:\s*"([^"]*)",\s*status:', 'ultimaInteracao: "$1", ticket: "-", status:'
  Set-Content $radarApiPath $content -Encoding UTF8
  Write-Host "OK radarApi: ajustado fallback de atendimentos." -ForegroundColor Green
}

Write-Host "Concluído. Rode npm run build." -ForegroundColor Cyan
