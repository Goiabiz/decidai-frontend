# v20 — Submenus e telas por funcionalidade

## Objetivo

Organizar o produto por módulos e funcionalidades reais, evitando abas internas soltas dentro das páginas.

## Estrutura aplicada

```text
Área de Trabalho

Cadastros
├── Usuários
├── Unidades / Centros de Custo
├── Campos de Contexto
├── Formulários / Telas
└── Base de Conhecimento

Central de Atendimento
├── Atendimentos
├── Alertas
└── Serviços e Filas

Roadmap
└── Tarefas

Parametrização
├── Administração
├── Integrações
├── Agentes
├── Preferências
└── Segurança / Auditoria

Relatórios
├── Conhecimentos
├── Atendimentos
├── Alertas
├── Tarefas
├── Integrações
└── Auditoria
```

## Ajustes incluídos

- `App.tsx` com novas `PageKey`.
- `Layout.tsx` com submenus expansíveis.
- `Configuracoes.tsx` focada em Administração.
- Telas placeholder estruturadas para funcionalidades ainda não implementadas.
- Integrações como página própria dentro de Parametrização.
- Correção de caracteres especiais preparada em `src/utils/textEncoding.ts`.
- CSS de submenu em `docs/v20-css-append.css`.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v20-submenus.ps1
npm run build
npm run dev
```
