# v20.3 — Refinamento do menu

## Ajustes

- Volta o símbolo circular ao lado de Radar SUS.
- Remove o botão de recolher de dentro da marca lateral.
- Cria uma barra administrativa no topo, inspirada no padrão do Jira.
- Coloca o botão de recolher/fixar na barra superior.
- Mantém o mesmo comportamento visual quando o menu abre por hover ou fica fixo.
- Aumenta fonte das funcionalidades.
- Aumenta ícones dos submenus.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v20-3-menu-refino.ps1
npm run build
npm run dev
```
