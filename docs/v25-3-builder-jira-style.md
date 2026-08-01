# v25.3 — Builder estilo Jira

## Objetivo

Transformar a montagem de telas em uma experiência mais próxima do Jira:

- miniatura da tela ocupando o espaço principal;
- campos na lateral direita;
- campos padrão do sistema + campos personalizados;
- inclusão por clique ou arrastar;
- remoção arrastando para lixeira;
- configuração rápida no próprio campo inserido.

## Ajustes

- Campo da lateral direita pode ser clicado para adicionar na aba ativa.
- Campo da lateral direita pode ser arrastado para a área principal ou contexto.
- Campo já inserido pode ser arrastado para outra área.
- Campo já inserido pode ser arrastado para lixeira para remover com confirmação.
- Campo inserido tem configuração direta:
  - largura;
  - valor padrão;
  - obrigatório;
  - exibir para usuário;
  - visível na tela.
- Cada aba define seu próprio modo:
  - Campos;
  - Lista.
- Cada aba define suas colunas:
  - 1, 2 ou 3 colunas.
- Campos padrão e personalizados aparecem juntos.
- Campos já usados saem da lista.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v25-3-builder-jira-style.ps1
npm run build
npm run dev
```
