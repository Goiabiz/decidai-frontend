# v25.5 — Telas com seções, contexto global e ações funcionais

## Ajustes aplicados

- Botão editar da lista abre a tela no builder.
- Botão copiar da lista abre uma cópia como rascunho.
- Lista lateral de campos fica em ordem alfabética.
- Remove exibição de "Padrão do sistema" e "Personalizado" na lista lateral.
- Pré-visualizar fica na mesma linha das opções da aba.
- Contexto lateral vira global para a tela, independente da aba.
- A aba não controla mais a quantidade de colunas da tela inteira.
- Cada seção da aba controla sua própria quantidade de colunas:
  - 1 coluna
  - 2 colunas
  - 3 colunas
- Botão "Seção" adiciona nova seção na aba ativa.
- Campo pode ser arrastado para uma seção específica.
- Campo pode ser arrastado para o contexto global.
- Campo arrastado para fora das áreas de montagem sai da tela.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v25-5-telas-secoes-contexto.ps1
npm run build
npm run dev
```
