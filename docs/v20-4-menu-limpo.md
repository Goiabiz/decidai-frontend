# v20.4 — Menu limpo e nomenclaturas

## Ajustes

- Scrollbar lateral suavizada com cor próxima do menu.
- Botões extras do topo removidos, mantendo apenas recolher/fixar.
- Funcionalidades com nomes simples, sem `/`.
- Submenus ordenados alfabeticamente.
- Mantém fonte e ícones maiores da v20.3.

## Nomenclaturas

Cadastros:
- Base
- Campos
- Formulários
- Unidades
- Usuários

Central de Atendimento:
- Alertas
- Atendimentos
- Serviços

Parametrização:
- Administração
- Agentes
- Integrações
- Preferências
- Segurança

Relatórios:
- Alertas
- Atendimentos
- Auditoria
- Conhecimentos
- Integrações
- Tarefas

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v20-4-menu-limpo.ps1
npm run build
npm run dev
```
