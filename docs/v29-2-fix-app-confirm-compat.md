# v29.2 — Fix compatibilidade appConfirm

## Problema

Depois do v29.1 o build ainda falhava porque algumas páginas usam:

```ts
showAppConfirm
```

E outras passam a propriedade:

```ts
description
```

Mas `src/lib/appConfirm.ts` ainda não aceitava essas duas formas.

## Correção

Este patch substitui `src/lib/appConfirm.ts` por uma versão compatível que exporta:

```ts
confirmApp
appConfirm
requestConfirm
showConfirm
showAppConfirm
```

E aceita:

```ts
message
description
title
confirmText
cancelText
tone
```

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v29-2-fix-app-confirm-compat.ps1
npm run build
npm run dev
powershell -ExecutionPolicy Bypass -File scripts/audit-v29-2.ps1
```
