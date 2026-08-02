const fs = require('fs');
const path = require('path');
const root = process.cwd();
const checks = [
  { file: 'src/App.tsx', pattern: /import\s+\{\s*AnaliseAcoes\s*\}\s+from\s+['"]\.\/pages\/AnaliseAcoes['"];/, msg: 'App.tsx ainda importa AnaliseAcoes como named import.' },
  { file: 'src/pages/parametrizacao/Canais.tsx', pattern: /\.replaceAll\(/, msg: 'parametrizacao/Canais.tsx ainda usa replaceAll.' },
  { file: 'src/pages/Canais.tsx', pattern: /\.replaceAll\(/, msg: 'Canais.tsx ainda usa replaceAll.' },
  { file: 'src/App.tsx', pattern: /Canais\s+de\s+Atendimento/, msg: 'App.tsx ainda contém identificador inválido com espaço.' },
];
let errors = 0;
for (const check of checks) {
  const p = path.join(root, check.file);
  if (!fs.existsSync(p)) continue;
  const content = fs.readFileSync(p, 'utf8');
  if (check.pattern.test(content)) {
    console.error('ERRO:', check.msg);
    errors++;
  }
}
if (errors) {
  console.error(`${errors} pendência(s) encontrada(s).`);
  process.exit(1);
}
console.log('Auditoria v34.6.1 limpa. Rode npm run build para validação final.');
