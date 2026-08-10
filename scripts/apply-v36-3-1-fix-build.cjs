const fs = require('fs');
const path = require('path');

const root = process.cwd();
const payload = path.join(__dirname, '..', '_payload');

const files = [
  'src/pages/relatorios/RelatorioAlertas.tsx',
  'src/pages/relatorios/RelatorioAtendimentos.tsx',
  'src/pages/relatorios/RelatorioAuditoria.tsx',
  'src/pages/relatorios/RelatorioConhecimentos.tsx',
  'src/pages/relatorios/RelatorioIntegracoes.tsx',
  'src/pages/relatorios/RelatorioTarefas.tsx',
  'src/pages/RelatorioAlertas.tsx',
  'src/pages/RelatorioAtendimentos.tsx',
  'src/pages/RelatorioAuditoria.tsx',
  'src/pages/RelatorioConhecimentos.tsx',
  'src/pages/RelatorioIntegracoes.tsx',
  'src/pages/RelatorioTarefas.tsx',
];

for (const rel of files) {
  const from = path.join(payload, rel);
  const to = path.join(root, rel);
  if (!fs.existsSync(from)) {
    console.log(`- payload ausente: ${rel}`);
    continue;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (fs.existsSync(to)) fs.copyFileSync(to, `${to}.bak-v36-3-1`);
  fs.copyFileSync(from, to);
  console.log(`OK ${rel}`);
}

// Corrige toast do v36.2, caso ainda esteja no arquivo local.
const integracoesPath = path.join(root, 'src', 'pages', 'parametrizacao', 'Integracoes.tsx');
if (fs.existsSync(integracoesPath)) {
  let content = fs.readFileSync(integracoesPath, 'utf8');
  const before = content;
  content = content.replace(/,\s*'danger'\)/g, ", 'error')");
  if (content !== before) {
    fs.copyFileSync(integracoesPath, `${integracoesPath}.bak-v36-3-1`);
    fs.writeFileSync(integracoesPath, content, 'utf8');
    console.log('OK src/pages/parametrizacao/Integracoes.tsx toast danger -> error');
  } else {
    console.log('- sem mudança src/pages/parametrizacao/Integracoes.tsx');
  }
}

console.log('v36.3.1 aplicado. Rode npm run build.');
