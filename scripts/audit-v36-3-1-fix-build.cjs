const fs = require('fs');
const path = require('path');

const root = process.cwd();
const reportFiles = [
  'src/pages/relatorios/RelatorioAlertas.tsx',
  'src/pages/relatorios/RelatorioAtendimentos.tsx',
  'src/pages/relatorios/RelatorioAuditoria.tsx',
  'src/pages/relatorios/RelatorioConhecimentos.tsx',
  'src/pages/relatorios/RelatorioIntegracoes.tsx',
  'src/pages/relatorios/RelatorioTarefas.tsx',
];

for (const rel of reportFiles) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.error(`ERRO arquivo ausente: ${rel}`);
    process.exit(1);
  }
  const content = fs.readFileSync(full, 'utf8');
  if (content.includes('typeOptions=[')) {
    console.error(`ERRO JSX inválido em ${rel}: typeOptions=[`);
    process.exit(1);
  }
  if (!content.includes('typeOptions={[')) {
    console.error(`ERRO typeOptions corrigido não encontrado em ${rel}`);
    process.exit(1);
  }
}

const integracoesPath = path.join(root, 'src', 'pages', 'parametrizacao', 'Integracoes.tsx');
if (fs.existsSync(integracoesPath)) {
  const content = fs.readFileSync(integracoesPath, 'utf8');
  if (content.includes("'danger'")) {
    console.error('ERRO: ainda existe toast danger em Integracoes.tsx.');
    process.exit(1);
  }
}

console.log('Auditoria v36.3.1 limpa.');
