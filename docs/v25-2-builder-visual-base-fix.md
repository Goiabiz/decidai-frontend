# v25.2 — Builder visual e Base fix

## Telas

- Remove a lógica de visualização única para a tela inteira.
- Cada aba agora define seu próprio modo:
  - Campos
  - Lista
- Cada aba define quantidade de colunas:
  - 1 coluna
  - 2 colunas
  - 3 colunas
- Campos padrão do sistema entram junto com campos personalizados.
- Campos podem ser adicionados clicando no item ou arrastando para:
  - área principal
  - contexto lateral
- Campo selecionado sai da lista de disponíveis.
- Abas podem ser criadas com + e renomeadas no próprio botão da aba.
- Campos selecionados permitem ajustar:
  - área
  - aba
  - largura
  - obrigatório
  - visível
- Remove campo da tela com confirmação.
- Excluir tela com confirmação.

## Base de Conhecimento

- Garante botão interno "Adicionar conhecimento".
- Mantém botão no topo quando PageHeader renderizar corretamente.
- Modal de cadastro incluída.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v25-2-builder-visual-base-fix.ps1
npm run build
npm run dev
```
