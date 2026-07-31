# v20.2 — Consolidado

Este pacote consolida:

- v20: submenus e telas por funcionalidade.
- v20.1: botão de menu no topo, hover temporário e fixação por clique.

Use este pacote se a v20 ainda não foi aplicada.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v20-2-consolidado.ps1
npm run build
npm run dev
```

## Depois de validar

```powershell
git status
git add src docs scripts
git commit -m "feat: reorganiza menu em submenus por funcionalidade"
git push
```
