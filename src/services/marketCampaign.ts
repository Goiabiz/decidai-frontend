import { universoSupabase } from '../lib/supabase';

// DecidAI Market -- Campaign Intelligence (Plano Mestre v4 §6.5, v1). Mesmo padrão de
// services/market.ts (Reputation) e services/marketSocial.ts (Social) -- arquivo separado
// porque o tipo de sinal (campanha de anúncio, com métricas de impressão/clique/gasto) é
// diferente o suficiente pra não valer forçar no mesmo union dos outros 2 pilares.

export type MarketCampaignSource = 'meta_ads' | 'google_ads' | 'linkedin_ads';

export const MARKET_CAMPAIGN_SOURCE_LABELS: Record<MarketCampaignSource, string> = {
  meta_ads: 'Meta Ads',
  google_ads: 'Google Ads',
  linkedin_ads: 'LinkedIn Ads',
};

export const MARKET_CAMPAIGN_SOURCE_REF_LABEL: Record<MarketCampaignSource, string> = {
  meta_ads: 'ID da conta de anúncio (rótulo apenas -- a credencial já resolve a conta)',
  google_ads: 'Customer ID da conta Google Ads (obrigatório, formato 1234567890)',
  linkedin_ads: 'ID da conta de anúncio (rótulo apenas -- a credencial já resolve a conta)',
};

// Só Google Ads exige um identificador funcional de verdade (customerId, parâmetro obrigatório
// da API) -- Meta/LinkedIn já resolvem a conta pela própria credencial (Vault), mesmo padrão de
// MARKET_REPUTATION_SOURCE_NEEDS_REAL_REF/Trustpilot.
export const MARKET_CAMPAIGN_SOURCE_NEEDS_REAL_REF: Record<MarketCampaignSource, boolean> = {
  meta_ads: false,
  google_ads: true,
  linkedin_ads: false,
};

export type CampaignSource = {
  id: string;
  source: MarketCampaignSource;
  externalRef: string;
  label: string;
  ativo: boolean;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
};

export type CampaignSourceInput = { source: MarketCampaignSource; externalRef: string; label: string };

function requireClient() {
  if (!universoSupabase) throw new Error('Supabase não configurado neste ambiente.');
  return universoSupabase;
}

const SOURCE_SELECT = 'id, source, external_ref, label, ativo, last_synced_at, last_sync_error';

function mapSource(row: Record<string, unknown>): CampaignSource {
  return {
    id: row.id as string,
    source: row.source as MarketCampaignSource,
    externalRef: row.external_ref as string,
    label: row.label as string,
    ativo: row.ativo as boolean,
    lastSyncedAt: (row.last_synced_at as string) || null,
    lastSyncError: (row.last_sync_error as string) || null,
  };
}

export async function listCampaignSources(clienteId: string): Promise<CampaignSource[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('market_campaign_sources')
    .select(SOURCE_SELECT)
    .eq('cliente_id', clienteId)
    .order('criado_em');
  if (error) throw error;
  return (data ?? []).map(mapSource);
}

export async function createCampaignSource(clienteId: string, input: CampaignSourceInput): Promise<CampaignSource> {
  const client = requireClient();
  const { data, error } = await client
    .from('market_campaign_sources')
    .insert({ cliente_id: clienteId, source: input.source, external_ref: input.externalRef, label: input.label })
    .select(SOURCE_SELECT)
    .single();
  if (error) throw error;
  return mapSource(data);
}

export async function setCampaignSourceAtivo(id: string, ativo: boolean): Promise<void> {
  const client = requireClient();
  const { error } = await client
    .from('market_campaign_sources')
    .update({ ativo, atualizado_em: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export type CampaignSignal = {
  id: string;
  sourceId: string;
  source: MarketCampaignSource;
  signalType: 'campaign';
  campaignName: string | null;
  campaignStatus: string | null;
  occurredAt: string;
  metrics: Record<string, number>;
};

const SIGNAL_SELECT = 'id, source_id, source, signal_type, campaign_name, campaign_status, occurred_at, metrics';

function mapSignal(row: Record<string, unknown>): CampaignSignal {
  return {
    id: row.id as string,
    sourceId: row.source_id as string,
    source: row.source as MarketCampaignSource,
    signalType: row.signal_type as CampaignSignal['signalType'],
    campaignName: (row.campaign_name as string) || null,
    campaignStatus: (row.campaign_status as string) || null,
    occurredAt: row.occurred_at as string,
    metrics: (row.metrics as Record<string, number>) ?? {},
  };
}

export async function listCampaignSignals(clienteId: string, limit = 50): Promise<CampaignSignal[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('market_campaign_signals')
    .select(SIGNAL_SELECT)
    .eq('cliente_id', clienteId)
    .order('occurred_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapSignal);
}

export type CampaignStats = { totalCampaigns: number; totalImpressions: number; totalClicks: number; totalSpend: number };

export function computeCampaignStats(signals: CampaignSignal[]): CampaignStats {
  const totalImpressions = signals.reduce((sum, s) => sum + (s.metrics.impressions ?? 0), 0);
  const totalClicks = signals.reduce((sum, s) => sum + (s.metrics.clicks ?? 0), 0);
  const totalSpend = signals.reduce((sum, s) => sum + (s.metrics.spend ?? 0), 0);
  return { totalCampaigns: signals.length, totalImpressions, totalClicks, totalSpend };
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

export async function syncCampaignSourceNow(clienteId: string | null | undefined, source: MarketCampaignSource): Promise<
  { sourcesSynced: number; signalsUpserted: number; errors: string[] } | { error: string }
> {
  const client = requireClient();
  try {
    const { data, error } = await client.functions.invoke('market-admin', {
      body: { action: 'syncCampaignSource', source, clienteId: clienteId || null },
    });
    if (error) return { error: await extractFunctionErrorMessage(error) };
    const payload = data as MarketAdminResult<{ sourcesSynced: number; signalsUpserted: number; errors: string[] }>;
    if (!payload || payload.ok !== true) return { error: (payload as MarketAdminErr)?.error || 'Resposta vazia.' };
    return { sourcesSynced: payload.sourcesSynced, signalsUpserted: payload.signalsUpserted, errors: payload.errors };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Falha ao chamar market-admin.' };
  }
}
