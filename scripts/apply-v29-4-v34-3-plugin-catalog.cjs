const fs = require('fs');
const path = require('path');

const root = process.cwd();
const packageRoot = path.join(__dirname, '..');

function readUtf8(file) {
  return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
}

function writeUtf8(file, content) {
  fs.writeFileSync(file, content.replace(/^\uFEFF/, ''), 'utf8');
}

function copy(from, to) {
  const src = path.join(packageRoot, from);
  const dest = path.join(root, to);
  if (!fs.existsSync(src)) {
    console.warn(`ignorado: ${from}`);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`copiado: ${to}`);
}

[
  ['src/lib/brandIcons.tsx', 'src/lib/brandIcons.tsx'],
  ['src/lib/integrationCatalog.ts', 'src/lib/integrationCatalog.ts'],
  ['src/pages/Integracoes.tsx', 'src/pages/Integracoes.tsx'],
  ['src/pages/parametrizacao/Integracoes.tsx', 'src/pages/parametrizacao/Integracoes.tsx'],
  ['src/styles/v29_4_v34_3_plugin_catalog.css', 'src/styles/v29_4_v34_3_plugin_catalog.css'],
  ['docs/v29-4-v34-3-plugin-catalog-integracoes.md', 'docs/v29-4-v34-3-plugin-catalog-integracoes.md'],
].forEach(([from, to]) => copy(from, to));

const main = path.join(root, 'src', 'main.tsx');
if (fs.existsSync(main)) {
  let text = readUtf8(main);
  if (!text.includes('./styles/v29_4_v34_3_plugin_catalog.css')) {
    text = `import './styles/v29_4_v34_3_plugin_catalog.css';\n${text}`;
    writeUtf8(main, text);
    console.log('import CSS plugin catalog adicionado em src/main.tsx');
  }
}

const layout = path.join(root, 'src', 'components', 'Layout.tsx');
if (fs.existsSync(layout)) {
  let text = readUtf8(layout);
  const original = text;
  text = text
    .split('Canais de Atendimento de Atendimento')
    .join('Canais de Atendimento');

  if (text !== original) {
    writeUtf8(layout, text);
    console.log('corrigido: src/components/Layout.tsx');
  }
}

const app = path.join(root, 'src', 'App.tsx');
if (fs.existsSync(app)) {
  let text = readUtf8(app);
  const original = text;
  text = text
    .split("import { Canais de Atendimento } from './pages/parametrizacao/Canais de Atendimento';")
    .join("import { Canais } from './pages/parametrizacao/Canais';")
    .split('import { Canais de Atendimento } from "./pages/parametrizacao/Canais de Atendimento";')
    .join('import { Canais } from "./pages/parametrizacao/Canais";')
    .split('{ Canais de Atendimento }')
    .join('{ Canais }')
    .split('<Canais de Atendimento')
    .join('<Canais')
    .split('Canais de Atendimento de Atendimento')
    .join('Canais de Atendimento');

  if (text !== original) {
    writeUtf8(app, text);
    console.log('corrigido: src/App.tsx');
  }
}

console.log('v29.4-v34.3 aplicado. Rode npm run build.');
