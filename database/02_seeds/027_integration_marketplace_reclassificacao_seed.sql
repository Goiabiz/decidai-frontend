-- 027_integration_marketplace_reclassificacao_seed.sql
-- Reclassifica catálogo de integrações para modelo marketplace por tipo de serviço.
insert into public.integration_categories(code, name, description, sort_order) values
('productivity','Produtividade e Arquivos','Documentos, arquivos, planilhas, páginas e fontes de conhecimento operacional.',10),
('communication','Comunicação','Mensageria, e-mail, comunidades e comunicação corporativa.',20),
('social','Redes Sociais','Monitoramento, relacionamento e atendimento em redes sociais.',30),
('development_product','Desenvolvimento e Produto','Código, deploy, prototipação, APIs, banco, documentação técnica e produto.',40),
('project_work','Gestão de Projetos e Trabalho','Backlog, tarefas, projetos, documentação de time, boards e service management.',50),
('crm_marketing','CRM, Comercial e Marketing','Leads, oportunidades, campanhas, relacionamento e funil comercial.',60),
('erp_operations','ERP, Estoque e Operação Comercial','Produtos, pedidos, estoque, notas, lojas e operação comercial.',70),
('finance_payments','Financeiro e Pagamentos','Pagamentos, cobrança, assinatura, mercado financeiro e dados financeiros.',80),
('support_service','Suporte e Atendimento','Tickets, central de ajuda, suporte estruturado e atendimento ao cliente.',90),
('data_analytics','Dados e Analytics','Dados, eventos, métricas, BI, análise de produto e indicadores.',100),
('education_knowledge','Pesquisa, Educação e Conhecimento','Pesquisa, fontes científicas, bases públicas, feeds, páginas e conhecimento.',110),
('security','Segurança','Verificação, auditoria, segurança, privacidade e confiança.',120),
('custom_api','APIs e Conectores Customizados','API REST, GraphQL, webhooks, bancos e arquivos recorrentes guiados pelo agente.',130),
('ai_models','Modelos de IA','Provedores de IA liberados pela plataforma. Voz/OCR/transcrição são nativos.',140)
on conflict (code) do update set name=excluded.name, description=excluded.description, sort_order=excluded.sort_order;
insert into public.integration_catalog(code, name, description, status, minimum_plan_code, icon_type, is_native_platform_service, is_visible_to_client) values
('voice_transcription','Voz, transcrição e OCR','Serviços técnicos controlados pela intranet/plataforma.','native','enterprise','Bot',true,false),
('vector_database','Busca vetorial','Infraestrutura interna para busca semântica e recuperação de conhecimento.','native','enterprise','Database',true,false)
on conflict (code) do update set description=excluded.description,status=excluded.status,is_native_platform_service=excluded.is_native_platform_service,is_visible_to_client=excluded.is_visible_to_client;
