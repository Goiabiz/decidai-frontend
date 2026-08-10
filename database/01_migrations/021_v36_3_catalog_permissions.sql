-- v36.3 - leitura segura do catálogo de integrações

grant usage on schema public to anon, authenticated;

grant select on public.integration_categories to anon, authenticated;
grant select on public.integration_providers to anon, authenticated;
grant select on public.integration_provider_actions to anon, authenticated;
grant select on public.vw_v35_integration_catalog_client to anon, authenticated;
grant select on public.vw_v35_api_guided_dictionary to anon, authenticated;
grant select on public.vw_v35_api_guided_field_bindings to anon, authenticated;
grant select on public.vw_v35_resource_usage_snapshot to anon, authenticated;
grant select on public.vw_v36_api_guided_connection_health to anon, authenticated;

do $$
begin
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='integration_categories' and policyname='integration_categories_read_catalog'
  ) then
    drop policy integration_categories_read_catalog on public.integration_categories;
  end if;

  create policy integration_categories_read_catalog
  on public.integration_categories
  for select
  to anon, authenticated
  using (status in ('active','ativo'));

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='integration_providers' and policyname='integration_providers_read_catalog'
  ) then
    create policy integration_providers_read_catalog
    on public.integration_providers
    for select
    to anon, authenticated
    using (deleted_at is null and is_visible_to_client = true and status = 'ativo');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='integration_provider_actions' and policyname='integration_provider_actions_read_catalog'
  ) then
    create policy integration_provider_actions_read_catalog
    on public.integration_provider_actions
    for select
    to anon, authenticated
    using (is_active = true);
  end if;
end $$;
