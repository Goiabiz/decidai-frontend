-- 020_agent_context_services_models.sql
-- Estrutura preparatória para contexto do agente, serviços/filas/SLA e modelos de mercado.

create table if not exists public.agent_context_events (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid,
  ambiente_id uuid,
  user_id uuid,
  agent_id uuid,
  page_key text not null,
  module_code text,
  functionality_code text,
  selected_record_id text,
  context_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.service_definitions (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid,
  ambiente_id uuid,
  code text not null,
  name text not null,
  description text,
  status text not null default 'active',
  default_channel_code text,
  default_agent_id uuid,
  form_key text,
  requires_identity_validation boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cliente_id, ambiente_id, code)
);

create table if not exists public.service_queues (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.service_definitions(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  status text not null default 'active',
  default_responsible_id uuid,
  created_at timestamptz not null default now(),
  unique(service_id, code)
);

create table if not exists public.service_sla_rules (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.service_definitions(id) on delete cascade,
  queue_id uuid references public.service_queues(id) on delete cascade,
  priority text not null default 'media',
  first_response_minutes integer not null default 0,
  resolution_minutes integer not null default 0,
  business_hours_only boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.product_market_models (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  market_name text not null,
  segment_name text,
  operation_type text,
  description text,
  status text not null default 'draft',
  version text not null default '1.0',
  tags text[] not null default array[]::text[],
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_model_templates (
  id uuid primary key default gen_random_uuid(),
  market_model_id uuid not null references public.product_market_models(id) on delete cascade,
  template_type text not null,
  title text not null,
  description text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_context_events_created on public.agent_context_events(created_at desc);
create index if not exists idx_service_definitions_cliente on public.service_definitions(cliente_id, ambiente_id);
create index if not exists idx_product_market_models_market on public.product_market_models(market_name, segment_name);
