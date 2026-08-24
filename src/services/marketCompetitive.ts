import { universoSupabase } from '../lib/supabase';

// DecidAI Market -- Competitive Intelligence (Plano Mestre v4 §6.5, v1). Único pilar sem
// conector -- monitora URL pública de concorrente via Browser Service + resume mudanças por
// IA no runtime do agente. Mesmo padrão de services/market.ts (Reputation)/marketSocial.ts
// (Social)/marketCampaign.ts (Campaign), mas sem union de "source" (só 1 mecanismo aqui).

export type CompetitiveSource = {
  id: string;
  url: string;
  label: string;
  ativo: boolean;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
};

export type CompetitiveSourceInput = { url: string; label: string };

function requireClient() {
  if (!universoSupabase) throw new Error('Supabase não configurado neste ambiente.');
  return universoSupabase;
}

const SOURCE_SELECT = 'id, url, label, ativo, last_synced_at, last_sync_error';

function mapSource(row: Record<string, unknown>): CompetitiveSource {
  return {
    id: row.id as string,
    url: row.url as string,
    label: row.label as string,
    ativo: row.ativo as boolean,
    lastSyncedAt: (row.last_synced_at as string) || null,
    lastSyncError: (row.last_sync_error as string) || null,
  };
}

export async function listCompetitiveSources(clienteId: string): Promise<CompetitiveSource[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('market_competitive_sources')
    .select(SOURCE_SELECT)
    .eq('cliente_id', clienteId)
    .order('criado_em');
  if (error) throw error;
  return (data ?? []).map(mapSource);
}

export async function createCompetitiveSource(clienteId: string, input: CompetitiveSourceInput): Promise<CompetitiveSource> {
  const client = requireClient();
  const { data, error } = await client
    .from('market_competitive_sources')
    .insert({ cliente_id: clienteId, url: input.url, label: input.label })
    .select(SOURCE_SELECT)
    .single();
  if (error) throw error;
  return mapSource(data);
}

export async function setCompetitiveSourceAtivo(id: string, ativo: boolean): Promise<void> {
  const client = requireClient();
  const { error } = await client
    .from('market_competitive_sources')
    .update({ ativo, atualizado_em: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export type CompetitiveSignal = {
  id: string;
  sourceId: string;
  signalType: 'snapshot';
  pageTitle: string | null;
  rawText: string | null;
  summary: string | null;
  occurredAt: string;
};

const SIGNAL_SELECT = 'id, source_id, signal_type, page_title, raw_text, summary, occurred_at';

function mapSignal(row: Record<string, unknown>): CompetitiveSignal {
  return {
    id: row.id as string,
    sourceId: row.source_id as string,
    signalType: row.signal_type as CompetitiveSignal['signalType'],
    pageTitle: (row.page_title as string) || null,
    rawText: (row.raw_text as string) || null,
    summary: (row.summary as string) || null,
    occurredAt: row.occurred_at as string,
  };
}

export async function listCompetitiveSignals(clienteId: string, limit = 50): Promise<CompetitiveSignal[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('market_competitive_signals')
    .select(SIGNAL_SELECT)
    .eq('cliente_id', clienteId)
    .order('occurred_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapSignal);
}

type MarketAdminOk<T> = { ok: true } & T;
type MarketAdminErr = { ok: false; error: string };
type MarketAdminResult<T> = MarketAdminOk<T> | MarketAdminErr;

async function extractFunctionErrorMessage(error: { message: string; context?: unknown }): Promise<string> {
  const context = error.context;
  if (context && typeof (context as Response).clone === 'function') {
    try {
      const bodyJson = await (context as Response).clone().json();
      if (bodyJson && typeof bodyJson === 'object' && typeof (bodyJson as { error?: unknown }).error === 'string') {
        return (bodyJson as { error: string }).error;
      }
    } catch {
      // corpo não é JSON válido -- cai no fallback abaixo
    }
  }
  return error.message;
}

export async function syncCompetitiveSourcesNow(clienteId: string | null | undefined): Promise<
  { sourcesSynced: number; signalsUpserted: number; errors: string[] } | { error: string }
> {
  const client = requireClient();
  try {
    const { data, error } = await client.functions.invoke('market-admin', {
      body: { action: 'syncCompetitiveSources', clienteId: clienteId || null },
    });
    if (error) return { error: await extractFunctionErrorMessage(error) };
    const payload = data as MarketAdminResult<{ sourcesSynced: number; signalsUpserted: number; errors: string[] }>;
    if (!payload || payload.ok !== true) return { error: (payload as MarketAdminErr)?.error || 'Resposta vazia.' };
    return { sourcesSynced: payload.sourcesSynced, signalsUpserted: payload.signalsUpserted, errors: payload.errors };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Falha ao chamar market-admin.' };
  }
}
