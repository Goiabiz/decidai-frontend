const fs = require('fs');
const path = require('path');

const root = process.cwd();
const packageRoot = __dirname;

function copyFileSafe(from, to) {
  const src = path.join(packageRoot, '..', from);
  const dest = path.join(root, to);
  if (!fs.existsSync(src)) {
    console.warn(`ignorado: ${from} não encontrado no pacote`);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`copiado: ${to}`);
}

function readUtf8(file) {
  return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
}

function writeUtf8(file, content) {
  fs.writeFileSync(file, content.replace(/^\uFEFF/, ''), 'utf8');
}

const files = [
  ['src/lib/integrationCatalog.ts', 'src/lib/integrationCatalog.ts'],
  ['src/pages/Configuracoes.tsx', 'src/pages/Configuracoes.tsx'],
  ['src/pages/parametrizacao/Administracao.tsx', 'src/pages/parametrizacao/Administracao.tsx'],
  ['src/pages/Integracoes.tsx', 'src/pages/Integracoes.tsx'],
  ['src/pages/parametrizacao/Integracoes.tsx', 'src/pages/parametrizacao/Integracoes.tsx'],
  ['src/pages/Agentes.tsx', 'src/pages/Agentes.tsx'],
  ['src/pages/parametrizacao/Agentes.tsx', 'src/pages/parametrizacao/Agentes.tsx'],
  ['src/pages/Canais.tsx', 'src/pages/Canais.tsx'],
  ['src/pages/parametrizacao/Canais.tsx', 'src/pages/parametrizacao/Canais.tsx'],
  ['src/pages/Preferencias.tsx', 'src/pages/Preferencias.tsx'],
  ['src/pages/parametrizacao/Preferencias.tsx', 'src/pages/parametrizacao/Preferencias.tsx'],
  ['src/pages/parametrizacao/SegurancaAuditoria.tsx', 'src/pages/parametrizacao/SegurancaAuditoria.tsx'],
  ['src/pages/parametrizacao/Auditoria.tsx', 'src/pages/parametrizacao/Auditoria.tsx'],
  ['src/pages/cadastros/CamposContexto.tsx', 'src/pages/cadastros/CamposContexto.tsx'],
  ['src/pages/CamposContexto.tsx', 'src/pages/CamposContexto.tsx'],
  ['src/pages/Alertas.tsx', 'src/pages/Alertas.tsx'],
  ['src/pages/central/Alertas.tsx', 'src/pages/central/Alertas.tsx'],
  ['src/pages/relatorios/RelatorioPersonalizado.tsx', 'src/pages/relatorios/RelatorioPersonalizado.tsx'],
  ['src/styles/v29_4_v34.css', 'src/styles/v29_4_v34.css'],
  ['docs/v29-4-v34-consolidacao-cliente-api-agente.md', 'docs/v29-4-v34-consolidacao-cliente-api-agente.md'],
  ['database/01_migrations/023_026_consolidacao_integracoes_api_agente.sql', 'database/01_migrations/023_026_consolidacao_integracoes_api_agente.sql'],
  ['database/02_seeds/023_026_consolidacao_integracoes_api_agente_seed.sql', 'database/02_seeds/023_026_consolidacao_integracoes_api_agente_seed.sql'],
  ['database/03_scripts_operacionais/consultas_diagnostico/diagnostico_023_026_integracoes_api_agente.sql', 'database/03_scripts_operacionais/consultas_diagnostico/diagnostico_023_026_integracoes_api_agente.sql'],
];

for (const [from, to] of files) copyFileSafe(from, to);

// Garantir import do CSS no main.tsx sem usar PowerShell.
const mainPath = path.join(root, 'src', 'main.tsx');
if (fs.existsSync(mainPath)) {
  let main = readUtf8(mainPath);
  if (!main.includes('./styles/v29_4_v34.css') && !main.includes('./styles/v29_4_v34')) {
    main = `import './styles/v29_4_v34.css';\n${main}`;
    writeUtf8(mainPath, main);
    console.log('import CSS v29_4_v34 adicionado em src/main.tsx');
  }
}

// Patch leve no Layout/App para nomenclatura, sem tentar reconstruir navegação inteira.
const patchTargets = [
  path.join(root, 'src', 'App.tsx'),
  path.join(root, 'src', 'components', 'Layout.tsx'),
];

for (const file of patchTargets) {
  if (!fs.existsSync(file)) continue;
  let text = readUtf8(file);
  const original = text;

  const replacements = [
    ['Segurança / Auditoria', 'Auditoria'],
    ['Segurança/Auditoria', 'Auditoria'],
    ['Segurança', 'Auditoria'],
    ['Canais', 'Canais de Atendimento'],
    ['Contexto do Agente', 'Agentes'],
  ];

  for (const [from, to] of replacements) text = text.split(from).join(to);

  // Remoção conservadora de rótulos visuais que pertencem à intranet.
  text = text.replace(/label:\s*['"]Modelos['"][\s\S]{0,900}?(?=\n\s*[{]|\n\s*]\s*;|\n\s*]\s*\)|\n\s*]\s*})/g, '');
  text = text.replace(/label:\s*['"]Plataforma['"][\s\S]{0,700}?(?=\n\s*[{]|\n\s*]\s*;|\n\s*]\s*\)|\n\s*]\s*})/g, '');

  if (text !== original) {
    writeUtf8(file, text);
    console.log(`patch navegação/textos: ${path.relative(root, file)}`);
  }
}

console.log('v29.4-v34 aplicado com Node/UTF-8. Rode npm run build.');
