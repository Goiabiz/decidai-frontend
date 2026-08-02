# v29.4-v34.3 — Integrações estilo catálogo/plugin

## Ajustes

- Remove a barra lateral de tipos de serviço.
- Organiza integrações por seções expansíveis/recolhíveis.
- Mantém busca global no topo.
- Exibe integrações em grade compacta, 4 a 5 por linha em telas grandes.
- Remove contadores por categoria.
- Usa componente `BrandLogo` com prioridade para:
  1. logo local em `public/integrations/logos/<code>.svg`
  2. favicon por domínio da marca
  3. fallback neutro somente quando não houver logo
- Corrige `Canais de Atendimento de Atendimento`.
- Mantém Confluence em Gestão de Projetos e Trabalho.
- Mantém Financeiro e Pagamentos separado de ERP.
- Remove voz, OCR e transcrição do catálogo do cliente.

## Logos oficiais

Para substituir favicon por logo oficial, adicionar arquivos:

```text
public/integrations/logos/github.svg
public/integrations/logos/google_drive.svg
public/integrations/logos/jira.svg
public/integrations/logos/confluence.svg
```

O componente usará automaticamente o arquivo local antes do favicon.
