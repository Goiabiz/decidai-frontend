# v24 — Cadastros > Campos e Formulários

## Objetivo

Criar as duas funcionalidades juntas para validação:

- Cadastros > Campos
- Cadastros > Formulários

## Campos

Tela com:

- lista de campos cadastrados;
- busca;
- filtro por tipo;
- filtro por status;
- detalhe lateral;
- modal de novo campo;
- modal de importar;
- modal de exportar.

Cadastro de campo:

- nome;
- tipo;
- status;
- ajuda/descrição;
- obrigatório por padrão;
- permite busca/filtro;
- permite uso por agente;
- máscara;
- valor padrão;
- opções para opção única ou múltipla escolha.

## Formulários

Tela com:

- lista de formulários/telas;
- busca;
- filtro por funcionalidade;
- filtro por status;
- detalhe lateral;
- modal de novo formulário;
- seleção de campos cadastrados;
- configuração de obrigatório/visível por campo;
- pré-visualização;
- modal de importar;
- modal de exportar.

## Conceito aplicado

- Campo define o que é o dado e como ele se comporta.
- Formulário/Tela define onde o campo aparece e como será usado.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v24-campos-formularios.ps1
npm run build
npm run dev
```
