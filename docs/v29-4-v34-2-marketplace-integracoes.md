# v29.4-v34.2 — Catálogo de Integrações estilo marketplace

## Ajustes
- Corrige `Canais de Atendimento de Atendimento`.
- Mantém componente técnico como `Canais`.
- Remove a categoria Atlassian.
- Move Jira, Jira Service Management, Confluence e Trello para Gestão de Projetos e Trabalho.
- Separa Financeiro e Pagamentos de ERP/Estoque.
- Remove voz, transcrição, OCR, ElevenLabs e busca vetorial do catálogo do cliente.
- Registra voz/transcrição/OCR/busca vetorial como serviços nativos/intranet.
- Mantém API personalizada guiada como categoria própria.
- Prepara `BrandLogo` como fallback visual por marca.

## Logos oficiais
O pacote usa brand tiles locais. Para logos oficiais, adicionar SVG/PNG em `public/integrations/logos/` e evoluir o `BrandLogo` para priorizar asset oficial.

## Conectores
Catálogo visual não significa conector operacional. O conector real precisa de autenticação, backend, token criptografado, endpoints, dicionário de dados, logs e permissões.
