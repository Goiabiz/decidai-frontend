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
  ['src/styles/v29_4_v34_4_dark_menu.css', 'src/styles/v29_4_v34_4_dark_menu.css'],
  ['docs/v29-4-v34-3-plugin-catalog-integracoes.md', 'docs/v29-4-v34-3-plugin-catalog-integracoes.md'],
  ['docs/v29-4-v34-4-dark-menu-integracoes.md', 'docs/v29-4-v34-4-dark-menu-integracoes.md'],
].forEach(([from, to]) => copy(from, to));

const main = path.join(root, 'src', 'main.tsx');
if (fs.existsSync(main)) {
  let text = readUtf8(main);

  if (!text.includes('./styles/v29_4_v34_3_plugin_catalog.css')) {
    text = `import './styles/v29_4_v34_3_plugin_catalog.css';\n${text}`;
  }

  if (!text.includes('./styles/v29_4_v34_4_dark_menu.css')) {
    text = `import './styles/v29_4_v34_4_dark_menu.css';\n${text}`;
  }

  writeUtf8(main, text);
  console.log('CSS v34.3/v34.4 revisado importado em src/main.tsx');
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

// Mantém integrações abertas por padrão.
for (const relativePath of ['src/pages/Integracoes.tsx', 'src/pages/parametrizacao/Integracoes.tsx']) {
  const file = path.join(root, relativePath);
  if (!fs.existsSync(file)) continue;

  let text = readUtf8(file);
  const original = text;

  text = text.replace(
    /Object\.fromEntries\(integrationCategories\.map\(\(category\)\s*=>\s*\[category\.code,\s*Boolean\(category\.defaultOpen\)\]\)\)/g,
    "Object.fromEntries(integrationCategories.map((category) => [category.code, true]))"
  );

  text = text.replace(
    /const isOpen = normalizedQuery \? true : openSections\[category\.code\];/g,
    "const isOpen = normalizedQuery ? true : openSections[category.code] !== false;"
  );

  if (text !== original) {
    writeUtf8(file, text);
    console.log(`integrações abertas por padrão: ${relativePath}`);
  }
}

console.log('v29.4-v34.4 revisado aplicado. Rode npm run build.');
