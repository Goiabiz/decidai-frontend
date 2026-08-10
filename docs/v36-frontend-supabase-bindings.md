# v36 — Frontend ligado ao Supabase v35

Este pacote conecta as telas operacionais ao catálogo v35 aplicado no Supabase.

## Arquivos alterados

- `src/services/v35Supabase.ts`
- `src/pages/parametrizacao/Integracoes.tsx`
- `src/pages/parametrizacao/Canais.tsx`
- `src/pages/parametrizacao/Agentes.tsx`
- `src/pages/cadastros/CamposContexto.tsx`
- `src/styles/v36_supabase_bindings.css`
- `src/main.tsx` recebe import do CSS da v36

## O que passa a consumir Supabase

- Integrações: `vw_v35_integration_catalog_client` e `integration_provider_actions`
- Canais: provedores técnicos liberados no catálogo v35
- Campos: `vw_v35_api_guided_dictionary`
- Agentes: conectores e ações disponíveis para fluxos/agentes

## Observação

A gravação segura de credenciais/token ainda deve ficar no backend/edge function. Nesta etapa o frontend consome o catálogo e prepara o fluxo de conexão sem expor segredo no cliente.
