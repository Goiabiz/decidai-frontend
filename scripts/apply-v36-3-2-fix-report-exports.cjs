const fs = require('fs');
const path = require('path');

const root = process.cwd();
const payload = path.join(__dirname, '..', '_payload');

const reports = [
  'RelatorioAlertas',
  'RelatorioAtendimentos',
  'RelatorioAuditoria',
  'RelatorioConhecimentos',
  'RelatorioIntegracoes',
  'RelatorioTarefas',
];

for (const name of reports) {
  for (const rel of [`src/pages/relatorios/${name}.tsx`, `src/pages/${name}.tsx`]) {
    const from = path.join(payload, rel);
    const to = path.join(root, rel);
    if (!fs.existsSync(from)) {
      console.error(`Payload ausente: ${rel}`);
      process.exit(1);
    }
    fs.mkdirSync(path.dirname(to), { recursive: true });
    if (fs.existsSync(to)) fs.copyFileSync(to, `${to}.bak-v36-3-2`);
    fs.copyFileSync(from, to);
    console.log(`OK ${rel}`);
  }
}

// Corrige o App.tsx preventivamente, caso algum import tenha sido alterado para default por outro patch.
const appPath = path.join(root, 'src', 'App.tsx');
if (fs.existsSync(appPath)) {
  let app = fs.readFileSync(appPath, 'utf8');
  const before = app;
  for (const name of reports) {
    const re = new RegExp(`import\\s+${name}\\s+from\\s+['"]\\\\./pages/relatorios/${name}['"];`, 'g');
    app = app.replace(re, `import { ${name} } from './pages/relatorios/${name}';`);
  }
  if (app !== before) {
    fs.copyFileSync(appPath, `${appPath}.bak-v36-3-2`);
    fs.writeFileSync(appPath, app, 'utf8');
    console.log('OK src/App.tsx imports nomeados');
  } else {
    console.log('- sem mudança src/App.tsx');
  }
}

console.log('v36.3.2 aplicado. Rode npm run build.');
