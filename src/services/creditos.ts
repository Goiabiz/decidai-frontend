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
