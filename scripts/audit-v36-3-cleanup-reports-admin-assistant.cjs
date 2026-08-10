const fs = require('fs');
const path = require('path');

const root = process.cwd();
const checks = [
  ['src/components/ExportAction.tsx', 'export function ExportAction'],
  ['src/components/ExportAction.tsx', 'export const ExportButton'],
  ['src/pages/Administracao.tsx', 'Responsáveis padrão'],
  ['src/pages/relatorios/StandardReportPage.tsx', 'Filtros da consulta'],
  ['src/pages/relatorios/RelatorioPersonalizado.tsx', 'v363-builder-box'],
  ['src/components/FloatingPlatformAssistant.tsx', 'v363-assistant'],
  ['src/styles/v36_3_cleanup.css', 'v363-export-main'],
];

for (const [rel, text] of checks) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.error(`ERRO arquivo ausente: ${rel}`);
    process.exit(1);
  }
  const content = fs.readFileSync(full, 'utf8');
  if (!content.includes(text)) {
    console.error(`ERRO conteúdo esperado não encontrado em ${rel}: ${text}`);
    process.exit(1);
  }
}

console.log('Auditoria v36.3 limpa.');
