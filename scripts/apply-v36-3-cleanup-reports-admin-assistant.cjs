const fs = require('fs');
const path = require('path');

const root = process.cwd();
const payload = path.join(__dirname, '..', '_payload');

const files = [
  'src/components/ExportAction.tsx',
  'src/components/FloatingPlatformAssistant.tsx',
  'src/pages/Administracao.tsx',
  'src/pages/parametrizacao/Administracao.tsx',
  'src/pages/relatorios/StandardReportPage.tsx',
  'src/pages/relatorios/RelatorioPersonalizado.tsx',
  'src/pages/RelatorioPersonalizado.tsx',
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
  'src/styles/v36_3_cleanup.css',
];

for (const rel of files) {
  const from = path.join(payload, rel);
  const to = path.join(root, rel);
  if (!fs.existsSync(from)) {
    console.log(`- payload ausente, ignorado ${rel}`);
    continue;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (fs.existsSync(to)) fs.copyFileSync(to, `${to}.bak-v36-3`);
  fs.copyFileSync(from, to);
  console.log(`OK ${rel}`);
}

const mainPath = path.join(root, 'src', 'main.tsx');
let main = fs.readFileSync(mainPath, 'utf8');
const importLine = "import './styles/v36_3_cleanup.css';";
if (!main.includes(importLine)) {
  const lines = main.split(/\r?\n/);
  let insertAt = 0;
  while (insertAt < lines.length && lines[insertAt].startsWith('import ')) insertAt++;
  lines.splice(insertAt, 0, importLine);
  fs.copyFileSync(mainPath, `${mainPath}.bak-v36-3`);
  fs.writeFileSync(mainPath, lines.join('\n'), 'utf8');
  console.log('OK src/main.tsx import v36.3');
} else {
  console.log('- sem mudança src/main.tsx import v36.3');
}

console.log('v36.3 aplicado. Rode npm run build e npm run dev.');
