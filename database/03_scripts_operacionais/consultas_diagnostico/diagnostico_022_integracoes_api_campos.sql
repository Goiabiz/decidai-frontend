-- diagnostico_022_integracoes_api_campos.sql

select 'integration_catalog' as tabela, count(*) as registros from public.integration_catalog
union all select 'external_connections', count(*) from public.external_connections
union all select 'external_api_endpoints', count(*) from public.external_api_endpoints
union all select 'external_api_fields', count(*) from public.external_api_fields
union all select 'custom_field_external_mapping', count(*) from public.custom_field_external_mapping
union all select 'external_api_logs', count(*) from public.external_api_logs;

select category, count(*) as conectores
from public.integration_catalog
group by category
order by category;

select code, name, category, plan_min, status, is_native_platform_service
from public.integration_catalog
order by category, name;
