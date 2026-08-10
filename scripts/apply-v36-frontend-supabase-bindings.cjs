const fs = require('fs');
const path = require('path');

const root = process.cwd();
const payloadRoot = path.join(root, '_payload');
const packagePayloadRoot = path.join(__dirname, '..', '_payload');
const sourceRoot = fs.existsSync(payloadRoot) ? payloadRoot : packagePayloadRoot;

const files = [
  'src/services/v35Supabase.ts',
  'src/pages/parametrizacao/Integracoes.tsx',
  'src/pages/parametrizacao/Canais.tsx',
  'src/pages/parametrizacao/Agentes.tsx',
  'src/pages/cadastros/CamposContexto.tsx',
  'src/styles/v36_supabase_bindings.css',
];

function copyFile(rel) {
  const from = path.join(sourceRoot, rel);
  const to = path.join(root, rel);
  if (!fs.existsSync(from)) throw new Error(`Payload não encontrado: ${rel}`);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (fs.existsSync(to)) fs.copyFileSync(to, `${to}.bak-v36`);
  fs.copyFileSync(from, to);
  console.log(`OK ${rel}`);
}

files.forEach(copyFile);

const mainPath = path.join(root, 'src', 'main.tsx');
if (!fs.existsSync(mainPath)) throw new Error('src/main.tsx não encontrado.');
let main = fs.readFileSync(mainPath, 'utf8');
const importLine = "import './styles/v36_supabase_bindings.css';";
if (!main.includes(importLine)) {
  if (main.includes("import './styles/global.css';")) {
    main = main.replace("import './styles/global.css';", "import './styles/global.css';\n" + importLine);
  } else {
    const lines = main.split(/\r?\n/);
    let idx = 0;
    while (idx < lines.length && lines[idx].startsWith('import ')) idx++;
    lines.splice(idx, 0, importLine);
    main = lines.join('\n');
  }
  fs.copyFileSync(mainPath, `${mainPath}.bak-v36`);
  fs.writeFileSync(mainPath, main, 'utf8');
  console.log('OK src/main.tsx import v36');
} else {
  console.log('- sem mudança src/main.tsx import v36');
}

console.log('v36 aplicado. Rode npm run build e npm run dev.');
