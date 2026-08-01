# v25.6.1 — Fix do script de charset

O build já passou. Este pacote corrige apenas o script que parou por erro de chave duplicada no PowerShell.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v25-6-1-fix-script-charset.ps1
npm run build
npm run dev
```
