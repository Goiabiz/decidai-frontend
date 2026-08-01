-- 019_agent_channels_plans_base.sql
-- Base inicial para agentes, canais, planos, limites e consumo.
-- Aplicar no banco da aplicação cliente/preparado para futura intranet de plataforma.

create table if not exists public.platform_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  status text not null default 'active',
  max_users integer not null default 0,
  max_agents integer not null default 0,
  max_channels integer not null default 0,
  max_integrations integer not null default 0,
  monthly_token_limit integer not null default 0,
  monthly_message_limit integer not null default 0,
  storage_limit_mb integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_entitlements (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.platform_plans(id) on delete cascade,
  resource_type text not null,
  resource_code text not null,
  is_allowed boolean not null default true,
  limit_value integer,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(plan_id, resource_type, resource_code)
);

create table if not exists public.platform_channels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  channel_type text not null,
  description text,
  global_status text not null default 'available',
  requires_integration boolean not null default true,
  supports_audio boolean not null default false,
  supports_attachment boolean not null default true,
  supports_template boolean not null default false,
  min_plan_code text,
  config_schema jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.client_agents (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid,
  ambiente_id uuid,
  name text not null,
  description text,
  avatar_url text,
  color text,
  greeting text,
  voice_tone text,
  signature text,
  agent_model text not null default 'Atendimento',
  autonomy_level text not null default 'Responde e orienta',
  status text not null default 'configuring',
  service_hours text,
  requires_human_approval boolean not null default true,
  execution_limit integer not null default 0,
  token_limit integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.client_channels (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid,
  ambiente_id uuid,
  channel_id uuid not null references public.platform_channels(id),
  display_name text,
  status text not null default 'available',
  default_agent_id uuid references public.client_agents(id) on delete set null,
  webhook_url text,
  callback_url text,
  monthly_message_limit integer not null default 0,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.agent_channel_bindings (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.client_agents(id) on delete cascade,
  client_channel_id uuid not null references public.client_channels(id) on delete cascade,
  priority integer not null default 1,
  is_active boolean not null default true,
  specific_hours text,
  transfer_rule text,
  created_at timestamptz not null default now(),
  unique(agent_id, client_channel_id)
);

create table if not exists public.agent_permissions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.client_agents(id) on delete cascade,
  module_code text not null,
  functionality_code text,
  action_code text not null,
  is_allowed boolean not null default true,
  requires_approval boolean not null default true,
  risk_level text not null default 'medium',
  created_at timestamptz not null default now(),
  unique(agent_id, module_code, functionality_code, action_code)
);

create table if not exists public.agent_knowledge_scopes (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.client_agents(id) on delete cascade,
  knowledge_base_code text not null,
  scope text not null default 'read',
  can_read boolean not null default true,
  can_suggest boolean not null default true,
  can_create_knowledge boolean not null default false,
  created_at timestamptz not null default now(),
  unique(agent_id, knowledge_base_code, scope)
);

create table if not exists public.integration_credentials (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid,
  ambiente_id uuid,
  provider_code text not null,
  credential_type text not null,
  credential_ciphertext text,
  status text not null default 'not_configured',
  expires_at timestamptz,
  last_used_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_usage_events (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid,
  ambiente_id uuid,
  agent_id uuid references public.client_agents(id) on delete set null,
  client_channel_id uuid references public.client_channels(id) on delete set null,
  user_id uuid,
  atendimento_id uuid,
  event_type text not null,
  action_code text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost numeric(12, 6) not null default 0,
  status text not null default 'success',
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_client_agents_cliente_ambiente on public.client_agents(cliente_id, ambiente_id);
create index if not exists idx_client_channels_cliente_ambiente on public.client_channels(cliente_id, ambiente_id);
create index if not exists idx_agent_usage_events_agent_created on public.agent_usage_events(agent_id, created_at desc);
create index if not exists idx_agent_usage_events_cliente_created on public.agent_usage_events(cliente_id, created_at desc);
