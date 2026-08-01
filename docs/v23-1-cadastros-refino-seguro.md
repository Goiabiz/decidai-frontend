# v23.1 — Refino seguro Cadastros

Esta versão substitui arquivos TSX diretamente e evita regex complexa no PowerShell.

## Correções principais em Unidades

- Remove Código interno.
- Remove Unidade superior.
- Remove filtro Cidade/UF.
- Renomeia Dados complementares sem sufixo do tipo.
- Remove Responsável legal.
- Reordena modal:
  - Identificação
  - Dados complementares
  - Contatos
  - Setores
  - Endereço e localização
- Melhora textos de Importar e Exportar.
- Remove escopo da exportação.
- Remove botão de e-mail da lista.
- Remove botão de mais ações.
- Mantém ações diretas: mapa e editar.
- Mantém mapa no cadastro e atalho nos detalhes.

## Correção de menu

- Reforça visual igual entre menu fixo e hover.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v23-1-cadastros-refino-seguro.ps1
npm run build
npm run dev
```
