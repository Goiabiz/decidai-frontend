-- 019_agent_channels_plans_base_seed.sql

insert into public.platform_plans
  (code, name, description, max_users, max_agents, max_channels, max_integrations, monthly_token_limit, monthly_message_limit, storage_limit_mb)
values
  ('basic', 'Básico', 'Plano inicial sem integrações externas.', 5, 1, 0, 0, 50000, 1000, 512),
  ('student', 'Student', 'Plano de entrada com até 3 canais.', 15, 2, 3, 1, 150000, 5000, 2048),
  ('pro', 'Pro', 'Plano operacional com até 8 canais e integrações principais.', 50, 5, 8, 5, 500000, 25000, 10240),
  ('enterprise', 'Enterprise', 'Plano completo com canais e limites contratados.', 0, 0, 0, 0, 0, 0, 0)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  max_users = excluded.max_users,
  max_agents = excluded.max_agents,
  max_channels = excluded.max_channels,
  max_integrations = excluded.max_integrations,
  monthly_token_limit = excluded.monthly_token_limit,
  monthly_message_limit = excluded.monthly_message_limit,
  storage_limit_mb = excluded.storage_limit_mb,
  updated_at = now();

insert into public.platform_channels
  (code, name, channel_type, description, global_status, requires_integration, supports_audio, supports_attachment, supports_template, min_plan_code)
values
  ('widget_web', 'Widget Web', 'Web', 'Canal contextual embarcado em sistema, portal ou site.', 'available', false, false, true, true, 'basic'),
  ('whatsapp', 'WhatsApp', 'Mensageria', 'Canal externo para atendimento e confirmações.', 'available', true, true, true, true, 'student'),
  ('sms', 'SMS', 'Mensageria', 'Canal de mensagem curta.', 'available', true, false, false, true, 'student'),
  ('email', 'E-mail', 'E-mail', 'Canal assíncrono para atendimento e registro.', 'available', true, false, true, true, 'student'),
  ('telegram', 'Telegram', 'Mensageria', 'Canal de mensageria instantânea.', 'available', true, true, true, false, 'pro'),
  ('teams', 'Microsoft Teams', 'Mensageria', 'Canal corporativo para times internos.', 'available', true, false, true, false, 'pro'),
  ('discord', 'Discord', 'Mensageria', 'Canal para comunidades, times técnicos e operação interna.', 'available', true, false, true, false, 'pro'),
  ('instagram_direct', 'Instagram Direct', 'Mensageria', 'Canal social para atendimento digital.', 'planned', true, true, true, true, 'pro'),
  ('facebook_messenger', 'Facebook Messenger', 'Mensageria', 'Canal social para atendimento digital.', 'planned', true, true, true, true, 'pro'),
  ('chat_interno', 'Chat interno', 'Interno', 'Canal interno do produto.', 'available', false, false, true, false, 'basic'),
  ('voice_phone', 'Voz/Telefone', 'Voz', 'Canal futuro para voz, transcrição e atendimento telefônico.', 'planned', true, true, false, false, 'enterprise')
on conflict (code) do update set
  name = excluded.name,
  channel_type = excluded.channel_type,
  description = excluded.description,
  global_status = excluded.global_status,
  requires_integration = excluded.requires_integration,
  supports_audio = excluded.supports_audio,
  supports_attachment = excluded.supports_attachment,
  supports_template = excluded.supports_template,
  min_plan_code = excluded.min_plan_code;

insert into public.platform_entitlements(plan_id, resource_type, resource_code, is_allowed, limit_value)
select p.id, 'channel', c.code,
  case
    when p.code = 'basic' and c.code in ('widget_web', 'chat_interno') then true
    when p.code = 'student' and c.code in ('widget_web', 'chat_interno', 'whatsapp', 'sms', 'email') then true
    when p.code = 'pro' and c.code in ('widget_web', 'chat_interno', 'whatsapp', 'sms', 'email', 'telegram', 'teams', 'discord') then true
    when p.code = 'enterprise' then true
    else false
  end,
  null
from public.platform_plans p
cross join public.platform_channels c
on conflict (plan_id, resource_type, resource_code) do update set
  is_allowed = excluded.is_allowed,
  limit_value = excluded.limit_value;
