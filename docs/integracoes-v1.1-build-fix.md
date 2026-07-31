# Integrações v1.1 — Correção de build

## Ajustes

- Remove uso incorreto de `useAsyncData` na tela de Integrações.
- Usa carregamento direto com `useEffect`.
- Troca `hint` por `tooltip` no `KpiCard`.
- Usa `source="supabase"` no `DataSourceNotice`.
- Protege `universoSupabase` nulo no serviço.
- Mantém botões em modo preparado, sem OAuth real ainda.

## Dependências necessárias

Instalar tipos do React:

```bash
npm install -D @types/react @types/react-dom
```

## Build

```bash
npm run build
```
