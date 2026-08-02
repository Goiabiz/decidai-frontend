export type IntegrationStatus = 'Conectado' | 'Disponível' | 'Bloqueado pelo plano' | 'Planejado' | 'Erro';
export type IntegrationCategoryCode =
  | 'communication'
  | 'social'
  | 'knowledge'
  | 'atlassian-dev'
  | 'work-management'
  | 'crm-marketing'
  | 'erp-commerce-finance'
  | 'support-service-desk'
  | 'custom-api'
  | 'ai-voice';

export type IntegrationItem = {
  code: string;
  name: string;
  category: IntegrationCategoryCode;
  description: string;
  plan: 'Básico' | 'Student' | 'Pro' | 'Enterprise';
  status: IntegrationStatus;
  logo: string;
  use: 'Comunicação' | 'Rede social' | 'Conhecimento' | 'Desenvolvimento' | 'Gestão' | 'Comercial' | 'Operação' | 'Suporte' | 'API' | 'IA';
  canFeedKnowledge?: boolean;
  canCreateEvents?: boolean;
  canBeChannelProvider?: boolean;
};

export const integrationCategories: Array<{ code: IntegrationCategoryCode; label: string; description: string }> = [
  { code: 'communication', label: 'Comunicação e mensageria', description: 'Conexões técnicas para mensagens, atendimento e notificações.' },
  { code: 'social', label: 'Redes sociais', description: 'Redes sociais e comunidades digitais.' },
  { code: 'knowledge', label: 'Documentos, arquivos e conhecimento', description: 'Fontes documentais e informacionais para base e agente.' },
  { code: 'atlassian-dev', label: 'Atlassian, desenvolvimento e produto', description: 'Backlog, código, documentação técnica e versionamento.' },
  { code: 'work-management', label: 'Gestão de projetos e trabalho', description: 'Ferramentas de tarefas, quadros, times e operações.' },
  { code: 'crm-marketing', label: 'CRM, comercial e marketing', description: 'Leads, oportunidades, campanhas, relacionamento e vendas.' },
  { code: 'erp-commerce-finance', label: 'ERP, estoque, produtos e financeiro', description: 'Produtos, pedidos, estoque, faturamento e pagamentos.' },
  { code: 'support-service-desk', label: 'Suporte e service desk', description: 'Tickets, suporte estruturado e centrais de atendimento.' },
  { code: 'custom-api', label: 'APIs e conectores customizados', description: 'Conexões guiadas com APIs, webhooks, bancos e arquivos recorrentes.' },
  { code: 'ai-voice', label: 'Inteligência artificial e voz', description: 'Modelos, transcrição, voz, OCR e vetores.' },
];

