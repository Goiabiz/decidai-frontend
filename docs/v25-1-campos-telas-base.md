# v25.1 — Campos, Telas e Base de Conhecimento

## Campos

- Inclui Lista em cascata.
- Ordena tipos de campo.
- Remove Unidade, Usuário e Endereço como tipos separados.
- Troca Texto longo por Parágrafo / Rich text.
- Excluir campo passa a pedir confirmação.
- Fórmula mantém explicação das operações aceitas.

## Telas

- Nome passa a ser Telas.
- Remove tipo Complementar/Padrão do sistema.
- Inclui comportamento de exibição:
  - Exibir ao abrir funcionalidade
  - Exibir como atalho
- Campos disponíveis ficam ordenados alfabeticamente.
- Campo selecionado sai da lista.
- Abas são opcionais.
- Inclui botão + para adicionar aba.
- Permite editar nome das abas.
- Remover campo da tela pede confirmação.
- Excluir tela pede confirmação.

## Base de Conhecimento

- Nome no menu e tela: Base de Conhecimento.
- Modelo inicial com:
  - lista de conhecimentos;
  - filtros;
  - detalhe lateral;
  - cadastro de novo conhecimento;
  - origem;
  - fonte;
  - link da fonte;
  - data da fonte;
  - classificação;
  - assunto;
  - tags;
  - resumo;
  - conteúdo;
  - status;
  - ações de ativar, arquivar e excluir.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v25-1-campos-telas-base.ps1
npm run build
npm run dev
```
