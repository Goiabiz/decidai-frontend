-- 021_platform_intranet_control_base.sql
-- Base preparatória para futura intranet/plataforma controlar ambientes de produção.

create table if not exists public.platform_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trade_name text,
  document_number text,
  status text not null default 'active',
  market_segment text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_environments (
  id uuid primary key default gen_random_uuid(),
  platform_client_id uuid not null references public.platform_clients(id) on delete cascade,
  code text not null,
  name text not null,
  environment_type text not null default 'production',
  status text not null default 'active',
  supabase_project_ref text,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(platform_client_id, code)
);

create table if not exists public.platform_feature_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  module_code text not null,
  name text not null,
  description text,
  status text not null default 'active',
  feature_type text not null default 'functionality',
  created_at timestamptz not null default now()
);

create table if not exists public.platform_environment_entitlements (
  id uuid primary key default gen_random_uuid(),
  environment_id uuid not null references public.platform_environments(id) on delete cascade,
  feature_code text not null,
  is_enabled boolean not null default true,
  limit_value integer,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(environment_id, feature_code)
);

create table if not exists public.platform_usage_summary (
  id uuid primary key default gen_random_uuid(),
  environment_id uuid not null references public.platform_environments(id) on delete cascade,
  period_month date not null,
  users_count integer not null default 0,
  agents_count integer not null default 0,
  channels_count integer not null default 0,
  integrations_count integer not null default 0,
  tokens_used integer not null default 0,
  messages_used integer not null default 0,
  storage_used_mb integer not null default 0,
  created_at timestamptz not null default now(),
  unique(environment_id, period_month)
);
