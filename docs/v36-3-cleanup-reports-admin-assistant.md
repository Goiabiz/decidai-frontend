# v36.3 — Limpeza de Administração, Relatórios, Exportação e Assistente

## Corrige

- Administração sem bloco "Regra da aplicação cliente".
- Remove itens sem sentido no ambiente de produção:
  - nome do ambiente;
  - plano contratado;
  - status do ambiente;
  - domínio/identidade visual;
  - prazos padrão;
  - regras de exibição;
  - preferências genéricas.
- Mantém apenas "Responsáveis padrão" com selects e botão salvar.
- Exportação vira componente padrão `ExportAction`, com XLS, PDF retrato e PDF paisagem.
- Relatórios deixam de repetir título dentro da tela.
- Relatórios ganham filtros práticos:
  - busca;
  - período;
  - tipo;
  - status;
  - responsável;
  - origem.
- Relatório personalizado separa "Campos do relatório" e "Filtros avançados" em boxes.
- Assistente passa a ser painel flutuante não bloqueante, inspirado em Jira/Monday.
- Corrige erro potencial de import/export do componente `ExportAction`.

## Supabase

A migration `021_v36_3_catalog_permissions.sql` libera leitura segura do catálogo v35.
Essa parte já foi aplicada pelo ChatGPT no projeto Supabase conectado.
