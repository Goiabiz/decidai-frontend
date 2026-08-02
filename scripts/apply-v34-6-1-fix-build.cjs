const fs = require('fs');
const path = require('path');

const root = process.cwd();
const utf8 = 'utf8';

function file(p) { return path.join(root, p); }
function exists(p) { return fs.existsSync(file(p)); }
function read(p) { return fs.readFileSync(file(p), utf8); }
function write(p, content) { fs.writeFileSync(file(p), content, { encoding: utf8 }); }
function replaceInFile(p, replacer) {
  if (!exists(p)) return false;
  const before = read(p);
  const after = replacer(before);
  if (after !== before) {
    write(p, after);
    console.log(`OK ${p}`);
    return true;
  }
  console.log(`- sem mudança ${p}`);
  return false;
}

console.log('Aplicando v34.6.1 - correção de build...');

// 1) AnaliseAcoes é export default no projeto atual. O App estava importando como named import.
replaceInFile('src/App.tsx', (content) => {
  return content
    .replace("import { AnaliseAcoes } from './pages/AnaliseAcoes';", "import AnaliseAcoes from './pages/AnaliseAcoes';")
    .replace('import { AnaliseAcoes } from "./pages/AnaliseAcoes";', 'import AnaliseAcoes from "./pages/AnaliseAcoes";');
});

// 2) replaceAll não é suportado pelo alvo TS atual. Troca por split/join sem mudar comportamento.
for (const p of ['src/pages/parametrizacao/Canais.tsx', 'src/pages/Canais.tsx']) {
  replaceInFile(p, (content) => {
    return content
      .replace(/\.replaceAll\(' ',\s*'-'\)/g, ".split(' ').join('-')")
      .replace(/\.replaceAll\(" ",\s*"-"\)/g, '.split(" ").join("-")')
      .replace(/\.replaceAll\(' ',\s*''\)/g, ".split(' ').join('')")
      .replace(/\.replaceAll\(" ",\s*""\)/g, '.split(" ").join("")');
  });
}

// 3) Segurança: remove qualquer import inválido gerado anteriormente com espaços no identificador.
replaceInFile('src/App.tsx', (content) => {
  return content
    .replace(/^import\s+\{\s*Canais\s+de\s+Atendimento\s+\}\s+from\s+['"][^'"]+['"];\s*\r?\n/gm, '')
    .replace(/^import\s+Canais\s+de\s+Atendimento\s+from\s+['"][^'"]+['"];\s*\r?\n/gm, '');
});

console.log('v34.6.1 aplicado. Rode npm run build.');
