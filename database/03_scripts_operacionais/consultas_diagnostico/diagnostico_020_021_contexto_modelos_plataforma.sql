-- diagnostico_020_021_contexto_modelos_plataforma.sql

select 'agent_context_events' as tabela, count(*) as registros from public.agent_context_events
union all select 'service_definitions', count(*) from public.service_definitions
union all select 'service_queues', count(*) from public.service_queues
union all select 'service_sla_rules', count(*) from public.service_sla_rules
union all select 'product_market_models', count(*) from public.product_market_models
union all select 'product_model_templates', count(*) from public.product_model_templates
union all select 'platform_clients', count(*) from public.platform_clients
union all select 'platform_environments', count(*) from public.platform_environments
union all select 'platform_feature_catalog', count(*) from public.platform_feature_catalog;
