const fs = require('fs');
const path = require('path');

const root = process.cwd();
const badPatterns = ['Ãƒ', 'Ã§', 'Ã£', 'Ã¡', 'Ã©', 'Ãª', 'Ã­', 'Ã³', 'Ãµ', 'Ãº', 'Â'];
const ignored = [
  path.join('src', 'utils', 'textEncoding.ts').split(path.sep).join('/'),
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx|css)$/.test(entry.name)) out.push(full);
  }

  return out;
}

let failed = false;

for (const file of walk(path.join(root, 'src'))) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  if (ignored.includes(rel)) continue;

  const content = fs.readFileSync(file, 'utf8');

  if (content.charCodeAt(0) === 0xfeff) {
    console.error(`BOM encontrado: ${rel}`);
    failed = true;
  }

  for (const pattern of badPatterns) {
    if (content.includes(pattern)) {
      console.error(`Possível mojibake em ${rel}: ${pattern}`);
      failed = true;
      break;
    }
  }

  if (content.includes('window.confirm')) {
    console.error(`window.confirm encontrado: ${rel}`);
    failed = true;
  }

  if (content.includes('replaceAll(')) {
    console.error(`replaceAll encontrado: ${rel}`);
    failed = true;
  }

  if (content.includes(' as any')) {
    console.error(`as any encontrado: ${rel}`);
    failed = true;
  }
}

if (failed) {
  process.exitCode = 1;
  console.error('Auditoria v29.4-v34 encontrou pontos a revisar.');
} else {
  console.log('Auditoria v29.4-v34 limpa.');
}
