import { universoSupabase } from '../lib/supabase';

// DecidAI Market v1 -- Reputation Intelligence (Plano Mestre v4 §6.5). Leitura/config de
// fontes é direto contra o Supabase (RLS normal, mesmo padrão de services/crm.ts) -- só a
// sincronização real com o Google Business Profile passa pela Edge Function market-admin
// (precisa do runtime do agente, onde mora a credencial OAuth).

export type MarketSource = {
  id: string;
  source: 'google_business_profile';
  externalRef: string;
  label: string;
  ativo: boolean;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
};

export type MarketSourceInput = { externalRef: string; label: string };

export type MarketSignal = {
  id: string;
  sourceId: string;
  authorName: string | null;
  rating: number | null;
  comment: string | null;
  replyComment: string | null;
  occurredAt: string;
};

function requireClient() {
  if (!universoSupabase) throw new Error('Supabase não configurado neste ambiente.');
  return universoSupabase;
}

const SOURCE_SELECT = 'id, source, external_ref, label, ativo, last_synced_at, last_sync_error';

function mapSource(row: Record<string, unknown>): MarketSource {
  return {
    id: row.id as string,
    source: row.source as MarketSource['source'],
    externalRef: row.external_ref as string,
    label: row.label as string,
    ativo: row.ativo as boolean,
    lastSyncedAt: (row.last_synced_at as string) || null,
    lastSyncError: (row.last_sync_error as string) || null,
  };
}

export async function listReputationSources(clienteId: string): Promise<MarketSource[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('market_reputation_sources')
    .select(SOURCE_SELECT)
    .eq('cliente_id', clienteId)
    .order('criado_em');
  if (error) throw error;
  return (data ?? []).map(mapSource);
}

export async function createReputationSource(clienteId: string, input: MarketSourceInput): Promise<MarketSource> {
  const client = requireClient();
  const { data, error } = await client
    .from('market_reputation_sources')
    .insert({
      cliente_id: clienteId,
      source: 'google_business_profile',
      external_ref: input.externalRef,
      label: input.label,
    })
    .select(SOURCE_SELECT)
    .single();
  if (error) throw error;
  return mapSource(data);
}

export async function setReputationSourceAtivo(id: string, ativo: boolean): Promise<void> {
  const client = requireClient();
  const { error } = await client
    .from('market_reputation_sources')
    .update({ ativo, atualizado_em: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

const SIGNAL_SELECT = 'id, source_id, author_name, rating, comment, reply_comment, occurred_at';

function mapSignal(row: Record<string, unknown>): MarketSignal {
  return {
    id: row.id as string,
    sourceId: row.source_id as string,
    authorName: (row.author_name as string) || null,
    rating: (row.rating as number) ?? null,
    comment: (row.comment as string) || null,
    replyComment: (row.reply_comment as string) || null,
    occurredAt: row.occurred_at as string,
  };
}

export async function listReputationSignals(clienteId: string, limit = 50): Promise<MarketSignal[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('market_reputation_signals')
    .select(SIGNAL_SELECT)
    .eq('cliente_id', clienteId)
    .order('occurred_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapSignal);
}

export type ReputationStats = { averageRating: number | null; totalSignals: number; last30Days: number };

export function computeReputationStats(signals: MarketSignal[]): ReputationStats {
  const rated = signals.filter((s) => s.rating !== null);
  const averageRating = rated.length > 0 ? rated.reduce((sum, s) => sum + (s.rating ?? 0), 0) / rated.length : null;
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const last30Days = signals.filter((s) => new Date(s.occurredAt).getTime() >= cutoff).length;
  return { averageRating, totalSignals: signals.length, last30Days };
}

type MarketAdminOk<T> = { ok: true } & T;
type MarketAdminErr = { ok: false; error: string };
type MarketAdminResult<T> = MarketAdminOk<T> | MarketAdminErr;

async function extractFunctionErrorMessage(error: { message: string; context?: unknown }): Promise<string> {
  const context = error.context;
  if (context && typeof (context as Response).clone === 'function') {
    try {
      const body = await (context as Response).clone().json();
      if (body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string') {
        return (body as { error: string }).error;
      }
    } catch {
      // corpo não é JSON válido -- cai no fallback abaixo
    }
  }
  return error.message;
}

export async function syncGbpReviewsNow(clienteId?: string | null): Promise<
  { sourcesSynced: number; signalsUpserted: number; errors: string[] } | { error: string }
> {
  const client = requireClient();
  try {
    const { data, error } = await client.functions.invoke('market-admin', {
      body: { action: 'syncGbp', clienteId: clienteId || null },
    });
    if (error) return { error: await extractFunctionErrorMessage(error) };
    const payload = data as MarketAdminResult<{ sourcesSynced: number; signalsUpserted: number; errors: string[] }>;
    if (!payload || payload.ok !== true) return { error: (payload as MarketAdminErr)?.error || 'Resposta vazia.' };
    return { sourcesSynced: payload.sourcesSynced, signalsUpserted: payload.signalsUpserted, errors: payload.errors };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Falha ao chamar market-admin.' };
  }
}
