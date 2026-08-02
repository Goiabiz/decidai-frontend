-- 023_026_consolidacao_integracoes_api_agente_seed.sql

insert into public.integration_categories(code, name, description, sort_order)
values
  ('communication', 'Comunicação e Mensageria', 'Mensagens, atendimento e notificações.', 10),
  ('social', 'Redes Sociais', 'Redes sociais para monitoramento e relacionamento.', 20),
  ('knowledge', 'Documentos, Arquivos e Conhecimento', 'Fontes documentais para base de conhecimento.', 30),
  ('development', 'Atlassian, Desenvolvimento e Produto', 'Produto, desenvolvimento, backlog e documentação técnica.', 40),
  ('work', 'Gestão de Projetos e Trabalho', 'Tarefas, projetos e operação.', 50),
  ('crm', 'CRM, Comercial e Marketing', 'Leads, funil, campanhas e relacionamento.', 60),
  ('erp', 'ERP, Estoque, Produtos e Financeiro', 'Produtos, pedidos, estoque, financeiro e pagamentos.', 70),
  ('support', 'Suporte e Service Desk', 'Tickets, suporte e service desk.', 80),
  ('custom_api', 'APIs e Conectores Customizados', 'APIs, webhooks, bancos e arquivos recorrentes.', 90),
  ('ai_voice', 'Inteligência Artificial e Voz', 'Modelos de IA, transcrição, voz, OCR e embeddings.', 100)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.integration_catalog(category_id, code, name, description, status, minimum_plan_code, icon_type, is_native_platform_service, is_visible_to_client)
select c.id, x.code, x.name, x.description, x.status, x.minimum_plan_code, x.icon_type, x.is_native_platform_service, x.is_visible_to_client
from public.integration_categories c
join (
  values
    ('communication', 'whatsapp_business', 'WhatsApp Business', 'Mensageria para atendimento, confirmação, alertas e notificações.', 'available', 'student', 'MessageCircle', false, true),
    ('communication', 'email', 'E-mail', 'Envio e recebimento de mensagens por e-mail.', 'available', 'basic', 'Mail', false, true),
    ('communication', 'discord', 'Discord', 'Comunidades, suporte técnico, times e monitoramento.', 'available', 'pro', 'MessagesSquare', false, true),
    ('social', 'x_twitter', 'X / Twitter', 'Monitoramento de publicações e menções.', 'available', 'pro', 'Twitter', false, true),
    ('social', 'threads', 'Threads', 'Monitoramento e relacionamento em rede social textual.', 'planned', 'pro', 'Share2', false, true),
    ('knowledge', 'google_drive', 'Google Drive', 'Pastas, documentos, planilhas e arquivos para conhecimento.', 'available', 'student', 'Archive', false, true),
    ('development', 'jira', 'Jira', 'Issues, backlog, tarefas e roadmap.', 'available', 'pro', 'Code2', false, true),
    ('development', 'confluence', 'Confluence', 'Documentação, páginas e espaços de conhecimento.', 'available', 'pro', 'FileText', false, true),
    ('development', 'trello', 'Trello', 'Quadros, listas e cartões de trabalho.', 'available', 'student', 'BriefcaseBusiness', false, true),
    ('work', 'monday', 'monday.com', 'Gestão de projetos, operações e times.', 'available', 'pro', 'BriefcaseBusiness', false, true),
    ('crm', 'salesforce', 'Salesforce', 'CRM corporativo, leads, contas e oportunidades.', 'available', 'pro', 'Building2', false, true),
    ('crm', 'hubspot', 'HubSpot', 'CRM, marketing, vendas e automação.', 'available', 'pro', 'Building2', false, true),
    ('erp', 'bling', 'Bling', 'Produtos, pedidos, estoque, notas e operação comercial.', 'available', 'pro', 'Store', false, true),
    ('erp', 'omie', 'Omie', 'ERP, financeiro, vendas e notas fiscais.', 'available', 'pro', 'Store', false, true),
    ('support', 'zendesk', 'Zendesk', 'Tickets, central de ajuda e suporte ao cliente.', 'available', 'pro', 'Headphones', false, true),
    ('custom_api', 'custom_rest_api', 'API REST personalizada', 'Conector guiado por agente para qualquer API REST autorizada.', 'available', 'pro', 'Webhook', false, true),
    ('custom_api', 'custom_graphql_api', 'API GraphQL personalizada', 'Conector guiado por agente para APIs GraphQL.', 'available', 'pro', 'Network', false, true),
    ('custom_api', 'incoming_webhook', 'Webhook de entrada', 'Recebe eventos externos para atendimento, alerta, tarefa ou conhecimento.', 'available', 'pro', 'Webhook', false, true),
    ('ai_voice', 'openai', 'OpenAI', 'Modelos de linguagem, visão, áudio, agentes e embeddings.', 'available', 'pro', 'Sparkles', false, true),
    ('ai_voice', 'ocr', 'OCR', 'Leitura de imagens e documentos digitalizados.', 'available', 'pro', 'FileText', false, true),
    ('custom_api', 'correios_cep', 'Correios / CEP', 'Serviço nativo da plataforma para endereço e CEP.', 'native', 'basic', 'Map', true, false),
    ('custom_api', 'maps_geolocation', 'Maps / Geolocalização', 'Serviço nativo da plataforma para rotas e mapas.', 'native', 'basic', 'Map', true, false)
) as x(category_code, code, name, description, status, minimum_plan_code, icon_type, is_native_platform_service, is_visible_to_client)
on c.code = x.category_code
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  minimum_plan_code = excluded.minimum_plan_code,
  icon_type = excluded.icon_type,
  is_native_platform_service = excluded.is_native_platform_service,
  is_visible_to_client = excluded.is_visible_to_client;
