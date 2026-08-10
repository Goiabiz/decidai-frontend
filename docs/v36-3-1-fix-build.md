# v36.3.1 — Correção de build

Corrige erro de JSX nos relatórios gerado no v36.3.

## Problema

Alguns arquivos ficaram assim:

```tsx
typeOptions=["Todos os tipos", "Manual"]
```

O correto em JSX é:

```tsx
typeOptions={["Todos os tipos", "Manual"]}
```

Também corrige, se ainda existir localmente, o toast `danger` para `error` em `Integracoes.tsx`.
