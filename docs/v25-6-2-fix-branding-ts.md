# v25.6.2 — Fix branding.ts

Corrige o erro:

```text
TS1117: An object literal cannot have multiple properties with the same name.
```

## Motivo

O arquivo `src/lib/branding.ts` ficou com chaves duplicadas no objeto de correção de caracteres.

## Ajuste

Troca o objeto por uma lista de pares:

```ts
const replacementPairs: Array<[string, string]> = [...]
```

Assim o TypeScript não bloqueia o build e o app volta a carregar.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v25-6-2-fix-branding-ts.ps1
npm run build
npm run dev
```
