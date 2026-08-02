const fs=require('fs'); const path=require('path'); const root=process.cwd(); let errors=[];
['src/lib/uiActionGuards.ts','src/styles/v34_6_4_pending.css','src/components/ExportAction.tsx','src/pages/parametrizacao/Canais.tsx','src/pages/CentralAtendimento.tsx','src/pages/Roadmap.tsx','src/pages/relatorios/RelatorioPersonalizado.tsx'].forEach(f=>{if(!fs.existsSync(path.join(root,f))) errors.push('faltando '+f)});
const app=fs.existsSync(path.join(root,'src/App.tsx'))?fs.readFileSync(path.join(root,'src/App.tsx'),'utf8'):'';
if(app.includes('Canais de Atendimento }')) errors.push('import inválido de Canais de Atendimento ainda existe');
if(errors.length){console.error('Audit encontrou problemas:'); errors.forEach(e=>console.error('- '+e)); process.exit(1)}
console.log('Audit v34.6.4 OK. Agora rode npm run build.');
