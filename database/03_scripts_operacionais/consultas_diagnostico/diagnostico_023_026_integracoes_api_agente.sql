-- diagnostico_023_026_integracoes_api_agente.sql

select 'integration_categories' as tabela, count(*) as registros from public.integration_categories
union all
select 'integration_catalog', count(*) from public.integration_catalog
union all
select 'external_connections', count(*) from public.external_connections
union all
select 'external_api_endpoints', count(*) from public.external_api_endpoints
union all
select 'external_api_fields', count(*) from public.external_api_fields
union all
select 'channel_definitions', count(*) from public.channel_definitions
union all
select 'agent_flow_definitions', count(*) from public.agent_flow_definitions
union all
select 'report_templates', count(*) from public.report_templates
union all
select 'alert_delivery_channels', count(*) from public.alert_delivery_channels;

select
  c.name as categoria,
  count(i.id) as provedores_visiveis
from public.integration_categories c
left join public.integration_catalog i on i.category_id = c.id and i.is_visible_to_client = true
group by c.name, c.sort_order
order by c.sort_order;
