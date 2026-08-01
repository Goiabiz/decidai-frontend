# v27-v28.1 — Fix build/layout

## Corrige

- Erro de PowerShell causado por regex quebrada no script anterior.
- Erro TypeScript `replaceAll does not exist on type string`.
- CSS de Agentes/Canais que não foi aplicado porque o script anterior quebrou.
- Toast central.
- Nova rodada de correção de caracteres especiais.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v27-v28-1-fix-build-layout.ps1
npm run build
npm run dev
```

Depois:

```text
Ctrl + F5
```

## Observação

Este patch não muda conceito nem banco. É só correção de build, script e visual.
