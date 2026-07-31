# v20.5 — Fix build dos submenus

## Problema

Após a v20.4, o build falhou por dois motivos:

1. O `App.tsx` enviava `onSelectDetail` e `onOpenDetail` para telas placeholder que ainda não recebem props.
2. O `WorkspaceCustomizeModal.tsx` ainda usava a chave antiga `config`, mas agora a navegação usa `param-admin` e outras `PageKey`.

## Correção

- Remove props das páginas placeholder no `App.tsx`.
- Ajusta `WorkspaceCustomizeModal.tsx` para usar `Partial<Record<PageKey, ...>>`.
- Troca `config` por `param-admin`.
- Corrige textos com caracteres quebrados nesse arquivo.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v20-5-fix-build-submenus.ps1
npm run build
npm run dev
```
