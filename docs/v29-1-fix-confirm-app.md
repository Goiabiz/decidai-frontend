# v29.1 — Fix confirmApp

## Problema

O build falhava com:

```text
Module '../lib/appConfirm' has no exported member 'confirmApp'
```

Arquivos afetados:

```text
src/pages/BaseConhecimento.tsx
src/pages/cadastros/BaseConhecimento.tsx
src/pages/cadastros/FormulariosTelas.tsx
```

## Correção

Substitui `src/lib/appConfirm.ts` por uma implementação segura que exporta:

```ts
confirmApp
appConfirm
requestConfirm
showConfirm
```

Também remove a necessidade de `window.confirm`, usando modal próprio do sistema criado em runtime.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v29-1-fix-confirm-app.ps1
npm run build
npm run dev
powershell -ExecutionPolicy Bypass -File scripts/audit-v29-1.ps1
```
