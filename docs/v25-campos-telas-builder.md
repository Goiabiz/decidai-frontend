# v25 — Campos e Telas Builder

## Campos

Ajustes aplicados:

- Arquivo virou Anexo.
- Calculado virou Fórmula.
- Múltipla escolha virou Lista seleção múltipla.
- Opção única virou Lista seleção única.
- Incluído Checkbox.
- Status fica somente:
  - Ativo
  - Inativo
- Remove detalhes laterais.
- Remove importar/exportar.
- Remove menu de três pontos.
- Mantém ações diretas:
  - editar
  - duplicar
  - excluir
- Inclui descrição do campo na lista.
- Fórmula passa a ter área explicativa com operações, campos e funções previstas.

## Telas

Ajustes aplicados:

- Nome da funcionalidade passa a ser Telas.
- Remove detalhes laterais.
- Remove importar/exportar.
- Remove menu de três pontos.
- Mantém ações diretas:
  - pré-visualizar
  - editar
  - duplicar
  - excluir
- Builder de tela mais forte:
  - busca de campos por texto;
  - campo selecionado sai da lista disponível;
  - visual estilo Jira com área principal + contexto lateral;
  - visual estilo Monday/quadro com colunas;
  - campo pode ir para Principal, Contexto ou Aba;
  - permite grupo/aba;
  - preview atualiza conforme campos selecionados.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v25-campos-telas-builder.ps1
npm run build
npm run dev
```
