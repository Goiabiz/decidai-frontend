# Radar SUS Frontend - v20.5 fix build submenus
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v20.5 - correção de build dos submenus..." -ForegroundColor Cyan

$appPath = "src/App.tsx"
if (Test-Path $appPath) {
  $content = Get-Content $appPath -Raw

  # Remove props de páginas placeholder que ainda não usam painel/detail.
  $content = $content -replace "<Usuarios onSelectDetail=\{handleSelectDetail\} onOpenDetail=\{setExpandedDetail\} />", "<Usuarios />"
  $content = $content -replace "<UnidadesCentrosCusto onSelectDetail=\{handleSelectDetail\} onOpenDetail=\{setExpandedDetail\} />", "<UnidadesCentrosCusto />"
  $content = $content -replace "<CamposContexto onSelectDetail=\{handleSelectDetail\} onOpenDetail=\{setExpandedDetail\} />", "<CamposContexto />"
  $content = $content -replace "<FormulariosTelas onSelectDetail=\{handleSelectDetail\} onOpenDetail=\{setExpandedDetail\} />", "<FormulariosTelas />"
  $content = $content -replace "<ServicosFilas onSelectDetail=\{handleSelectDetail\} onOpenDetail=\{setExpandedDetail\} />", "<ServicosFilas />"
  $content = $content -replace "<Agentes onSelectDetail=\{handleSelectDetail\} onOpenDetail=\{setExpandedDetail\} />", "<Agentes />"
  $content = $content -replace "<SegurancaAuditoria onSelectDetail=\{handleSelectDetail\} onOpenDetail=\{setExpandedDetail\} />", "<SegurancaAuditoria />"
  $content = $content -replace "<RelatorioConhecimentos onSelectDetail=\{handleSelectDetail\} onOpenDetail=\{setExpandedDetail\} />", "<RelatorioConhecimentos />"
  $content = $content -replace "<RelatorioAtendimentos onSelectDetail=\{handleSelectDetail\} onOpenDetail=\{setExpandedDetail\} />", "<RelatorioAtendimentos />"
  $content = $content -replace "<RelatorioAlertas onSelectDetail=\{handleSelectDetail\} onOpenDetail=\{setExpandedDetail\} />", "<RelatorioAlertas />"
  $content = $content -replace "<RelatorioTarefas onSelectDetail=\{handleSelectDetail\} onOpenDetail=\{setExpandedDetail\} />", "<RelatorioTarefas />"
  $content = $content -replace "<RelatorioIntegracoes onSelectDetail=\{handleSelectDetail\} onOpenDetail=\{setExpandedDetail\} />", "<RelatorioIntegracoes />"
  $content = $content -replace "<RelatorioAuditoria onSelectDetail=\{handleSelectDetail\} onOpenDetail=\{setExpandedDetail\} />", "<RelatorioAuditoria />"

  Set-Content $appPath $content -Encoding UTF8
  Write-Host "OK App.tsx: removidas props de páginas placeholder." -ForegroundColor Green
}

$workspaceModalPath = "src/components/WorkspaceCustomizeModal.tsx"
if (Test-Path $workspaceModalPath) {
  $content = Get-Content $workspaceModalPath -Raw

  # A modal de customização ainda usava PageKey antigo. Como agora temos submenus,
  # ela deve aceitar mapa parcial para não exigir configuração de cada subtela.
  $content = $content -replace "Record<PageKey, string\[\]>", "Partial<Record<PageKey, string[]>>"
  $content = $content -replace "Record<PageKey, string>", "Partial<Record<PageKey, string>>"

  # Troca chave antiga config pela página administrativa atual.
  $content = $content -replace "(?m)^\s*config:", "  'param-admin':"

  # Corrige textos com mojibake comum que ficaram no arquivo.
  $content = $content -replace "ParametrizaÃ§Ã£o", "Parametrização"
  $content = $content -replace "IntegraÃ§Ãµes", "Integrações"
  $content = $content -replace "UsuÃ¡rios", "Usuários"
  $content = $content -replace "AparÃªncia", "Aparência"

  Set-Content $workspaceModalPath $content -Encoding UTF8
  Write-Host "OK WorkspaceCustomizeModal: PageKey parcial e chave param-admin." -ForegroundColor Green
}

Write-Host "v20.5 aplicado. Rode npm run build." -ForegroundColor Cyan
