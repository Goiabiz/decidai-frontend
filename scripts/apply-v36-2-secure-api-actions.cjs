const fs = require('fs');
const path = require('path');

const root = process.cwd();
const payload = path.join(__dirname, '..', '_payload');

function copy(rel) {
  const from = path.join(payload, rel);
  const to = path.join(root, rel);
  if (!fs.existsSync(from)) throw new Error(`Payload ausente: ${rel}`);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (fs.existsSync(to)) fs.copyFileSync(to, `${to}.bak-v36-2`);
  fs.copyFileSync(from, to);
  console.log(`OK ${rel}`);
}

copy('src/lib/v36SecureApiFunctions.ts');
copy('src/pages/parametrizacao/Integracoes.tsx');
copy('src/styles/v36_2_secure_api_actions.css');

const mainPath = path.join(root, 'src', 'main.tsx');
let main = fs.readFileSync(mainPath, 'utf8');
const importLine = "import './styles/v36_2_secure_api_actions.css';";
if (!main.includes(importLine)) {
  const lines = main.split(/\r?\n/);
  let insertAt = 0;
  while (insertAt < lines.length && lines[insertAt].startsWith('import ')) insertAt++;
  lines.splice(insertAt, 0, importLine);
  fs.copyFileSync(mainPath, `${mainPath}.bak-v36-2`);
  fs.writeFileSync(mainPath, lines.join('\n'), 'utf8');
  console.log('OK src/main.tsx import v36.2');
} else {
  console.log('- sem mudança src/main.tsx import v36.2');
}

console.log('v36.2 aplicado. Rode npm run build e npm run dev.');
