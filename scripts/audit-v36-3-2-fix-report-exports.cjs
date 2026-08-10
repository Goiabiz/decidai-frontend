const fs = require('fs');
const path = require('path');

const root = process.cwd();
const reports = [
  'RelatorioAlertas',
  'RelatorioAtendimentos',
  'RelatorioAuditoria',
  'RelatorioConhecimentos',
  'RelatorioIntegracoes',
  'RelatorioTarefas',
];

for (const name of reports) {
  const rel = `src/pages/relatorios/${name}.tsx`;
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.error(`ERRO arquivo ausente: ${rel}`);
    process.exit(1);
  }

  const content = fs.readFileSync(full, 'utf8');
  if (!content.includes(`export function ${name}`)) {
    console.error(`ERRO export nomeado ausente em ${rel}`);
    process.exit(1);
  }
  if (!content.includes(`export default ${name}`)) {
    console.error(`ERRO export default ausente em ${rel}`);
    process.exit(1);
  }
  if (content.includes('typeOptions=[')) {
    console.error(`ERRO JSX inválido em ${rel}: typeOptions=[`);
    process.exit(1);
  }
}

console.log('Auditoria v36.3.2 limpa.');
