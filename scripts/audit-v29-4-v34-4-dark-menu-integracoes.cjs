const fs = require('fs');
const path = require('path');

const root = process.cwd();
let failed = false;

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

const main = read(path.join(root, 'src', 'main.tsx'));
if (!main.includes('./styles/v29_4_v34_4_dark_menu.css')) {
  console.error('ERRO: CSS v29_4_v34_4_dark_menu não importado no main.tsx');
  failed = true;
}

const layout = read(path.join(root, 'src', 'components', 'Layout.tsx'));
if (layout.includes('Canais de Atendimento de Atendimento')) {
  console.error('ERRO: ainda existe Canais de Atendimento de Atendimento no Layout.');
  failed = true;
}

for (const rel of ['src/pages/Integracoes.tsx', 'src/pages/parametrizacao/Integracoes.tsx']) {
  const text = read(path.join(root, rel));
  if (!text) continue;
  if (text.includes('Boolean(category.defaultOpen)')) {
    console.error(`ERRO: ${rel} ainda usa defaultOpen para iniciar fechado.`);
    failed = true;
  }
}

const badEncoding = ['Ãƒ', 'Ã§', 'Ã£', 'Ã¡', 'Ã©', 'Ãª', 'Ã­', 'Ã³', 'Ãµ', 'Ãº', 'Â'];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (/\.(ts|tsx|css)$/.test(entry.name)) files.push(full);
  }
  return files;
}

for (const file of walk(path.join(root, 'src'))) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  if (rel === 'src/utils/textEncoding.ts') continue;
  const text = fs.readFileSync(file, 'utf8');

  if (text.charCodeAt(0) === 0xfeff) {
    console.error(`ERRO: BOM encontrado em ${rel}`);
    failed = true;
  }

  for (const pattern of badEncoding) {
    if (text.includes(pattern)) {
      console.error(`ERRO: possível mojibake em ${rel}: ${pattern}`);
      failed = true;
      break;
    }
  }
}

if (failed) {
  process.exitCode = 1;
  console.error('Auditoria v29.4-v34.4 encontrou pontos a revisar.');
} else {
  console.log('Auditoria v29.4-v34.4 limpa.');
}
