const fs = require('fs');
const path = require('path');
const root = process.cwd();
const pkg = path.join(__dirname, '..');
function read(file){ return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '') : ''; }
function writeFile(file, content){ fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file, content.replace(/^\uFEFF/, ''), 'utf8'); }
function copy(src, dest){ const s=path.join(pkg, src), d=path.join(root, dest); if(!fs.existsSync(s)){ console.warn('ignorado: '+src); return; } fs.mkdirSync(path.dirname(d),{recursive:true}); fs.copyFileSync(s,d); console.log('copiado: '+dest); }
const files = [
 ['src/styles/v29_4_v34_6_final.css','src/styles/v29_4_v34_6_final.css'],
 ['src/lib/uiActionGuards.ts','src/lib/uiActionGuards.ts'],
 ['src/components/BrandIcon.tsx','src/components/BrandIcon.tsx'],
 ['src/components/ExportAction.tsx','src/components/ExportAction.tsx'],
 ['src/pages/parametrizacao/Integracoes.tsx','src/pages/parametrizacao/Integracoes.tsx'],
 ['src/pages/Integracoes.tsx','src/pages/Integracoes.tsx'],
 ['src/pages/parametrizacao/Canais.tsx','src/pages/parametrizacao/Canais.tsx'],
 ['src/pages/Canais.tsx','src/pages/Canais.tsx'],
 ['src/pages/parametrizacao/Agentes.tsx','src/pages/parametrizacao/Agentes.tsx'],
 ['src/pages/Agentes.tsx','src/pages/Agentes.tsx'],
 ['src/pages/CentralAtendimento.tsx','src/pages/CentralAtendimento.tsx'],
 ['src/pages/Servicos.tsx','src/pages/Servicos.tsx'],
 ['src/pages/ServicosFilas.tsx','src/pages/ServicosFilas.tsx'],
 ['src/pages/Roadmap.tsx','src/pages/Roadmap.tsx'],
 ['src/pages/AnaliseAcoes.tsx','src/pages/AnaliseAcoes.tsx'],
 ['src/pages/Administracao.tsx','src/pages/Administracao.tsx'],
 ['src/pages/parametrizacao/Administracao.tsx','src/pages/parametrizacao/Administracao.tsx'],
 ['src/pages/MinhaConta.tsx','src/pages/MinhaConta.tsx'],
 ['src/pages/parametrizacao/MinhaConta.tsx','src/pages/parametrizacao/MinhaConta.tsx'],
 ['src/pages/relatorios/RelatorioPersonalizado.tsx','src/pages/relatorios/RelatorioPersonalizado.tsx'],
 ['src/pages/RelatorioPersonalizado.tsx','src/pages/RelatorioPersonalizado.tsx'],
 ['src/pages/relatorios/StandardReportPage.tsx','src/pages/relatorios/StandardReportPage.tsx'],
 ['src/pages/relatorios/RelatorioAlertas.tsx','src/pages/relatorios/RelatorioAlertas.tsx'],
 ['src/pages/relatorios/RelatorioAtendimentos.tsx','src/pages/relatorios/RelatorioAtendimentos.tsx'],
 ['src/pages/relatorios/RelatorioAuditoria.tsx','src/pages/relatorios/RelatorioAuditoria.tsx'],
 ['src/pages/relatorios/RelatorioConhecimentos.tsx','src/pages/relatorios/RelatorioConhecimentos.tsx'],
 ['src/pages/relatorios/RelatorioIntegracoes.tsx','src/pages/relatorios/RelatorioIntegracoes.tsx'],
 ['src/pages/relatorios/RelatorioTarefas.tsx','src/pages/relatorios/RelatorioTarefas.tsx'],
 ['docs/v29-4-v34-6-ajustes-finais.md','docs/v29-4-v34-6-ajustes-finais.md']
];
files.forEach(([s,d])=>copy(s,d));
const main = path.join(root,'src','main.tsx');
if(fs.existsSync(main)){
  let t=read(main);
  if(!t.includes("./styles/v29_4_v34_6_final.css")) t = "import './styles/v29_4_v34_6_final.css';\n" + t;
  if(!t.includes("./lib/uiActionGuards")) t = "import './lib/uiActionGuards';\n" + t;
  writeFile(main,t); console.log('main.tsx atualizado');
}
const app = path.join(root,'src','App.tsx');
if(fs.existsSync(app)){
  let t=read(app), o=t;
  // corrige erro legado de import com identificador inválido
  t=t.replace(/import\s*\{\s*Canais\s+de\s+Atendimento\s*\}\s*from\s*['"]\.\/pages\/parametrizacao\/Canais de Atendimento['"];?/g, "import { Canais } from './pages/parametrizacao/Canais';");
  t=t.replace(/<Canais\s+de\s+Atendimento\b/g, '<Canais');
  t=t.replace(/Canais de Atendimento de Atendimento/g, 'Canais de Atendimento');
  t=t.replace(/Segurança\s*\/\s*Auditoria/g, 'Auditoria');
  t=t.replace(/Responder e-mail/g, 'Responder');
  if(t!==o){ writeFile(app,t); console.log('App.tsx saneado'); }
}
// corrige labels repetidos no menu se existirem
const layout = path.join(root,'src','components','Layout.tsx');
if(fs.existsSync(layout)){
  let t=read(layout), o=t;
  t=t.replace(/Canais de Atendimento de Atendimento/g, 'Canais de Atendimento');
  t=t.replace(/Segurança\s*\/\s*Auditoria/g, 'Auditoria');
  t=t.replace(/Serviços e Filas/g, 'Serviços');
  t=t.replace(/Responder e-mail/g, 'Responder');
  if(t!==o){ writeFile(layout,t); console.log('Layout.tsx saneado'); }
}
console.log('v29.4-v34.6 aplicado. Rode npm run build e npm run dev.');
