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

copy('src/styles/v29_4_v34_4_dark_menu.css', 'src/styles/v29_4_v34_4_dark_menu.css');
copy('docs/v29-4-v34-4-dark-menu-integracoes.md', 'docs/v29-4-v34-4-dark-menu-integracoes.md');

// importa CSS
const main = path.join(root, 'src', 'main.tsx');
if (fs.existsSync(main)) {
  let text = readUtf8(main);
  if (!text.includes('./styles/v29_4_v34_4_dark_menu.css')) {
    text = `import './styles/v29_4_v34_4_dark_menu.css';\n${text}`;
    writeUtf8(main, text);
    console.log('import CSS dark/menu adicionado em src/main.tsx');
  }
}

// integrações abertas por padrão
const integrationFiles = [
  path.join(root, 'src', 'pages', 'Integracoes.tsx'),
  path.join(root, 'src', 'pages', 'parametrizacao', 'Integracoes.tsx'),
];

for (const file of integrationFiles) {
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
    console.log(`integrações abertas por padrão: ${path.relative(root, file)}`);
  }
}

// Layout: remove duplicação e marca itens sem expansão quando possível.
const layout = path.join(root, 'src', 'components', 'Layout.tsx');
if (fs.existsSync(layout)) {
  let text = readUtf8(layout);
  const original = text;

  text = text
    .split('Canais de Atendimento de Atendimento')
    .join('Canais de Atendimento');

  // Se houver renderização de classe por label, acrescenta classe auxiliar em itens sem submenu.
  // Estratégia conservadora: não remove lógica nem ícones; apenas fornece classe quando o texto já contém item.label.
  if (!text.includes('sidebar-no-expand')) {
    text = text.replace(
      /(className=\{[^}]*)(\}\s*>[\s\S]{0,160}\{item\.label\})/,
      (match) => match
    );

    // Tentativa segura em layouts que montam className por template string com item.children.
    text = text.replace(
      /className=\{`([^`]*sidebar[^`]*?)`\}/g,
      "className={`${['Área de Trabalho', 'Roadmap'].includes(item.label) ? 'sidebar-no-expand ' : ''}$1`}"
    );

    text = text.replace(
      /className=\{`([^`]*nav[^`]*?)`\}/g,
      "className={`${['Área de Trabalho', 'Roadmap'].includes(item.label) ? 'sidebar-no-expand ' : ''}$1`}"
    );
  }

  if (text !== original) {
    writeUtf8(layout, text);
    console.log('layout revisado: src/components/Layout.tsx');
  }
}

console.log('v29.4-v34.4 aplicado. Rode npm run build.');
