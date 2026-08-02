-- 022_external_api_dictionary.sql
-- Conexões customizadas, endpoints, dicionário de dados externo e mapeamento com campos/telas.

create table if not exists public.external_connections (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid,
  ambiente_id uuid,
  name text not null,
  connection_type text not null default 'custom_rest_api',
  base_url text,
  auth_type text not null default 'none',
  status text not null default 'draft',
  description text,
  guided_by_agent boolean not null default true,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.external_connection_credentials (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.external_connections(id) on delete cascade,
  credential_type text not null,
  credential_ciphertext text,
  status text not null default 'not_configured',
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.external_api_endpoints (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.external_connections(id) on delete cascade,
  name text not null,
  method text not null default 'GET',
  path text not null,
  description text,
  query_params_schema jsonb not null default '{}'::jsonb,
  headers_schema jsonb not null default '{}'::jsonb,
  body_schema jsonb not null default '{}'::jsonb,
  response_schema jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  sync_mode text not null default 'on_demand',
  cache_ttl_seconds integer not null default 300,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.external_api_fields (
  id uuid primary key default gen_random_uuid(),
  endpoint_id uuid not null references public.external_api_endpoints(id) on delete cascade,
  field_path text not null,
  field_name text not null,
  field_label text,
  data_type text not null default 'text',
  sample_value text,
  description text,
  is_identifier boolean not null default false,
  is_filterable boolean not null default true,
  is_sensitive boolean not null default false,
  can_use_in_screen boolean not null default true,
  can_use_in_alert boolean not null default true,
  can_use_in_report boolean not null default true,
  can_use_by_agent boolean not null default true,
  created_at timestamptz not null default now(),
  unique(endpoint_id, field_path)
);

create table if not exists public.custom_field_external_mapping (
  id uuid primary key default gen_random_uuid(),
  custom_field_id uuid,
  connection_id uuid not null references public.external_connections(id) on delete cascade,
  endpoint_id uuid not null references public.external_api_endpoints(id) on delete cascade,
  external_field_id uuid not null references public.external_api_fields(id) on delete cascade,
  mapping_type text not null default 'read_only',
  refresh_mode text not null default 'on_demand',
  fallback_value text,
  transformation_rule jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.external_api_cache (
  id uuid primary key default gen_random_uuid(),
  endpoint_id uuid not null references public.external_api_endpoints(id) on delete cascade,
  cache_key text not null,
  response_json jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique(endpoint_id, cache_key)
);

create table if not exists public.external_api_logs (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.external_connections(id) on delete set null,
  endpoint_id uuid references public.external_api_endpoints(id) on delete set null,
  user_id uuid,
  agent_id uuid,
  action text not null,
  request_summary jsonb not null default '{}'::jsonb,
  response_status integer,
  response_time_ms integer,
  success boolean not null default true,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.integration_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text not null,
  description text,
  plan_min text not null default 'basic',
  status text not null default 'available',
  can_feed_knowledge boolean not null default false,
  can_create_events boolean not null default false,
  can_be_channel_provider boolean not null default false,
  is_native_platform_service boolean not null default false,
  created_at timestamptz not null default now()
);

-- Campos/telas reais podem ter nomes diferentes conforme implantação.
-- Estes blocos só aplicam colunas se as tabelas existirem.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'custom_fields') then
    alter table public.custom_fields add column if not exists data_origin text not null default 'manual';
    alter table public.custom_fields add column if not exists external_mapping_id uuid references public.custom_field_external_mapping(id) on delete set null;
    alter table public.custom_fields add column if not exists can_use_in_alert boolean not null default true;
    alter table public.custom_fields add column if not exists can_use_in_report boolean not null default true;
    alter table public.custom_fields add column if not exists can_use_by_agent boolean not null default true;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'screen_fields') then
    alter table public.screen_fields add column if not exists external_field_id uuid references public.external_api_fields(id) on delete set null;
    alter table public.screen_fields add column if not exists data_origin text not null default 'manual';
  end if;
end $$;

create index if not exists idx_external_connections_cliente on public.external_connections(cliente_id, ambiente_id);
create index if not exists idx_external_api_endpoints_connection on public.external_api_endpoints(connection_id);
create index if not exists idx_external_api_fields_endpoint on public.external_api_fields(endpoint_id);
create index if not exists idx_external_api_logs_connection_created on public.external_api_logs(connection_id, created_at desc);
