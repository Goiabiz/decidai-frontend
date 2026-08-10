const fs = require('fs');
const path = require('path');

const root = process.cwd();

const checks = [
  ['src/lib/v36SecureApiFunctions.ts', 'from "./supabase"'],
  ['src/pages/parametrizacao/Integracoes.tsx', 'saveApiGuidedConnection'],
  ['src/pages/parametrizacao/Integracoes.tsx', 'testApiGuidedConnection'],
  ['src/styles/v36_2_secure_api_actions.css', 'v36-test-preview'],
];

for (const [file, pattern] of checks) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    console.error(`ERRO arquivo ausente: ${file}`);
    process.exit(1);
  }
  const content = fs.readFileSync(full, 'utf8');
  if (!content.includes(pattern)) {
    console.error(`ERRO padrão não encontrado em ${file}: ${pattern}`);
    process.exit(1);
  }
}

console.log('Auditoria v36.2 limpa.');
