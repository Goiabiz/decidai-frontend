import { universoSupabase } from '../lib/supabase';

export type CreditsLedgerTipo = 'debito_uso' | 'credito_recarga' | 'credito_plano' | 'ajuste';

export type CreditsLedgerEntry = {
  id: string;
  data: string;
  tipo: CreditsLedgerTipo;
  valor: number;
  saldoApos: number;
  descricao: string;
};

/**
 * Saldo por tenant -- platform_client_credits_balance (migration 043), tabela própria (não
 * coluna em platform_clients, que tem leitura aberta a qualquer tenant). Sem linha ainda =
 * saldo 0 (tenant nunca gerou débito/crédito), não erro.
 */
export async function getCreditsBalance(clienteId: string): Promise<{ balance: number; source: 'supabase' | 'local' }> {
  const client = universoSupabase;
  if (!client) return { balance: 0, source: 'local' };

  const { data, error } = await client
    .from('platform_client_credits_balance')
    .select('credits_balance')
    .eq('cliente_id', clienteId)
    .maybeSingle();

  if (error) return { balance: 0, source: 'local' };

  return { balance: data ? Number(data.credits_balance) : 0, source: 'supabase' };
}

export async function listCreditsLedger(clienteId: string, limit = 200): Promise<{ items: CreditsLedgerEntry[]; source: 'supabase' | 'local' }> {
  const client = universoSupabase;
  if (!client) return { items: [], source: 'local' };

  const { data, error } = await client
    .from('credits_ledger')
    .select('id, criado_em, tipo, valor, saldo_apos, descricao')
    .eq('cliente_id', clienteId)
    .order('criado_em', { ascending: false })
    .limit(limit);

  if (error || !data) return { items: [], source: 'local' };

  return {
    items: data.map((row) => ({
      id: row.id,
      data: row.criado_em,
      tipo: row.tipo as CreditsLedgerTipo,
      valor: Number(row.valor),
      saldoApos: Number(row.saldo_apos),
      descricao: row.descricao || '-',
    })),
    source: 'supabase',
  };
}

// ---------------------------------------------------------------------------
// Limite RÍGIDO de crédito de IA (frente E, 30/08/2026) -- migrations
// 20260830122228 (gate) e 20260830122807 (recarga).
//
// Até essas migrations existirem, o saldo podia ficar negativo sem limite: o único mecanismo
// era um trigger que contabilizava DEPOIS do uso. Agora a IA é bloqueada antes de executar
// quando o saldo acaba, e a recarga é o caminho de volta.

export type CreditGate = {
  permitido: boolean;
  motivo: string | null;
  saldo: number | null;
  /** Plano isento do limite (Enterprise) -- contrato negociado, faturado à parte. */
  isento: boolean;
  planoCode: string | null;
};

/**
 * Mesma função que o runtime do agente consulta antes de executar IA -- de propósito.
 * Se a tela calculasse por conta própria, ela e o motor poderiam discordar, e o usuário veria
 * "saldo ok" numa tela cuja IA não responde.
 */
export async function getCreditGate(clienteId: string): Promise<CreditGate | null> {
  const client = universoSupabase;
  if (!client) return null;
  const { data, error } = await client.rpc('fn_tenant_credit_gate', { p_cliente_id: clienteId });
  if (error) return null;
  const row = (data as Array<Record<string, unknown>> | null)?.[0];
  if (!row) return null;
  return {
    permitido: row.permitido === true,
    motivo: typeof row.motivo === 'string' ? row.motivo : null,
    saldo: row.saldo === null || row.saldo === undefined ? null : Number(row.saldo),
    isento: row.isento === true,
    planoCode: typeof row.plano_code === 'string' ? row.plano_code : null,
  };
}

export type CreditTopup = {
  id: string;
  valorUsd: number;
  valorBrl: number | null;
  status: 'pendente' | 'pago' | 'cancelado';
  gateway: string | null;
  criadoEm: string;
  pagoEm: string | null;
};

export async function listCreditTopups(clienteId: string, limit = 20): Promise<CreditTopup[]> {
  const client = universoSupabase;
  if (!client) return [];
  const { data, error } = await client
    .from('credit_topups')
    .select('id, valor_usd, valor_brl, status, gateway, criado_em, pago_em')
    .eq('cliente_id', clienteId)
    .order('criado_em', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    valorUsd: Number(row.valor_usd),
    valorBrl: row.valor_brl === null ? null : Number(row.valor_brl),
    status: row.status as CreditTopup['status'],
    gateway: row.gateway,
    criadoEm: row.criado_em,
    pagoEm: row.pago_em,
  }));
}

/**
 * Cria o pedido de recarga. NÃO credita nada -- quem credita é o servidor, depois que o gateway
 * confirmar o pagamento de verdade (fn_confirm_credit_topup, service_role).
 */
export async function requestCreditTopup(clienteId: string, valorUsd: number): Promise<{ ok: boolean; error?: string }> {
  const client = universoSupabase;
  if (!client) return { ok: false, error: 'Supabase não configurado.' };
  const { error } = await client.rpc('fn_request_credit_topup', { p_cliente_id: clienteId, p_valor_usd: valorUsd });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
