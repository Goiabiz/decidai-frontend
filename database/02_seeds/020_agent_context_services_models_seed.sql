-- 020_agent_context_services_models_seed.sql

insert into public.product_market_models(code, market_name, segment_name, operation_type, description, status, tags)
values
  ('atendimento-digital-base', 'Atendimento digital', 'Operação multicanal', 'Atendimento e triagem', 'Modelo base para atendimento digital com agente, canais, SLA, fila e base de conhecimento.', 'active', array['atendimento','multicanal','agente']),
  ('suporte-tecnico-base', 'Suporte técnico', 'SaaS B2B', 'Triagem e SLA', 'Modelo base para suporte técnico, classificação, prioridade e escalonamento.', 'active', array['suporte','sla','triagem']),
  ('gestao-comercial-base', 'Gestão comercial', 'Vendas B2B', 'Lead e proposta', 'Modelo base para gestão comercial, oportunidades, follow-up e fechamento.', 'draft', array['comercial','lead','proposta'])
on conflict (code) do update set
  market_name = excluded.market_name,
  segment_name = excluded.segment_name,
  operation_type = excluded.operation_type,
  description = excluded.description,
  status = excluded.status,
  tags = excluded.tags,
  updated_at = now();
