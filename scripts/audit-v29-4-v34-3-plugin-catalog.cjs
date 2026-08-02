const fs = require('fs');
const path = require('path');

const root = process.cwd();
let failed = false;

const forbidden = [
  ['src/components/Layout.tsx', 'Canais de Atendimento de Atendimento'],
  ['src/App.tsx', 'Canais de Atendimento }'],
  ['src/App.tsx', 'parametrizacao/Canais de Atendimento'],
  ['src/pages/Integracoes.tsx', 'marketplace-sidebar'],
  ['src/lib/integrationCatalog.ts', 'Telefone / Voz'],
  ['src/lib/integrationCatalog.ts', 'ElevenLabs'],
  ['src/lib/integrationCatalog.ts', 'Transcrição de áudio'],
  ['src/lib/integrationCatalog.ts', 'OCR'],
];

for (const [relativePath, pattern] of forbidden) {
  const file = path.join(root, relativePath);
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  if (text.includes(pattern)) {
    console.error(`ERRO: padrão indevido em ${relativePath}: ${pattern}`);
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
  console.error('Auditoria v29.4-v34.3 encontrou pontos a revisar.');
} else {
  console.log('Auditoria v29.4-v34.3 limpa.');
}
