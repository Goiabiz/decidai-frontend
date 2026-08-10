const fs = require('fs');
const path = require('path');

const root = process.cwd();
const checks = [
  ['src/services/v35Supabase.ts', 'vw_v35_integration_catalog_client'],
  ['src/pages/parametrizacao/Integracoes.tsx', 'listV35IntegrationCatalog'],
  ['src/pages/parametrizacao/Canais.tsx', 'filterChannelProviders'],
  ['src/pages/parametrizacao/Agentes.tsx', 'filterAgentEnabledProviders'],
  ['src/pages/cadastros/CamposContexto.tsx', 'listV35ApiDictionary'],
  ['src/styles/v36_supabase_bindings.css', 'v36-status-strip'],
  ['src/main.tsx', 'v36_supabase_bindings.css'],
];

let failed = false;
for (const [file, token] of checks) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    console.error(`ERRO ${file} não existe`);
    failed = true;
    continue;
  }
  const text = fs.readFileSync(full, 'utf8');
  if (!text.includes(token)) {
    console.error(`ERRO ${file} não contém ${token}`);
    failed = true;
  } else {
    console.log(`OK ${file}`);
  }
}

if (failed) process.exit(1);
console.log('Auditoria v36 limpa. Rode npm run build para validação final.');
