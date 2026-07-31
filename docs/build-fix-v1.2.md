# Build fix v1.2

## Corrige

- `Github` inexistente no `lucide-react`, usando `GitBranch`.
- `ImportMeta.env` e import de CSS com `src/vite-env.d.ts`.
- `DataSourceNotice.error` recebendo string em vez de `Error | null`.
- `universoSupabase` possivelmente nulo.
- Remove referências antigas a `impactos` do `WorkspaceCustomizeModal`.
- Ajusta duplicidade `title`/spread em `operationalStore`.
- Ajusta fallback de atendimentos no `radarApi`.

## Como aplicar

1. Extraia o pacote por cima do frontend.
2. Rode:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-build-fixes.ps1
npm run build
```

3. Se passar:

```powershell
git status
git add src scripts docs package.json package-lock.json tsconfig.json
git commit -m "fix: corrige build apos integracoes"
git push
```
