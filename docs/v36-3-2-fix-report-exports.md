# v36.3.2 — Correção de exports dos relatórios

## Problema

O `App.tsx` importa os relatórios assim:

```tsx
import { RelatorioAuditoria } from './pages/relatorios/RelatorioAuditoria';
```

Mas o v36.3.1 deixou os relatórios apenas com `export default`.

## Correção

Cada relatório agora exporta dos dois modos:

```tsx
export function RelatorioAuditoria() {}
export default RelatorioAuditoria;
```

Também mantém a correção anterior:

```tsx
typeOptions={["Todos os tipos", "..."]}
```
