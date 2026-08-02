-- 023_026_consolidacao_integracoes_api_agente.sql
-- Consolidação v29.4-v34: integrações, API guiada, campos externos, canais, fluxos, relatórios e alertas.

create table if not exists public.integration_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.integration_catalog (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.integration_categories(id) on delete set null,
  code text not null unique,
  name text not null,
  description text,
  status text not null default 'available',
  minimum_plan_code text,
  icon_type text,
  is_native_platform_service boolean not null default false,
  is_visible_to_client boolean not null default true,
  config_schema jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.external_connections (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid,
  ambiente_id uuid,
  provider_code text not null,
  name text not null,
  connection_type text not null default 'custom_api',
  base_url text,
  auth_type text,
  status text not null default 'draft',
  description text,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.external_connection_credentials (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.external_connections(id) on delete cascade,
  credential_type text not null,
  credential_ciphertext text,
  expires_at timestamptz,
  last_used_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now()
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
  cache_ttl_seconds integer not null default 0,
  created_at timestamptz not null default now()
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
  is_filterable boolean not null default false,
  is_sensitive boolean not null default false,
  can_use_in_screen boolean not null default true,
  can_use_in_alert boolean not null default false,
  can_use_in_report boolean not null default true,
  can_use_by_agent boolean not null default true,
  created_at timestamptz not null default now(),
  unique(endpoint_id, field_path)
);

create table if not exists public.custom_field_external_mapping (
  id uuid primary key default gen_random_uuid(),
  custom_field_id uuid,
  connection_id uuid references public.external_connections(id) on delete set null,
  endpoint_id uuid references public.external_api_endpoints(id) on delete set null,
  external_field_id uuid references public.external_api_fields(id) on delete set null,
  mapping_type text not null default 'read',
  refresh_mode text not null default 'on_demand',
  fallback_value text,
  transformation_rule jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
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

create table if not exists public.channel_definitions (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid,
  ambiente_id uuid,
  name text not null,
  channel_type text not null,
  integration_provider_code text,
  default_agent_id uuid,
  default_flow_code text,
  queue_name text,
  sla_rule text,
  human_handoff_rule text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_flow_definitions (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid,
  ambiente_id uuid,
  code text not null,
  name text not null,
  description text,
  usage_area text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique(cliente_id, ambiente_id, code)
);

create table if not exists public.agent_flow_steps (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references public.agent_flow_definitions(id) on delete cascade,
  step_order integer not null default 1,
  step_type text not null,
  instruction text not null,
  requires_human_approval boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.report_templates (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid,
  ambiente_id uuid,
  name text not null,
  description text,
  export_xls boolean not null default true,
  export_pdf boolean not null default true,
  pdf_orientation text not null default 'landscape',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.alert_delivery_channels (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid,
  channel_definition_id uuid references public.channel_definitions(id) on delete set null,
  integration_provider_code text,
  delivery_status text not null default 'pending',
  message_template text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_external_connections_cliente on public.external_connections(cliente_id, ambiente_id);
create index if not exists idx_external_api_fields_endpoint on public.external_api_fields(endpoint_id);
create index if not exists idx_external_api_logs_created on public.external_api_logs(created_at desc);
create index if not exists idx_channel_definitions_cliente on public.channel_definitions(cliente_id, ambiente_id);
create index if not exists idx_agent_flow_definitions_cliente on public.agent_flow_definitions(cliente_id, ambiente_id);
