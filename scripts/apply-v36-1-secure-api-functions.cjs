const fs = require('fs');
const path = require('path');

const required = [
  'supabase/functions/_shared/cors.ts',
  'supabase/functions/_shared/supabaseAdmin.ts',
  'supabase/functions/_shared/crypto.ts',
  'supabase/functions/_shared/http.ts',
  'supabase/functions/api-guided-save-connection/index.ts',
  'supabase/functions/api-guided-test-connection/index.ts',
  'supabase/functions/api-guided-test-endpoint/index.ts',
  'supabase/functions/api-guided-discover-fields/index.ts',
  'src/lib/v36SecureApiFunctions.ts',
  'database/01_migrations/020_v36_1_secure_api_functions_support.sql',
];

let missing = 0;
for (const file of required) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) { console.error('ERRO arquivo ausente:', file); missing++; }
  else console.log('OK', file);
}

const envExample = path.join(process.cwd(), 'supabase', '.env.v36.1.example');
if (!fs.existsSync(envExample)) {
  fs.writeFileSync(envExample, [
    '# Configurar como secret das Edge Functions, não commitar segredo real',
    '# supabase secrets set RADAR_SECRET_KEY=<32-caracteres-ou-base64-32-bytes>',
    'RADAR_SECRET_KEY=troque-por-uma-chave-de-32-bytes',
    '',
  ].join('\n'), 'utf8');
  console.log('OK supabase/.env.v36.1.example');
}

if (missing) process.exit(1);
console.log('\nv36.1 aplicado no repositório.');
console.log('Próximo: configurar RADAR_SECRET_KEY e fazer deploy das functions.');
