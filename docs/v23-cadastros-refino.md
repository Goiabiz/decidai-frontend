# v23 — Refino Cadastros: Usuários e Unidades

## Unidades

- Remove Código interno.
- Remove Unidade superior.
- Remove filtro Cidade/UF.
- Renomeia `Dados complementares — Matriz` para `Dados complementares`.
- Remove Responsável legal.
- Melhora texto da modal de importação.
- Melhora texto da modal de exportação.
- Remove escopo da exportação.
- Remove botão de e-mail da lista.
- Remove botão de mais ações.
- Mantém ações diretas:
  - Visualizar mapa
  - Editar unidade
- Mantém espaço de mapa no cadastro e atalho no detalhe.

## Usuários

- Unidade deixa de ser obrigatória.
- Troca Sexo por Gênero.
- Opções de gênero:
  - Feminino
  - Masculino
- Remove tipo de telefone WhatsApp.
- Mantém:
  - Celular
  - Fixo
  - Comercial
- Ícone de celular passa a ser smartphone.
- Código do país exibe bandeira junto.
- Lista de países ampliada, com Brasil padrão.

## Menu

- Reforça comportamento visual igual entre menu fixo e menu aberto por hover.
- Remove ícones extras do topo, mantendo apenas recolher/fixar.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v23-cadastros-refino.ps1
npm run build
npm run dev
```
