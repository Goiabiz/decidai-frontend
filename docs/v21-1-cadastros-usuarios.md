# v21.1 — Cadastros > Usuários sem indicadores

## Ajuste

A tela de Usuários foi ajustada para ser mais funcional, sem KPIs/indicadores.

## Estrutura

- Cabeçalho com ações:
  - Importar
  - Exportar
  - Novo usuário

- Card principal:
  - título da funcionalidade
  - resumo operacional
  - total filtrado / total geral

- Filtros:
  - busca geral
  - status
  - perfil

- Lista:
  - Usuário
  - Perfil
  - Unidade
  - Status
  - Segurança
  - Último login
  - Ações

- Detalhe lateral interno:
  - identificação
  - contato
  - perfil
  - unidade
  - MFA
  - uso por agente

- Modal:
  - novo usuário

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v21-1-usuarios-sem-indicadores.ps1
npm run build
npm run dev
```
