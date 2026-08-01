# v26 — Estabilização da aplicação cliente

## Objetivo

Estabilizar a aplicação de produção do cliente antes de avançar para Agentes, Canais e Central de Atendimento.

## Inclui

- `src/lib/branding.ts` seguro, sem manipulação direta de DOM.
- `src/pages/parametrizacao/Preferencias.tsx`.
- `src/pages/Preferencias.tsx`.
- `src/pages/BaseConhecimento.tsx`.
- `src/pages/cadastros/BaseConhecimento.tsx`.
- CSS v26 para Base de Conhecimento, Preferências e tema claro/escuro.
- Script de aplicação.
- Script de auditoria de caracteres.

## Base de Conhecimento estabilizada

- Um único botão para criar conhecimento.
- Conhecimento nasce ativo por padrão.
- Arquivar/restaurar em vez de status complexo.
- Origem identificada pelo sistema/backend, sem campo manual.
- Anexos e imagens.
- Prévia de imagem em modal.
- Link externo estilo wiki.
- Atalho para gerar alerta.
- Sem painel lateral de detalhes.

## Branding/Preferências estabilizado

- Tema claro.
- Tema escuro.
- Tema automático por navegador/SO.
- Nome do cliente e logo ficam salvos no localStorage.
- A aplicação não altera textos nem injeta elementos no DOM.
- O Layout depois deve consumir essas preferências diretamente.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v26-estabilizacao-cliente.ps1
npm run build
npm run dev
```

Depois, no navegador:

```text
Ctrl + F5
```

## Auditoria de caracteres

```powershell
powershell -ExecutionPolicy Bypass -File scripts/audit-charset-v26.ps1
```

Se a auditoria listar arquivos, envie o print/log para corrigirmos os pontos restantes.
