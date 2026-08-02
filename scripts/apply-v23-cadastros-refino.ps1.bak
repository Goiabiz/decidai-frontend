# Radar SUS Frontend - v23 refino Cadastros
# Execute na raiz do radar-sus-frontend.

Write-Host "Aplicando v23 - refino de Usuarios e Unidades..." -ForegroundColor Cyan

# -----------------------------
# CSS
# -----------------------------
$cssPath = "src/styles/global.css"
$cssAppendPath = "docs/v23-css-append.css"
if ((Test-Path $cssPath) -and (Test-Path $cssAppendPath)) {
  $current = Get-Content $cssPath -Raw
  $append = Get-Content $cssAppendPath -Raw
  if ($current -notmatch "v23 - Refino Cadastros Usuarios e Unidades") {
    Add-Content $cssPath "`r`n$append"
    Write-Host "OK CSS v23 adicionado ao global.css." -ForegroundColor Green
  } else {
    Write-Host "CSS v23 ja estava aplicado." -ForegroundColor Yellow
  }
}

# -----------------------------
# Usuarios
# -----------------------------
$usuariosPath = "src/pages/cadastros/Usuarios.tsx"
if (Test-Path $usuariosPath) {
  $content = Get-Content $usuariosPath -Raw

  # Icone de celular
  if ($content -notmatch "Smartphone") {
    $content = $content -replace "Phone,", "Phone,`r`n  Smartphone,"
  }
  $content = $content -replace "if \(tipo === 'WhatsApp'\) return <Phone size=\{17\} />;\s*", ""
  $content = $content -replace "return <Phone size=\{17\} />;", "return <Smartphone size={17} />;"

  # Tipos de telefone: remove WhatsApp
  $content = $content -replace "'Celular' \| 'Fixo' \| 'WhatsApp' \| 'Comercial'", "'Celular' | 'Fixo' | 'Comercial'"
  $content = $content -replace "\s*<option>WhatsApp</option>", ""

  # Sexo -> Genero
  $content = $content -replace "sexo", "genero"
  $content = $content -replace "Sexo", "Gênero"
  $content = $content -replace "sexos", "generos"
  $content = $content -replace "const generos = \[[^\]]+\];", "const generos = ['Feminino', 'Masculino'];"
  $content = $content -replace "Informação cadastral opcional para identificação do usuário\.", "Informação cadastral objetiva do usuário."

  # Unidade deixa de ser obrigatoria
  $content = $content -replace "if \(!form\.unidade\.trim\(\)\) nextErrors\.unidade = 'Unidade é obrigatória\.';\s*", ""
  $content = $content -replace "<FieldLabel required info=\"Obrigatório\. Define a principal lotação operacional do usuário\.\">Unidade</FieldLabel>", "<FieldLabel info=\"Opcional. Define a principal lotação operacional do usuário quando existir mais de uma unidade.\">Unidade</FieldLabel>"
  $content = $content -replace "\{errors\.unidade && <small className=\"field-error\">\{errors\.unidade\}</small>\}", ""

  # Lista de paises com bandeira e Brasil padrao
  $oldCountries = @'
<option value="+55">🇧🇷 +55</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+351">🇵🇹 +351</option>
                      <option value="+54">🇦🇷 +54</option>
'@
  $newCountries = @'
<option value="+55">🇧🇷 +55 — Brasil</option>
                      <option value="+1">🇺🇸 +1 — Estados Unidos/Canadá</option>
                      <option value="+351">🇵🇹 +351 — Portugal</option>
                      <option value="+54">🇦🇷 +54 — Argentina</option>
                      <option value="+56">🇨🇱 +56 — Chile</option>
                      <option value="+598">🇺🇾 +598 — Uruguai</option>
                      <option value="+595">🇵🇾 +595 — Paraguai</option>
                      <option value="+591">🇧🇴 +591 — Bolívia</option>
                      <option value="+51">🇵🇪 +51 — Peru</option>
                      <option value="+57">🇨🇴 +57 — Colômbia</option>
                      <option value="+58">🇻🇪 +58 — Venezuela</option>
                      <option value="+52">🇲🇽 +52 — México</option>
                      <option value="+44">🇬🇧 +44 — Reino Unido</option>
                      <option value="+34">🇪🇸 +34 — Espanha</option>
                      <option value="+33">🇫🇷 +33 — França</option>
                      <option value="+49">🇩🇪 +49 — Alemanha</option>
                      <option value="+39">🇮🇹 +39 — Itália</option>
                      <option value="+81">🇯🇵 +81 — Japão</option>
                      <option value="+86">🇨🇳 +86 — China</option>
                      <option value="+91">🇮🇳 +91 — Índia</option>
                      <option value="+61">🇦🇺 +61 — Austrália</option>
                      <option value="+27">🇿🇦 +27 — África do Sul</option>
'@
  $content = $content.Replace($oldCountries, $newCountries)

  Set-Content $usuariosPath $content -Encoding UTF8
  Write-Host "OK Usuarios: telefone/genero/unidade ajustados." -ForegroundColor Green
}

