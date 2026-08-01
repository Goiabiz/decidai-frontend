-- diagnostico_019_agentes_canais_planos.sql

select 'platform_plans' as tabela, count(*) as registros from public.platform_plans
union all
select 'platform_channels', count(*) from public.platform_channels
union all
select 'platform_entitlements', count(*) from public.platform_entitlements
union all
select 'client_agents', count(*) from public.client_agents
union all
select 'client_channels', count(*) from public.client_channels
union all
select 'agent_usage_events', count(*) from public.agent_usage_events;

select
  p.name as plano,
  c.name as canal,
  e.is_allowed as permitido
from public.platform_entitlements e
join public.platform_plans p on p.id = e.plan_id
join public.platform_channels c on c.code = e.resource_code
where e.resource_type = 'channel'
order by p.name, c.name;
