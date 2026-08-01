# v27-v28.3 — Consolidação limpa

## Base usada

Este pacote usa como base o `src` corrigido enviado após a análise externa, sem aplicar correção de caracteres por dicionário PowerShell.

## Correções incluídas

- Charset corrigido a partir dos arquivos fonte.
- Remoção de BOM em arquivos `.ts`, `.tsx` e `.css`.
- Inclusão de `Canais` no menu e no roteamento do App.
- Delay real de 2 segundos para expansão do menu lateral recolhido.
- Remoção da função morta `getPocClient()` em `radarApi.ts`.
- Remoção do `as any` em `fetchAtendimentos` / `CentralAtendimento`.
- Remoção de `replaceAll`, mantendo compatibilidade com o target atual do TypeScript.
- Mantém Agentes, Canais, toast central e CSS visual consolidado.
- Inclui scripts SQL 019 de agentes, canais, planos, limites e consumo.

## Aplicação

Extraia o ZIP na raiz do projeto, substituindo os arquivos quando solicitado.

Depois rode:

```powershell
npm run build
npm run dev
```

Auditoria opcional:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/audit-v27-v28-3.ps1
```

## Observação

A automação real de planos, billing, upgrade/downgrade e bloqueios por consumo ainda fica para a futura intranet/plataforma.
