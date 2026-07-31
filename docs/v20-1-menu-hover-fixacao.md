# v20.1 — Menu com hover e fixação

## Ajuste

O botão de recolher sai do rodapé e vai para o topo, dentro da marca do produto.

## Comportamento

- Quando o menu está aberto, clicar no botão recolhe e fixa recolhido.
- Quando o menu está recolhido, passar o mouse expande temporariamente.
- Quando o menu está recolhido, clicar no botão fixa aberto novamente.
- O botão usa ícones `PanelLeftOpen` e `PanelLeftClose`, com aparência mais clara de painel.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v20-1-menu-hover.ps1
npm run build
npm run dev
```
