import { universoSupabase } from '../lib/supabase';

export type PlanDetails = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  maxUsers: number;
  maxAgents: number;
  maxChannels: number;
  maxIntegrations: number;
  monthlyTokenLimit: number;
  monthlyMessageLimit: number;
  storageLimitMb: number;
};

export type AccountOverview = {
  clientId: string;
  clientName: string;
  plan: PlanDetails | null;
  usuariosAtivos: number;
  agentesAtivos: number;
  canaisAtivos: number;
  tokensConsumidos: number;
  mensagensConsumidas: number;
};

function requireClient() {
  if (!universoSupabase) throw new Error('Supabase (universo-conectasus) não configurado.');
  return universoSupabase;
}

export async function listPlans(): Promise<PlanDetails[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('platform_plans')
    .select('id, code, name, description, max_users, max_agents, max_channels, max_integrations, monthly_token_limit, monthly_message_limit, storage_limit_mb')
    .eq('status', 'active')
    .order('max_users', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    maxUsers: row.max_users,
    maxAgents: row.max_agents,
    maxChannels: row.max_channels,
    maxIntegrations: row.max_integrations,
    monthlyTokenLimit: row.monthly_token_limit,
    monthlyMessageLimit: row.monthly_message_limit,
    storageLimitMb: row.storage_limit_mb,
  }));
}

export async function getAccountOverview(clientId: string): Promise<AccountOverview> {
  const supabase = requireClient();

  const { data: client, error: clientError } = await supabase
    .from('platform_clients')
    .select('id, name, trade_name, plano:platform_plans(id, code, name, description, max_users, max_agents, max_channels, max_integrations, monthly_token_limit, monthly_message_limit, storage_limit_mb)')
    .eq('id', clientId)
    .single();
  if (clientError) throw clientError;

  const planoRel = (client as { plano?: unknown }).plano;
  const planoRow = Array.isArray(planoRel) ? planoRel[0] : planoRel;
  const plan: PlanDetails | null = planoRow
    ? {
        id: (planoRow as any).id,
        code: (planoRow as any).code,
        name: (planoRow as any).name,
        description: (planoRow as any).description,
        maxUsers: (planoRow as any).max_users,
        maxAgents: (planoRow as any).max_agents,
        maxChannels: (planoRow as any).max_channels,
        maxIntegrations: (planoRow as any).max_integrations,
        monthlyTokenLimit: (planoRow as any).monthly_token_limit,
        monthlyMessageLimit: (planoRow as any).monthly_message_limit,
        storageLimitMb: (planoRow as any).storage_limit_mb,
      }
    : null;

  const [usuariosResult, agentesResult, canaisResult, usageResult] = await Promise.all([
    supabase.from('usuarios_cliente').select('id', { count: 'exact', head: true }).eq('platform_client_id', clientId).eq('status', 'ativo'),
    supabase.from('client_agents').select('id', { count: 'exact', head: true }).eq('cliente_id', clientId).is('deleted_at', null),
    supabase.from('client_channels').select('id', { count: 'exact', head: true }).eq('cliente_id', clientId).is('deleted_at', null),
    supabase
      .from('platform_usage_summary')
      .select('tokens_used, messages_used, environment:platform_environments!inner(platform_client_id)')
      .eq('environment.platform_client_id', clientId)
      .order('period_month', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    clientId: client.id,
    clientName: client.trade_name || client.name,
    plan,
    usuariosAtivos: usuariosResult.count ?? 0,
    agentesAtivos: agentesResult.count ?? 0,
    canaisAtivos: canaisResult.count ?? 0,
    tokensConsumidos: (usageResult.data as { tokens_used?: number } | null)?.tokens_used ?? 0,
    mensagensConsumidas: (usageResult.data as { messages_used?: number } | null)?.messages_used ?? 0,
  };
}
