# v36.2 — Botões de Integrações ligados às Edge Functions

## Correção incluída

O v36.1 criava `src/lib/v36SecureApiFunctions.ts` importando `./supabaseClient`, mas este projeto usa:

```ts
src/lib/supabase.ts
```

com:

```ts
universoSupabase
pocSupabase
```

A v36.2 corrige esse import e usa `universoSupabase ?? pocSupabase`.

## Ligação funcional

A tela `Parametrização > Integrações` passa a:

- salvar conexão via `api-guided-save-connection`;
- testar conexão via `api-guided-test-connection`;
- não gravar token direto pelo navegador;
- exibir retorno do teste no modal.

## Supabase CLI

As Edge Functions precisam ser publicadas com Supabase CLI. O ChatGPT, neste ambiente, só executa SQL no Supabase; secrets/deploy devem ser feitos localmente.
