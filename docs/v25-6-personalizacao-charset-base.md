# v25.6 — Personalização, tema, charset e Base de Conhecimento

## Ajustes

- Corrige caracteres especiais quebrados em arquivos de `src`.
- Adiciona inicializador de marca/tema em `src/lib/branding.ts`.
- Importa `branding.ts` no `main.tsx`.
- Permite nome e logo do cliente via Preferências.
- Tema pode seguir:
  - sistema/navegador;
  - claro;
  - escuro.
- Garante ícone visual do cliente no menu lateral, inclusive com menu recolhido.
- Cria/atualiza tela de Preferências em:
  - `src/pages/parametrizacao/Preferencias.tsx`
  - `src/pages/Preferencias.tsx`
- Atualiza Base de Conhecimento em:
  - `src/pages/BaseConhecimento.tsx`
  - `src/pages/cadastros/BaseConhecimento.tsx`
- Garante botão interno `Adicionar conhecimento` funcionando.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v25-6-personalizacao-charset-base.ps1
npm run build
npm run dev
```
