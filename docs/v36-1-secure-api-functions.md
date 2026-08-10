# v36.1 — Funções seguras para API guiada

Esta etapa tira a gravação/teste de credenciais do navegador e move para Supabase Edge Functions.

## Funções incluídas

- `api-guided-save-connection`
- `api-guided-test-connection`
- `api-guided-test-endpoint`
- `api-guided-discover-fields`

## Segurança

O frontend nunca deve gravar token direto no banco.

As funções usam `RADAR_SECRET_KEY` para criptografar credenciais com AES-GCM antes de salvar em `api_guided_credentials.secret_ciphertext`.

Configure o segredo no Supabase:

```bash
supabase secrets set RADAR_SECRET_KEY=<32-caracteres-ou-base64-32-bytes>
```

## Deploy

```bash
supabase functions deploy api-guided-save-connection
supabase functions deploy api-guided-test-connection
supabase functions deploy api-guided-test-endpoint
supabase functions deploy api-guided-discover-fields
```

## Uso no frontend

O wrapper está em:

```text
src/lib/v36SecureApiFunctions.ts
```

## SQL de apoio

A migration `020_v36_1_secure_api_functions_support.sql` cria índices e a view:

```text
vw_v36_api_guided_connection_health
```

A view e os índices já foram aplicados no Supabase conectado pelo ChatGPT.
