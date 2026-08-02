export type IntegrationStatus =
  | 'Pronto para conectar'
  | 'Em desenvolvimento'
  | 'Planejado'
  | 'Bloqueado pelo plano'
  | 'Conectado';

export type IntegrationCategoryCode =
  | 'productivity'
  | 'communication'
  | 'social'
  | 'development_product'
  | 'project_work'
  | 'crm_marketing'
  | 'erp_operations'
  | 'finance_payments'
  | 'support_service'
  | 'data_analytics'
  | 'education_knowledge'
  | 'security'
  | 'custom_api';

export type IntegrationProvider = {
  code: string;
  name: string;
  category: IntegrationCategoryCode;
  description: string;
  status: IntegrationStatus;
  minimumPlan: 'Básico' | 'Student' | 'Pro' | 'Enterprise';
  connectorLevel: 'Catálogo' | 'Conector preparado' | 'API guiada';
  logoDomain?: string;
};

export const integrationCategories: Array<{
  code: IntegrationCategoryCode;
  name: string;
  description: string;
  defaultOpen?: boolean;
}> = [
  { code: 'productivity', name: 'Produtividade e Arquivos', description: 'Documentos, arquivos, planilhas, páginas e fontes de conhecimento.', defaultOpen: true },
  { code: 'communication', name: 'Comunicação', description: 'Mensageria, e-mail, comunidades e comunicação corporativa.', defaultOpen: true },
  { code: 'social', name: 'Redes Sociais', description: 'Monitoramento, relacionamento e atendimento em redes sociais.' },
  { code: 'development_product', name: 'Desenvolvimento e Produto', description: 'Código, deploy, prototipação, APIs, banco e documentação técnica.' },
  { code: 'project_work', name: 'Gestão de Projetos e Trabalho', description: 'Backlog, tarefas, projetos, documentação de time, boards e service management.', defaultOpen: true },
  { code: 'crm_marketing', name: 'CRM, Comercial e Marketing', description: 'Leads, oportunidades, campanhas, relacionamento e funil comercial.' },
  { code: 'erp_operations', name: 'ERP, Estoque e Operação Comercial', description: 'Produtos, pedidos, estoque, notas, lojas e operação comercial.' },
  { code: 'finance_payments', name: 'Financeiro e Pagamentos', description: 'Pagamentos, cobrança, assinatura, mercado financeiro e dados financeiros.' },
  { code: 'support_service', name: 'Suporte e Atendimento', description: 'Tickets, central de ajuda, suporte estruturado e atendimento ao cliente.' },
  { code: 'data_analytics', name: 'Dados e Analytics', description: 'Dados, eventos, métricas, BI, análise de produto e indicadores.' },
  { code: 'education_knowledge', name: 'Pesquisa, Educação e Conhecimento', description: 'Pesquisa, fontes científicas, bases públicas, feeds, páginas e conhecimento.' },
  { code: 'security', name: 'Segurança', description: 'Verificação, auditoria, segurança, privacidade e confiança.' },
  { code: 'custom_api', name: 'APIs e Conectores Customizados', description: 'API REST, GraphQL, webhooks, bancos e arquivos recorrentes guiados pelo agente.', defaultOpen: true },
];

