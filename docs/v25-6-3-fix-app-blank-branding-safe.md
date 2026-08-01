# v25.6.3 — Fix app em branco

## Problema

O build passava, mas o navegador ficava em branco.

## Causa provável

O `src/lib/branding.ts` estava manipulando textos e elementos do DOM diretamente, com `MutationObserver`, antes/depois da montagem do React. Isso pode quebrar a renderização inicial.

## Correção

Esta versão troca o `branding.ts` por uma versão segura:

- mantém tema claro/escuro/sistema;
- mantém localStorage das preferências;
- mantém eventos para atualização futura;
- remove manipulação direta de textos e inserção dinâmica de logo no DOM;
- deixa o app carregar normalmente.

A personalização visual completa deve ser aplicada depois diretamente no componente de Layout/Menu, que é o caminho correto.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v25-6-3-fix-app-blank-branding-safe.ps1
npm run build
npm run dev
```

Depois recarregue o navegador com `Ctrl + F5`.
