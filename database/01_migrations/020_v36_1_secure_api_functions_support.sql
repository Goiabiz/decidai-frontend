-- v36.1 - Suporte para funções seguras de API guiada

create index if not exists idx_v36_api_guided_connections_status
  on public.api_guided_connections(status, last_test_at desc);

create index if not exists idx_v36_api_guided_endpoints_connection_status
  on public.api_guided_endpoints(connection_id, status, last_test_at desc);

create index if not exists idx_v36_api_guided_call_logs_connection_created
  on public.api_guided_call_logs(connection_id, created_at desc);

create index if not exists idx_v36_api_guided_response_fields_endpoint_key
  on public.api_guided_response_fields(endpoint_id, field_key);

create or replace view public.vw_v36_api_guided_connection_health as
select
  c.id as connection_id,
  c.cliente_id,
  c.ambiente_id,
  c.name as connection_name,
  c.connection_kind,
  c.base_url,
  c.auth_type,
  c.status as connection_status,
  c.last_test_status,
  c.last_test_at,
  c.last_error_message,
  count(distinct e.id) as endpoints_total,
  count(distinct e.id) filter (where e.status = 'active') as endpoints_active,
  count(distinct f.id) as fields_discovered,
  max(l.created_at) as last_call_at
from public.api_guided_connections c
left join public.api_guided_endpoints e on e.connection_id = c.id
left join public.api_guided_response_fields f on f.endpoint_id = e.id
left join public.api_guided_call_logs l on l.connection_id = c.id
group by c.id;
