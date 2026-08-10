const fs = require('fs');
const path = require('path');

const required = [
  'supabase/functions/api-guided-save-connection/index.ts',
  'supabase/functions/api-guided-test-connection/index.ts',
  'supabase/functions/api-guided-test-endpoint/index.ts',
  'supabase/functions/api-guided-discover-fields/index.ts',
  'src/lib/v36SecureApiFunctions.ts',
];

for (const file of required) {
  if (!fs.existsSync(path.join(process.cwd(), file))) {
    console.error('ERRO arquivo ausente:', file);
    process.exit(1);
  }
}

const bad = required
  .map((file) => [file, fs.readFileSync(path.join(process.cwd(), file), 'utf8')])
  .filter(([, content]) => /secret_ciphertext\s*:\s*body\.secret|api_key_ciphertext\s*:\s*body\.secret/.test(content));

if (bad.length) {
  console.error('ERRO: secret sendo gravado sem criptografia em:', bad.map(([file]) => file).join(', '));
  process.exit(1);
}

console.log('Auditoria v36.1 limpa: functions e wrappers encontrados; segredo não é gravado em texto puro.');