export const integrationProviders: IntegrationProvider[] = [
  // Produtividade e arquivos
  { code: 'google_drive', name: 'Google Drive', category: 'productivity', description: 'Drive, Docs, Sheets e Slides para documentos e conhecimento.', status: 'Pronto para conectar', minimumPlan: 'Student', connectorLevel: 'Conector preparado', logoDomain: 'drive.google.com' },
  { code: 'google_docs', name: 'Google Docs', category: 'productivity', description: 'Documentos para conhecimento, análise e referência.', status: 'Pronto para conectar', minimumPlan: 'Student', connectorLevel: 'Conector preparado', logoDomain: 'docs.google.com' },
  { code: 'google_sheets', name: 'Google Sheets', category: 'productivity', description: 'Planilhas e dados tabulares para consulta e relatórios.', status: 'Pronto para conectar', minimumPlan: 'Student', connectorLevel: 'Conector preparado', logoDomain: 'sheets.google.com' },
  { code: 'google_slides', name: 'Google Slides', category: 'productivity', description: 'Apresentações e materiais de apoio.', status: 'Pronto para conectar', minimumPlan: 'Student', connectorLevel: 'Conector preparado', logoDomain: 'slides.google.com' },
  { code: 'onedrive', name: 'Microsoft OneDrive', category: 'productivity', description: 'Arquivos e documentos em nuvem Microsoft.', status: 'Pronto para conectar', minimumPlan: 'Student', connectorLevel: 'Conector preparado', logoDomain: 'onedrive.live.com' },
  { code: 'sharepoint', name: 'SharePoint', category: 'productivity', description: 'Portais, documentos e arquivos corporativos.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'sharepoint.com' },
  { code: 'dropbox', name: 'Dropbox', category: 'productivity', description: 'Arquivos compartilhados em nuvem.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'dropbox.com' },
  { code: 'box', name: 'Box', category: 'productivity', description: 'Gestão corporativa de arquivos.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'box.com' },
  { code: 'notion', name: 'Notion', category: 'productivity', description: 'Páginas, bases e documentação estruturada.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'notion.so' },

  // Comunicação
  { code: 'gmail', name: 'Gmail', category: 'communication', description: 'Leitura, triagem e respostas por e-mail.', status: 'Pronto para conectar', minimumPlan: 'Student', connectorLevel: 'Conector preparado', logoDomain: 'gmail.com' },
  { code: 'outlook_email', name: 'Outlook Email', category: 'communication', description: 'Caixas de entrada Outlook e rascunhos de resposta.', status: 'Pronto para conectar', minimumPlan: 'Student', connectorLevel: 'Conector preparado', logoDomain: 'outlook.live.com' },
  { code: 'whatsapp_business', name: 'WhatsApp Business', category: 'communication', description: 'Mensageria para atendimento, confirmação e notificações.', status: 'Em desenvolvimento', minimumPlan: 'Student', connectorLevel: 'Conector preparado', logoDomain: 'whatsapp.com' },
  { code: 'blip', name: 'Blip', category: 'communication', description: 'Plataforma de atendimento conversacional, bots e canais digitais.', status: 'Em desenvolvimento', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'blip.ai' },
  { code: 'zenvia', name: 'Zenvia', category: 'communication', description: 'Mensageria, WhatsApp, SMS e atendimento conversacional.', status: 'Em desenvolvimento', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'zenvia.com' },
  { code: 'twilio', name: 'Twilio', category: 'communication', description: 'APIs de comunicação para mensagens, SMS, WhatsApp e notificações.', status: 'Em desenvolvimento', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'twilio.com' },
  { code: 'sms', name: 'SMS', category: 'communication', description: 'Mensagens curtas para alertas e confirmações.', status: 'Planejado', minimumPlan: 'Student', connectorLevel: 'Catálogo' },
  { code: 'slack', name: 'Slack', category: 'communication', description: 'Canais, mensagens e colaboração interna.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'slack.com' },
  { code: 'teams', name: 'Microsoft Teams', category: 'communication', description: 'Times, conversas e reuniões Microsoft.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'teams.microsoft.com' },
  { code: 'zoom', name: 'Zoom', category: 'communication', description: 'Reuniões, insights e acompanhamento.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'zoom.us' },
  { code: 'telegram', name: 'Telegram', category: 'communication', description: 'Mensageria instantânea e comunidades.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'telegram.org' },
  { code: 'discord', name: 'Discord', category: 'communication', description: 'Comunidades, suporte técnico e times internos.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'discord.com' },

  // Redes sociais
  { code: 'instagram', name: 'Instagram', category: 'social', description: 'Monitoramento e atendimento em Instagram.', status: 'Em desenvolvimento', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'instagram.com' },
  { code: 'facebook_pages', name: 'Facebook Pages', category: 'social', description: 'Páginas, publicações, comentários e relacionamento.', status: 'Em desenvolvimento', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'facebook.com' },
  { code: 'facebook_messenger', name: 'Facebook Messenger', category: 'social', description: 'Mensagens e atendimento via Facebook.', status: 'Em desenvolvimento', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'messenger.com' },
  { code: 'x_twitter', name: 'X / Twitter', category: 'social', description: 'Monitoramento de menções, posts e assuntos.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'x.com' },
  { code: 'threads', name: 'Threads', category: 'social', description: 'Rede textual para relacionamento e monitoramento.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'threads.net' },
  { code: 'linkedin', name: 'LinkedIn', category: 'social', description: 'Relacionamento profissional, publicações e leads.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'linkedin.com' },
  { code: 'youtube', name: 'YouTube', category: 'social', description: 'Comentários, canais e conteúdo em vídeo.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'youtube.com' },
  { code: 'tiktok', name: 'TikTok', category: 'social', description: 'Conteúdo social em vídeo e monitoramento.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'tiktok.com' },

  // Desenvolvimento e Produto
  { code: 'github', name: 'GitHub', category: 'development_product', description: 'PRs, issues, CI e fluxos de publicação.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'github.com' },
  { code: 'gitlab', name: 'GitLab', category: 'development_product', description: 'Repositórios, issues e pipelines.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'gitlab.com' },
  { code: 'bitbucket', name: 'Bitbucket', category: 'development_product', description: 'Repositórios e versionamento.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'bitbucket.org' },
  { code: 'azure_devops', name: 'Azure DevOps', category: 'development_product', description: 'Boards, repositórios, pipelines e artefatos.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'dev.azure.com' },
  { code: 'supabase', name: 'Supabase', category: 'development_product', description: 'Banco, autenticação, storage e APIs.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'supabase.com' },
  { code: 'vercel', name: 'Vercel', category: 'development_product', description: 'Deploy de apps web e agentes.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'vercel.com' },
  { code: 'replit', name: 'Replit', category: 'development_product', description: 'Ambiente para protótipos e apps.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'replit.com' },
  { code: 'lovable', name: 'Lovable', category: 'development_product', description: 'Construção de apps e sites.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'lovable.dev' },
  { code: 'figma', name: 'Figma', category: 'development_product', description: 'Design, prototipação e fluxos design-to-code.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'figma.com' },
  { code: 'postman', name: 'Postman', category: 'development_product', description: 'APIs, collections, environments e testes.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'postman.com' },
  { code: 'swagger_openapi', name: 'Swagger / OpenAPI', category: 'development_product', description: 'Documentação e contratos de APIs.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'swagger.io' },

  // Gestão de Projetos e Trabalho
  { code: 'jira', name: 'Jira', category: 'project_work', description: 'Issues, backlog, tarefas e roadmap.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'atlassian.com' },
  { code: 'jira_service_management', name: 'Jira Service Management', category: 'project_work', description: 'Atendimentos, service desk, SLAs e tickets.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'atlassian.com' },
  { code: 'confluence', name: 'Confluence', category: 'project_work', description: 'Documentação de projeto, atas, decisões e requisitos.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'atlassian.com' },
  { code: 'trello', name: 'Trello', category: 'project_work', description: 'Quadros, listas e cartões de trabalho.', status: 'Pronto para conectar', minimumPlan: 'Student', connectorLevel: 'Conector preparado', logoDomain: 'trello.com' },
  { code: 'monday', name: 'monday.com', category: 'project_work', description: 'Gestão de projetos, operações e times.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'monday.com' },
  { code: 'asana', name: 'Asana', category: 'project_work', description: 'Projetos, tarefas e fluxos de trabalho.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'asana.com' },
  { code: 'clickup', name: 'ClickUp', category: 'project_work', description: 'Tarefas, documentos, metas e automações.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'clickup.com' },
  { code: 'linear', name: 'Linear', category: 'project_work', description: 'Issues, times e desenvolvimento de produto.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'linear.app' },
  { code: 'wrike', name: 'Wrike', category: 'project_work', description: 'Gestão de trabalho corporativo.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'wrike.com' },
  { code: 'smartsheet', name: 'Smartsheet', category: 'project_work', description: 'Planilhas operacionais, projetos e processos.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'smartsheet.com' },
  { code: 'basecamp', name: 'Basecamp', category: 'project_work', description: 'Projetos, colaboração e tarefas.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'basecamp.com' },

  // CRM
  { code: 'salesforce', name: 'Salesforce', category: 'crm_marketing', description: 'CRM corporativo, leads, contas e oportunidades.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'salesforce.com' },
  { code: 'hubspot', name: 'HubSpot', category: 'crm_marketing', description: 'CRM, marketing, vendas e automação.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'hubspot.com' },
  { code: 'pipedrive', name: 'Pipedrive', category: 'crm_marketing', description: 'Funil de vendas, leads e oportunidades.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'pipedrive.com' },
  { code: 'rd_station', name: 'RD Station', category: 'crm_marketing', description: 'Marketing, automação e leads.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'rdstation.com' },
  { code: 'zoho_crm', name: 'Zoho CRM', category: 'crm_marketing', description: 'CRM, automações e relacionamento comercial.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'zoho.com' },
  { code: 'agendor', name: 'Agendor', category: 'crm_marketing', description: 'CRM brasileiro para vendas e follow-up.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'agendor.com.br' },
  { code: 'piperun', name: 'PipeRun', category: 'crm_marketing', description: 'CRM de vendas, funil e automações.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'crmpiperun.com' },
  { code: 'kommo', name: 'Kommo', category: 'crm_marketing', description: 'CRM conversacional e mensageria comercial.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'kommo.com' },
  { code: 'activecampaign', name: 'ActiveCampaign', category: 'crm_marketing', description: 'Marketing, automação e relacionamento.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'activecampaign.com' },
  { code: 'mailchimp', name: 'Mailchimp', category: 'crm_marketing', description: 'Campanhas, listas, e-mail marketing e automação.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'mailchimp.com' },
  { code: 'clay', name: 'Clay', category: 'crm_marketing', description: 'GTM data and functions.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'clay.com' },

  // ERP
  { code: 'bling', name: 'Bling', category: 'erp_operations', description: 'Produtos, pedidos, estoque e notas.', status: 'Em desenvolvimento', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'bling.com.br' },
  { code: 'tiny_erp', name: 'Tiny ERP', category: 'erp_operations', description: 'ERP, produtos, pedidos e estoque.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'tiny.com.br' },
  { code: 'omie', name: 'Omie', category: 'erp_operations', description: 'ERP, financeiro, vendas e notas fiscais.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'omie.com.br' },
  { code: 'conta_azul', name: 'Conta Azul', category: 'erp_operations', description: 'Gestão empresarial e operação financeira.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'contaazul.com' },
  { code: 'nuvemshop', name: 'Nuvemshop', category: 'erp_operations', description: 'Loja virtual, pedidos, clientes e produtos.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'nuvemshop.com.br' },
  { code: 'shopify', name: 'Shopify', category: 'erp_operations', description: 'E-commerce, pedidos, produtos e clientes.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'shopify.com' },
  { code: 'woocommerce', name: 'WooCommerce', category: 'erp_operations', description: 'Loja virtual WordPress, pedidos e produtos.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'woocommerce.com' },
  { code: 'mercado_livre', name: 'Mercado Livre', category: 'erp_operations', description: 'Marketplace, produtos, pedidos e atendimento.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'mercadolivre.com.br' },
  { code: 'magento', name: 'Magento', category: 'erp_operations', description: 'E-commerce corporativo e catálogo de produtos.', status: 'Planejado', minimumPlan: 'Enterprise', connectorLevel: 'Catálogo', logoDomain: 'magento.com' },

  // Financeiro
  { code: 'stripe', name: 'Stripe', category: 'finance_payments', description: 'Pagamentos, assinaturas e cobrança.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'stripe.com' },
  { code: 'paypal', name: 'PayPal', category: 'finance_payments', description: 'Pagamentos e transações online.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'paypal.com' },
  { code: 'mercado_pago', name: 'Mercado Pago', category: 'finance_payments', description: 'Pagamentos, cobranças e transações.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'mercadopago.com.br' },
  { code: 'asaas', name: 'Asaas', category: 'finance_payments', description: 'Cobrança, boleto, pix, cartão e assinaturas.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'asaas.com' },
  { code: 'iugu', name: 'Iugu', category: 'finance_payments', description: 'Pagamentos, assinatura e automação financeira.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'iugu.com' },
  { code: 'binance', name: 'Binance', category: 'finance_payments', description: 'Dados de mercado cripto e operações autorizadas.', status: 'Planejado', minimumPlan: 'Enterprise', connectorLevel: 'Catálogo', logoDomain: 'binance.com' },
  { code: 'alpaca', name: 'Alpaca', category: 'finance_payments', description: 'Dados de mercado: ações e cripto.', status: 'Planejado', minimumPlan: 'Enterprise', connectorLevel: 'Catálogo', logoDomain: 'alpaca.markets' },
  { code: 'open_finance', name: 'Open Finance / Bancos', category: 'finance_payments', description: 'Conexões financeiras autorizadas e dados bancários.', status: 'Planejado', minimumPlan: 'Enterprise', connectorLevel: 'Catálogo' },

  // Suporte
  { code: 'zendesk', name: 'Zendesk', category: 'support_service', description: 'Tickets, central de ajuda e suporte ao cliente.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'zendesk.com' },
  { code: 'freshdesk', name: 'Freshdesk', category: 'support_service', description: 'Central de suporte, tickets e automações.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'freshdesk.com' },
  { code: 'movidesk', name: 'Movidesk', category: 'support_service', description: 'Help desk brasileiro, tickets e atendimento.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'movidesk.com' },
  { code: 'intercom', name: 'Intercom', category: 'support_service', description: 'Conversas, contatos e tickets.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado', logoDomain: 'intercom.com' },
  { code: 'help_scout', name: 'Help Scout', category: 'support_service', description: 'Caixa compartilhada, base e atendimento.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'helpscout.com' },
  { code: 'servicenow', name: 'ServiceNow', category: 'support_service', description: 'Service management corporativo.', status: 'Planejado', minimumPlan: 'Enterprise', connectorLevel: 'Catálogo', logoDomain: 'servicenow.com' },

  // Dados
  { code: 'data_analytics', name: 'Data Analytics', category: 'data_analytics', description: 'Perguntas de produto e negócio com dados.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo' },
  { code: 'bigquery', name: 'BigQuery', category: 'data_analytics', description: 'Consultas e recursos BigQuery.', status: 'Planejado', minimumPlan: 'Enterprise', connectorLevel: 'Catálogo', logoDomain: 'cloud.google.com' },
  { code: 'posthog', name: 'PostHog', category: 'data_analytics', description: 'Análise de produto e eventos.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'posthog.com' },
  { code: 'mixpanel', name: 'Mixpanel', category: 'data_analytics', description: 'Eventos, funis e análise de produto.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'mixpanel.com' },
  { code: 'amplitude', name: 'Amplitude', category: 'data_analytics', description: 'Product intelligence.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'amplitude.com' },
  { code: 'power_bi', name: 'Power BI', category: 'data_analytics', description: 'Dashboards, datasets e business intelligence.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'powerbi.microsoft.com' },
  { code: 'looker_studio', name: 'Looker Studio', category: 'data_analytics', description: 'Relatórios e visualização de dados.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'lookerstudio.google.com' },
  { code: 'metabase', name: 'Metabase', category: 'data_analytics', description: 'BI, consultas e painéis internos.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'metabase.com' },

  // Conhecimento
  { code: 'consensus', name: 'Consensus', category: 'education_knowledge', description: 'Pesquisa científica e respostas baseadas em estudos.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'consensus.app' },
  { code: 'scite', name: 'Scite', category: 'education_knowledge', description: 'Respostas fundamentadas em ciência.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'scite.ai' },
  { code: 'scispace', name: 'SciSpace', category: 'education_knowledge', description: 'Ciência, pesquisa e leitura de papers.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'typeset.io' },
  { code: 'sider_scholar', name: 'Sider Scholar', category: 'education_knowledge', description: 'Busca acadêmica, papers e referências.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'sider.ai' },
  { code: 'wolfram', name: 'Wolfram', category: 'education_knowledge', description: 'Computação e conhecimento estruturado.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'wolframalpha.com' },
  { code: 'midpage_legal', name: 'Midpage Legal Research', category: 'education_knowledge', description: 'Pesquisa jurídica e referências legais.', status: 'Planejado', minimumPlan: 'Enterprise', connectorLevel: 'Catálogo', logoDomain: 'midpage.ai' },
  { code: 'web_pages', name: 'Sites / Páginas web', category: 'education_knowledge', description: 'Fontes públicas, páginas oficiais e conteúdo informacional.', status: 'Pronto para conectar', minimumPlan: 'Student', connectorLevel: 'Conector preparado' },
  { code: 'rss_feeds', name: 'RSS / Feeds', category: 'education_knowledge', description: 'Feeds e publicações recorrentes.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'Conector preparado' },
  { code: 'manual_upload', name: 'Upload manual de documentos', category: 'education_knowledge', description: 'Arquivos enviados manualmente pelo usuário.', status: 'Pronto para conectar', minimumPlan: 'Básico', connectorLevel: 'Conector preparado' },

  // Segurança
  { code: 'vanta', name: 'Vanta', category: 'security', description: 'Trust, segurança e conformidade.', status: 'Planejado', minimumPlan: 'Enterprise', connectorLevel: 'Catálogo', logoDomain: 'vanta.com' },
  { code: 'malwarebytes', name: 'Malwarebytes', category: 'security', description: 'Verificação de links, domínios e telefones.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'malwarebytes.com' },
  { code: 'bitdefender', name: 'Bitdefender', category: 'security', description: 'Checagem de URLs e segurança.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'bitdefender.com' },
  { code: 'solvery', name: 'Solvery', category: 'security', description: 'Auditoria de permissões e segurança documental.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo' },
  { code: 'purevpn', name: 'PureVPN Privacy Assistant', category: 'security', description: 'Privacidade e navegação segura.', status: 'Planejado', minimumPlan: 'Pro', connectorLevel: 'Catálogo', logoDomain: 'purevpn.com' },

  // API customizada
  { code: 'custom_rest_api', name: 'API REST personalizada', category: 'custom_api', description: 'Conector guiado por agente para APIs REST autorizadas.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'API guiada' },
  { code: 'custom_graphql_api', name: 'API GraphQL personalizada', category: 'custom_api', description: 'Conector guiado por agente para APIs GraphQL.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'API guiada' },
  { code: 'incoming_webhook', name: 'Webhook de entrada', category: 'custom_api', description: 'Recebe eventos externos para atendimento, alerta, tarefa ou conhecimento.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'API guiada' },
  { code: 'outgoing_webhook', name: 'Webhook de saída', category: 'custom_api', description: 'Envia eventos do produto para sistemas externos.', status: 'Pronto para conectar', minimumPlan: 'Pro', connectorLevel: 'API guiada' },
  { code: 'postgres_connection', name: 'Banco PostgreSQL', category: 'custom_api', description: 'Conexão controlada com banco PostgreSQL autorizado.', status: 'Planejado', minimumPlan: 'Enterprise', connectorLevel: 'API guiada' },
  { code: 'mysql_connection', name: 'Banco MySQL', category: 'custom_api', description: 'Conexão controlada com banco MySQL autorizado.', status: 'Planejado', minimumPlan: 'Enterprise', connectorLevel: 'API guiada' },
  { code: 'sqlserver_connection', name: 'Banco SQL Server', category: 'custom_api', description: 'Conexão controlada com SQL Server autorizado.', status: 'Planejado', minimumPlan: 'Enterprise', connectorLevel: 'API guiada' },
  { code: 'csv_recurring', name: 'Arquivo CSV recorrente', category: 'custom_api', description: 'Carga recorrente por arquivo CSV estruturado.', status: 'Pronto para conectar', minimumPlan: 'Student', connectorLevel: 'API guiada' },
  { code: 'json_recurring', name: 'Arquivo JSON recorrente', category: 'custom_api', description: 'Carga recorrente por arquivo JSON estruturado.', status: 'Pronto para conectar', minimumPlan: 'Student', connectorLevel: 'API guiada' },
];

export const nativePlatformServices = [
  'Correios / CEP',
  'Maps / Geolocalização',
  'Voz, transcrição e OCR',
  'Busca vetorial',
];

export const outOfStandardConnectorScope = [
  'e-SUS APS',
  'SISAB',
  'RNDS',
  'CADSUS',
  'BNAFAR',
  'CNES',
  'SIGTAP',
];
