const fs=require('fs');const path=require('path');const root=process.cwd();let errors=[];
function read(f){return fs.existsSync(f)?fs.readFileSync(f,'utf8'):''}
const app=read(path.join(root,'src','App.tsx'));
if(app.includes('Canais de Atendimento }')) errors.push('App.tsx ainda tem import inválido de Canais de Atendimento');
['src/styles/v29_4_v34_6_final.css','src/lib/uiActionGuards.ts','src/components/ExportAction.tsx','src/pages/parametrizacao/Integracoes.tsx'].forEach(f=>{if(!fs.existsSync(path.join(root,f))) errors.push('faltando '+f)});
const css=read(path.join(root,'src','styles','v29_4_v34_6_final.css'));
if(!css.includes('data-theme')) errors.push('CSS final sem regras data-theme');
if(errors.length){console.error('Audit encontrou problemas:');errors.forEach(e=>console.error('- '+e));process.exit(1)}
console.log('Audit v29.4-v34.6 OK. Rode npm run build.');