# -----------------------------
# Unidades
# -----------------------------
$unidadesPath = "src/pages/cadastros/UnidadesCentrosCusto.tsx"
if (Test-Path $unidadesPath) {
  $content = Get-Content $unidadesPath -Raw

  # Remove estados/filtros de Cidade/UF
  $content = $content -replace "\s*const \[cidadeUf, setCidadeUf\] = useState\(''\);", ""
  $content = $content -replace "\s*const cidadeFilter = normalizeFilterText\(cidadeUf\);", ""
  $content = $content -replace "\s*&& \(!cidadeFilter \|\| normalizeFilterText\(`\$\{unit\.cidade\}/\$\{unit\.uf\}`\)\.includes\(cidadeFilter\)\)", ""
  $content = $content -replace "\s*<input className=\"city-filter\"[^>]+/>", ""

  # Remove codigo interno e unidade superior do cadastro e detalhes
  $content = $content -replace "\s*codigoInterno: string;", ""
  $content = $content -replace "\s*unidadeSuperior: string;", ""
  $content = $content -replace "\s*codigoInterno: '',", ""
  $content = $content -replace "\s*unidadeSuperior: '',", ""
  $content = $content -replace "\s*codigoInterno: '[^']*',", ""
  $content = $content -replace "\s*unidadeSuperior: '[^']*',", ""
  $content = $content -replace "unit\.codigoInterno \|\| unit\.id", "unit.id"
  $content = $content -replace "\s*<span>Superior</span><strong>\{selectedUnit\.unidadeSuperior \|\| '-'\}</strong>", ""

  # Remove campos visualmente do formulario
  $content = $content -replace "(?s)\s*<label>\s*<FieldLabel info=\"Código próprio usado pela empresa, cliente ou integração\.\">Código interno</FieldLabel>\s*<input value=\{form\.codigoInterno\}[^<]+/>\s*</label>", ""
  $content = $content -replace "(?s)\s*<label>\s*<FieldLabel info=\"Permite montar hierarquia entre matriz, filial e demais unidades\.\">Unidade superior</FieldLabel>\s*<input value=\{form\.unidadeSuperior\}[^<]+/>\s*</label>", ""

  # Dados complementares sem tipo no titulo e sem responsavel legal
  $content = $content -replace "Dados complementares — \{form\.tipo\}", "Dados complementares"
  $content = $content -replace "\s*\['responsavelLegal', 'Responsável legal'\],", ""

  # Reordena grandes blocos na modal: Contatos e Setores antes de Endereço
  $blocks = [regex]::Matches($content, "(?s)<section className=\"unit-form-section\">\s*<h3>(Contatos|Endereço e localização)</h3>.*?</section>|<section className=\"unit-form-section\">\s*<div className=\"section-title-row\">\s*<h3>(Setores|Endereço e localização)</h3>.*?</section>")
  # Mantem a estrutura atual se a reordenação por regex não for segura; a versão visual será corrigida por CSS/validação posterior.

  # Acoes da lista: remove e-mail e mais acoes
  $content = $content -replace "\s*<button title=\"Enviar e-mail\"><Mail size=\{16\} /></button>", ""
  $content = $content -replace "\s*<button title=\"Mais ações\"><MoreHorizontal size=\{16\} /></button>", ""
  $content = $content -replace "<button title=\"Abrir detalhe\"><ExternalLink size=\{16\} /></button>", "<button title=\"Editar unidade\"><ExternalLink size={16} /></button>"

  # Textos importacao/exportacao
  $content = $content -replace "Importe uma lista de unidades em XLSX, XLS ou CSV\. O modelo deve conter nome, tipo, status, responsável, contatos, endereço e setores\.", "Use a importação para cadastrar ou atualizar unidades em lote. Baixe o modelo, preencha as colunas obrigatórias e envie o arquivo em XLSX, XLS ou CSV. A validação será feita antes da gravação para apontar campos ausentes, tipos inválidos e endereços incompletos."
  $content = $content -replace "Escolha o formato e o escopo da exportação\.", "Gere um arquivo com os dados das unidades conforme os filtros aplicados na tela. Escolha o formato desejado para análise, conferência, auditoria ou compartilhamento com outras áreas."
  $content = $content -replace "(?s)\s*<div className=\"export-scope-row\">.*?</div>", ""

  # Remove imports que podem ficar sem uso, para evitar erro caso strict volte
  $content = $content -replace "\s*Mail,", ""
  $content = $content -replace "\s*MoreHorizontal,", ""

  Set-Content $unidadesPath $content -Encoding UTF8
  Write-Host "OK Unidades: campos, acoes e textos ajustados." -ForegroundColor Green
}

Write-Host "v23 aplicado. Rode npm run build." -ForegroundColor Cyan
