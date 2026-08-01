# v25.7 — Base de Conhecimento simplificada

## Ajustes da Base de Conhecimento

- Remove painel lateral de detalhes.
- Remove botão duplicado de adicionar conhecimento.
- Conhecimento nasce ativo por padrão.
- Remove campo/status manual do formulário.
- Lista usa apenas ações operacionais:
  - editar;
  - gerar alerta;
  - copiar link externo;
  - arquivar/restaurar;
  - excluir com confirmação.
- Origem não é campo manual; fica como origem identificada pelo sistema/backend.
- Permite anexar imagens e arquivos.
- Imagens podem abrir em modal de prévia.
- Arquivos ficam preparados para download/exibição.
- Gera link externo de consulta estilo wiki após salvar.

## Ajustes técnicos

- Correção ampliada de caracteres especiais no código fonte.
- Atualiza:
  - `src/pages/BaseConhecimento.tsx`
  - `src/pages/cadastros/BaseConhecimento.tsx`
- Adiciona CSS da tela ao `global.css`.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v25-7-base-conhecimento-simplificada.ps1
npm run build
npm run dev
```