export const integrationCatalog: IntegrationItem[] = [
  { code: 'whatsapp_business', name: 'WhatsApp Business', category: 'communication', description: 'Integração de comunicação para canais de atendimento via WhatsApp.', plan: 'Student', status: 'Disponível', logo: 'WA', use: 'Comunicação', canBeChannelProvider: true },
  { code: 'email', name: 'E-mail', category: 'communication', description: 'Caixas, threads e mensagens para atendimento e registro.', plan: 'Student', status: 'Disponível', logo: '@', use: 'Comunicação', canBeChannelProvider: true, canFeedKnowledge: true },
  { code: 'sms', name: 'SMS', category: 'communication', description: 'Mensagens curtas para confirmação, aviso e comunicação transacional.', plan: 'Student', status: 'Planejado', logo: 'SMS', use: 'Comunicação', canBeChannelProvider: true },
  { code: 'telegram', name: 'Telegram', category: 'communication', description: 'Mensageria instantânea para atendimento e comunidades.', plan: 'Pro', status: 'Disponível', logo: 'TG', use: 'Comunicação', canBeChannelProvider: true },
  { code: 'teams', name: 'Microsoft Teams', category: 'communication', description: 'Mensagens corporativas, times e canais internos.', plan: 'Pro', status: 'Disponível', logo: 'MS', use: 'Comunicação', canBeChannelProvider: true, canFeedKnowledge: true },
  { code: 'discord', name: 'Discord', category: 'communication', description: 'Comunidades, canais técnicos e operação de times.', plan: 'Pro', status: 'Disponível', logo: 'DC', use: 'Comunicação', canBeChannelProvider: true, canFeedKnowledge: true },
  { code: 'voice_phone', name: 'Telefone / Voz', category: 'communication', description: 'Voz, transcrição e atendimento telefônico em fase futura.', plan: 'Enterprise', status: 'Planejado', logo: 'VOZ', use: 'Comunicação', canBeChannelProvider: true },

  { code: 'instagram', name: 'Instagram', category: 'social', description: 'Interações sociais, comentários e mensagens conforme APIs disponíveis.', plan: 'Pro', status: 'Planejado', logo: 'IG', use: 'Rede social', canBeChannelProvider: true },
  { code: 'facebook_messenger', name: 'Facebook Messenger', category: 'social', description: 'Mensageria social vinculada ao ecossistema Meta.', plan: 'Pro', status: 'Planejado', logo: 'FB', use: 'Rede social', canBeChannelProvider: true },
  { code: 'facebook_pages', name: 'Facebook Pages', category: 'social', description: 'Páginas, publicações e interações públicas autorizadas.', plan: 'Pro', status: 'Planejado', logo: 'FP', use: 'Rede social', canFeedKnowledge: true },
  { code: 'x_twitter', name: 'X / Twitter', category: 'social', description: 'Monitoramento e interação em publicações autorizadas.', plan: 'Pro', status: 'Planejado', logo: 'X', use: 'Rede social', canFeedKnowledge: true },
  { code: 'threads', name: 'Threads', category: 'social', description: 'Rede social de conversas públicas do ecossistema Meta.', plan: 'Pro', status: 'Planejado', logo: 'TH', use: 'Rede social', canFeedKnowledge: true },
  { code: 'linkedin', name: 'LinkedIn', category: 'social', description: 'Conteúdos e interações profissionais.', plan: 'Pro', status: 'Planejado', logo: 'IN', use: 'Rede social', canFeedKnowledge: true },
  { code: 'youtube', name: 'YouTube', category: 'social', description: 'Canais, vídeos, comentários e conteúdo de conhecimento.', plan: 'Pro', status: 'Planejado', logo: 'YT', use: 'Rede social', canFeedKnowledge: true },
  { code: 'tiktok', name: 'TikTok', category: 'social', description: 'Conteúdos e interações sociais quando autorizadas.', plan: 'Pro', status: 'Planejado', logo: 'TK', use: 'Rede social' },

  { code: 'google_drive', name: 'Google Drive', category: 'knowledge', description: 'Pastas e arquivos para base de conhecimento.', plan: 'Student', status: 'Disponível', logo: 'GD', use: 'Conhecimento', canFeedKnowledge: true },
  { code: 'google_docs', name: 'Google Docs', category: 'knowledge', description: 'Documentos colaborativos conectados à base.', plan: 'Student', status: 'Disponível', logo: 'DOC', use: 'Conhecimento', canFeedKnowledge: true },
  { code: 'google_sheets', name: 'Google Sheets', category: 'knowledge', description: 'Planilhas e bases tabulares.', plan: 'Student', status: 'Disponível', logo: 'SHT', use: 'Conhecimento', canFeedKnowledge: true, canCreateEvents: true },
  { code: 'google_slides', name: 'Google Slides', category: 'knowledge', description: 'Apresentações e materiais institucionais.', plan: 'Student', status: 'Planejado', logo: 'SLD', use: 'Conhecimento', canFeedKnowledge: true },
  { code: 'onedrive', name: 'Microsoft OneDrive', category: 'knowledge', description: 'Arquivos e documentos do Microsoft 365.', plan: 'Pro', status: 'Disponível', logo: 'OD', use: 'Conhecimento', canFeedKnowledge: true },
  { code: 'sharepoint', name: 'SharePoint', category: 'knowledge', description: 'Sites, bibliotecas e documentos corporativos.', plan: 'Pro', status: 'Disponível', logo: 'SP', use: 'Conhecimento', canFeedKnowledge: true },
  { code: 'dropbox', name: 'Dropbox', category: 'knowledge', description: 'Arquivos e pastas compartilhadas.', plan: 'Pro', status: 'Planejado', logo: 'DB', use: 'Conhecimento', canFeedKnowledge: true },
  { code: 'box', name: 'Box', category: 'knowledge', description: 'Arquivos corporativos e repositórios documentais.', plan: 'Pro', status: 'Planejado', logo: 'BOX', use: 'Conhecimento', canFeedKnowledge: true },
  { code: 'notion', name: 'Notion', category: 'knowledge', description: 'Páginas, bases e documentação de trabalho.', plan: 'Pro', status: 'Disponível', logo: 'NO', use: 'Conhecimento', canFeedKnowledge: true },
  { code: 'web_pages', name: 'Sites / páginas web', category: 'knowledge', description: 'Páginas públicas ou autorizadas para conhecimento regulatório e institucional.', plan: 'Student', status: 'Disponível', logo: 'WWW', use: 'Conhecimento', canFeedKnowledge: true },
  { code: 'rss_feeds', name: 'RSS / Feeds', category: 'knowledge', description: 'Feeds de notícias, publicações e atualizações.', plan: 'Pro', status: 'Planejado', logo: 'RSS', use: 'Conhecimento', canFeedKnowledge: true },
  { code: 'manual_upload', name: 'Upload manual de documentos', category: 'knowledge', description: 'Carga manual de PDFs, imagens, planilhas e arquivos.', plan: 'Básico', status: 'Disponível', logo: 'UP', use: 'Conhecimento', canFeedKnowledge: true },

  { code: 'jira', name: 'Jira', category: 'atlassian-dev', description: 'Issues, projetos, backlog e tarefas.', plan: 'Pro', status: 'Disponível', logo: 'JR', use: 'Desenvolvimento', canCreateEvents: true, canFeedKnowledge: true },
  { code: 'jira_service_management', name: 'Jira Service Management', category: 'atlassian-dev', description: 'Portal, filas, tickets e service desk Atlassian.', plan: 'Pro', status: 'Disponível', logo: 'JSM', use: 'Suporte', canCreateEvents: true, canBeChannelProvider: true },
  { code: 'confluence', name: 'Confluence', category: 'atlassian-dev', description: 'Espaços e páginas de documentação.', plan: 'Pro', status: 'Disponível', logo: 'CF', use: 'Conhecimento', canFeedKnowledge: true },
  { code: 'trello', name: 'Trello', category: 'atlassian-dev', description: 'Quadros, listas e cartões.', plan: 'Student', status: 'Disponível', logo: 'TR', use: 'Gestão', canCreateEvents: true },
  { code: 'bitbucket', name: 'Bitbucket', category: 'atlassian-dev', description: 'Repositórios e versionamento Atlassian.', plan: 'Pro', status: 'Planejado', logo: 'BB', use: 'Desenvolvimento', canFeedKnowledge: true },
  { code: 'github', name: 'GitHub', category: 'atlassian-dev', description: 'Repositórios, issues e pull requests.', plan: 'Pro', status: 'Disponível', logo: 'GH', use: 'Desenvolvimento', canCreateEvents: true, canFeedKnowledge: true },
  { code: 'gitlab', name: 'GitLab', category: 'atlassian-dev', description: 'Repositórios, issues, merge requests e pipelines.', plan: 'Pro', status: 'Planejado', logo: 'GL', use: 'Desenvolvimento', canCreateEvents: true },
  { code: 'azure_devops', name: 'Azure DevOps', category: 'atlassian-dev', description: 'Boards, repositórios, pipelines e artefatos.', plan: 'Pro', status: 'Planejado', logo: 'AZ', use: 'Desenvolvimento', canCreateEvents: true },

  { code: 'monday', name: 'monday.com', category: 'work-management', description: 'Quadros, automações e gestão operacional.', plan: 'Pro', status: 'Disponível', logo: 'MO', use: 'Gestão', canCreateEvents: true },
  { code: 'asana', name: 'Asana', category: 'work-management', description: 'Projetos, tarefas e equipes.', plan: 'Pro', status: 'Planejado', logo: 'AS', use: 'Gestão', canCreateEvents: true },
  { code: 'clickup', name: 'ClickUp', category: 'work-management', description: 'Tarefas, documentos e gestão de trabalho.', plan: 'Pro', status: 'Planejado', logo: 'CU', use: 'Gestão', canCreateEvents: true },
  { code: 'linear', name: 'Linear', category: 'work-management', description: 'Issues e roadmap de produto.', plan: 'Pro', status: 'Planejado', logo: 'LN', use: 'Gestão', canCreateEvents: true },
  { code: 'notion_projects', name: 'Notion Projects', category: 'work-management', description: 'Projetos e bases de trabalho no Notion.', plan: 'Pro', status: 'Planejado', logo: 'NP', use: 'Gestão', canCreateEvents: true },
  { code: 'wrike', name: 'Wrike', category: 'work-management', description: 'Gestão de projetos e colaboração.', plan: 'Pro', status: 'Planejado', logo: 'WR', use: 'Gestão', canCreateEvents: true },
  { code: 'smartsheet', name: 'Smartsheet', category: 'work-management', description: 'Planilhas operacionais e automação de trabalho.', plan: 'Pro', status: 'Planejado', logo: 'SS', use: 'Gestão', canCreateEvents: true },
  { code: 'basecamp', name: 'Basecamp', category: 'work-management', description: 'Projetos, equipes e colaboração.', plan: 'Pro', status: 'Planejado', logo: 'BC', use: 'Gestão', canCreateEvents: true },

  { code: 'salesforce', name: 'Salesforce', category: 'crm-marketing', description: 'CRM, contas, oportunidades e pipeline.', plan: 'Pro', status: 'Disponível', logo: 'SF', use: 'Comercial', canCreateEvents: true },
  { code: 'hubspot', name: 'HubSpot', category: 'crm-marketing', description: 'CRM, marketing, vendas e atendimento.', plan: 'Pro', status: 'Disponível', logo: 'HS', use: 'Comercial', canCreateEvents: true },
  { code: 'pipedrive', name: 'Pipedrive', category: 'crm-marketing', description: 'Funil comercial e atividades de venda.', plan: 'Pro', status: 'Planejado', logo: 'PD', use: 'Comercial', canCreateEvents: true },
  { code: 'rd_station', name: 'RD Station', category: 'crm-marketing', description: 'Marketing, leads e automação comercial.', plan: 'Pro', status: 'Planejado', logo: 'RD', use: 'Comercial', canCreateEvents: true },
  { code: 'zoho_crm', name: 'Zoho CRM', category: 'crm-marketing', description: 'CRM, vendas e relacionamento.', plan: 'Pro', status: 'Planejado', logo: 'ZO', use: 'Comercial', canCreateEvents: true },
  { code: 'agendor', name: 'Agendor', category: 'crm-marketing', description: 'CRM brasileiro para vendas e relacionamento.', plan: 'Pro', status: 'Planejado', logo: 'AG', use: 'Comercial', canCreateEvents: true },
  { code: 'piperun', name: 'PipeRun', category: 'crm-marketing', description: 'CRM e automação comercial.', plan: 'Pro', status: 'Planejado', logo: 'PR', use: 'Comercial', canCreateEvents: true },
  { code: 'kommo', name: 'Kommo', category: 'crm-marketing', description: 'CRM conversacional e automação de vendas.', plan: 'Pro', status: 'Planejado', logo: 'KO', use: 'Comercial', canCreateEvents: true },
  { code: 'activecampaign', name: 'ActiveCampaign', category: 'crm-marketing', description: 'Marketing, automação e CRM.', plan: 'Pro', status: 'Planejado', logo: 'AC', use: 'Comercial', canCreateEvents: true },
  { code: 'mailchimp', name: 'Mailchimp', category: 'crm-marketing', description: 'E-mail marketing, públicos e campanhas.', plan: 'Pro', status: 'Planejado', logo: 'MC', use: 'Comercial', canCreateEvents: true },

  { code: 'bling', name: 'Bling', category: 'erp-commerce-finance', description: 'Produtos, pedidos, estoque, notas e operação comercial.', plan: 'Pro', status: 'Disponível', logo: 'BL', use: 'Operação', canCreateEvents: true },
  { code: 'tiny_erp', name: 'Tiny ERP', category: 'erp-commerce-finance', description: 'ERP, pedidos, produtos, estoque e e-commerce.', plan: 'Pro', status: 'Planejado', logo: 'TY', use: 'Operação', canCreateEvents: true },
  { code: 'omie', name: 'Omie', category: 'erp-commerce-finance', description: 'ERP, financeiro, vendas e serviços.', plan: 'Pro', status: 'Planejado', logo: 'OM', use: 'Operação', canCreateEvents: true },
  { code: 'conta_azul', name: 'Conta Azul', category: 'erp-commerce-finance', description: 'Gestão financeira e operacional.', plan: 'Pro', status: 'Planejado', logo: 'CA', use: 'Operação', canCreateEvents: true },
  { code: 'nuvemshop', name: 'Nuvemshop', category: 'erp-commerce-finance', description: 'Loja virtual, pedidos e produtos.', plan: 'Pro', status: 'Planejado', logo: 'NS', use: 'Operação', canCreateEvents: true },
  { code: 'shopify', name: 'Shopify', category: 'erp-commerce-finance', description: 'E-commerce, produtos, pedidos e clientes.', plan: 'Pro', status: 'Planejado', logo: 'SH', use: 'Operação', canCreateEvents: true },
  { code: 'woocommerce', name: 'WooCommerce', category: 'erp-commerce-finance', description: 'E-commerce WordPress, pedidos e produtos.', plan: 'Pro', status: 'Planejado', logo: 'WC', use: 'Operação', canCreateEvents: true },
  { code: 'mercado_livre', name: 'Mercado Livre', category: 'erp-commerce-finance', description: 'Marketplace, anúncios, pedidos e mensagens.', plan: 'Pro', status: 'Planejado', logo: 'ML', use: 'Operação', canCreateEvents: true },
  { code: 'magento', name: 'Magento', category: 'erp-commerce-finance', description: 'E-commerce, catálogo, pedidos e clientes.', plan: 'Enterprise', status: 'Planejado', logo: 'MG', use: 'Operação', canCreateEvents: true },
  { code: 'stripe', name: 'Stripe', category: 'erp-commerce-finance', description: 'Pagamentos, assinaturas e cobranças.', plan: 'Pro', status: 'Planejado', logo: 'ST', use: 'Operação', canCreateEvents: true },
  { code: 'paypal', name: 'PayPal', category: 'erp-commerce-finance', description: 'Pagamentos e cobranças.', plan: 'Pro', status: 'Planejado', logo: 'PP', use: 'Operação', canCreateEvents: true },
  { code: 'mercado_pago', name: 'Mercado Pago', category: 'erp-commerce-finance', description: 'Pagamentos e cobranças.', plan: 'Pro', status: 'Planejado', logo: 'MP', use: 'Operação', canCreateEvents: true },
  { code: 'asaas', name: 'Asaas', category: 'erp-commerce-finance', description: 'Cobranças, pagamentos e financeiro.', plan: 'Pro', status: 'Planejado', logo: 'AA', use: 'Operação', canCreateEvents: true },
  { code: 'iugu', name: 'Iugu', category: 'erp-commerce-finance', description: 'Pagamentos, assinaturas e automação financeira.', plan: 'Pro', status: 'Planejado', logo: 'IU', use: 'Operação', canCreateEvents: true },

  { code: 'zendesk', name: 'Zendesk', category: 'support-service-desk', description: 'Tickets, central de ajuda e suporte.', plan: 'Pro', status: 'Disponível', logo: 'ZD', use: 'Suporte', canCreateEvents: true, canFeedKnowledge: true },
  { code: 'freshdesk', name: 'Freshdesk', category: 'support-service-desk', description: 'Tickets, suporte e base de conhecimento.', plan: 'Pro', status: 'Planejado', logo: 'FD', use: 'Suporte', canCreateEvents: true, canFeedKnowledge: true },
  { code: 'movidesk', name: 'Movidesk', category: 'support-service-desk', description: 'Tickets, SLA e suporte brasileiro.', plan: 'Pro', status: 'Planejado', logo: 'MV', use: 'Suporte', canCreateEvents: true },
  { code: 'intercom', name: 'Intercom', category: 'support-service-desk', description: 'Chat, atendimento, automações e base.', plan: 'Pro', status: 'Planejado', logo: 'IC', use: 'Suporte', canCreateEvents: true },
  { code: 'help_scout', name: 'Help Scout', category: 'support-service-desk', description: 'Caixas, tickets e suporte.', plan: 'Pro', status: 'Planejado', logo: 'HS', use: 'Suporte', canCreateEvents: true },
  { code: 'servicenow', name: 'ServiceNow', category: 'support-service-desk', description: 'Service management corporativo.', plan: 'Enterprise', status: 'Planejado', logo: 'SN', use: 'Suporte', canCreateEvents: true },

  { code: 'custom_rest_api', name: 'API REST personalizada', category: 'custom-api', description: 'Conector guiado para APIs REST específicas do cliente.', plan: 'Pro', status: 'Disponível', logo: 'API', use: 'API', canCreateEvents: true, canFeedKnowledge: true },
  { code: 'custom_graphql_api', name: 'API GraphQL personalizada', category: 'custom-api', description: 'Conector guiado para APIs GraphQL específicas do cliente.', plan: 'Pro', status: 'Planejado', logo: 'GQL', use: 'API', canCreateEvents: true },
  { code: 'incoming_webhook', name: 'Webhook de entrada', category: 'custom-api', description: 'Recebe eventos externos para gerar atendimento, alerta ou tarefa.', plan: 'Pro', status: 'Disponível', logo: 'IN', use: 'API', canCreateEvents: true },
  { code: 'outgoing_webhook', name: 'Webhook de saída', category: 'custom-api', description: 'Envia eventos do produto para sistemas externos.', plan: 'Pro', status: 'Disponível', logo: 'OUT', use: 'API', canCreateEvents: true },
  { code: 'postgresql', name: 'Banco PostgreSQL', category: 'custom-api', description: 'Consulta controlada em banco PostgreSQL autorizado.', plan: 'Enterprise', status: 'Planejado', logo: 'PG', use: 'API', canCreateEvents: true },
  { code: 'mysql', name: 'Banco MySQL', category: 'custom-api', description: 'Consulta controlada em banco MySQL autorizado.', plan: 'Enterprise', status: 'Planejado', logo: 'MY', use: 'API', canCreateEvents: true },
  { code: 'sqlserver', name: 'Banco SQL Server', category: 'custom-api', description: 'Consulta controlada em banco SQL Server autorizado.', plan: 'Enterprise', status: 'Planejado', logo: 'SQL', use: 'API', canCreateEvents: true },
  { code: 'recurring_csv', name: 'Arquivo CSV recorrente', category: 'custom-api', description: 'Carga recorrente de arquivo CSV para dicionário de dados.', plan: 'Pro', status: 'Planejado', logo: 'CSV', use: 'API', canCreateEvents: true },
  { code: 'recurring_json', name: 'Arquivo JSON recorrente', category: 'custom-api', description: 'Carga recorrente de JSON para eventos, campos e telas.', plan: 'Pro', status: 'Planejado', logo: 'JSN', use: 'API', canCreateEvents: true },

  { code: 'openai', name: 'OpenAI', category: 'ai-voice', description: 'Modelos de IA, geração, análise e embeddings.', plan: 'Pro', status: 'Disponível', logo: 'AI', use: 'IA' },
  { code: 'azure_openai', name: 'Azure OpenAI', category: 'ai-voice', description: 'Modelos de IA em ambiente Microsoft/Azure.', plan: 'Enterprise', status: 'Planejado', logo: 'AZ', use: 'IA' },
  { code: 'gemini', name: 'Google Gemini', category: 'ai-voice', description: 'Modelos de IA do Google.', plan: 'Pro', status: 'Planejado', logo: 'GE', use: 'IA' },
  { code: 'anthropic', name: 'Anthropic', category: 'ai-voice', description: 'Modelos de IA alternativos.', plan: 'Pro', status: 'Planejado', logo: 'AN', use: 'IA' },
  { code: 'mistral', name: 'Mistral', category: 'ai-voice', description: 'Modelos abertos/comerciais de IA.', plan: 'Pro', status: 'Planejado', logo: 'MI', use: 'IA' },
  { code: 'elevenlabs', name: 'ElevenLabs', category: 'ai-voice', description: 'Voz sintética e áudio.', plan: 'Enterprise', status: 'Planejado', logo: 'EL', use: 'IA' },
  { code: 'transcription', name: 'Transcrição de áudio', category: 'ai-voice', description: 'Transcrição de áudios para atendimento, conhecimento e auditoria.', plan: 'Pro', status: 'Planejado', logo: 'TR', use: 'IA' },
  { code: 'ocr', name: 'OCR', category: 'ai-voice', description: 'Extração de texto em imagens e documentos digitalizados.', plan: 'Pro', status: 'Planejado', logo: 'OCR', use: 'IA', canFeedKnowledge: true },
  { code: 'vector_database', name: 'Vector Database', category: 'ai-voice', description: 'Armazenamento vetorial para busca semântica e RAG.', plan: 'Enterprise', status: 'Planejado', logo: 'VDB', use: 'IA', canFeedKnowledge: true },
];

export const nativePlatformServices = [
  'Correios / CEP',
  'Maps / geolocalização / rotas',
];

export const excludedDefaultConnectors = [
  'e-SUS APS',
  'RNDS',
  'CADSUS',
  'SISAB',
  'BNAFAR',
  'CNES',
  'SIGTAP',
];
