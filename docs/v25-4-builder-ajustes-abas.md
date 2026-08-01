# v25.4 — Ajustes do builder visual

## Ajustes aplicados

- Remove a área visual "Remover campo".
- Campo arrastado para fora das áreas de montagem é removido da tela.
- Mantém remoção manual dentro da configuração do próprio campo.
- Aumenta altura e área clicável da barra de abas.
- Corrige clique/foco da aba após editar o nome.
- Remove texto explicativo da miniatura.
- Mantém apenas botão Pré-visualizar na área de montagem.
- Mantém campos na lateral direita.
- Mantém campos padrão + personalizados.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v25-4-builder-ajustes-abas.ps1
npm run build
npm run dev
```
