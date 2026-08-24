import { universoSupabase } from '../lib/supabase';

// DecidAI Market -- Social Intelligence (Plano Mestre v4 §6.5, v1). Mesmo padrão de
// services/market.ts (Reputation) -- arquivo separado porque os tipos de fonte/sinal são
// diferentes o suficiente (métricas de engajamento por post/perfil, não avaliação com nota) pra
// não valer a pena forçar no mesmo union.

export type MarketSocialSource = 'instagram' | 'facebook_pages' | 'linkedin_pages' | 'tiktok_business' | 'youtube';

export const MARKET_SOCIAL_SOURCE_LABELS: Record<MarketSocialSource, string> = {
  instagram: 'Instagram',
  facebook_pages: 'Facebook (Página)',
  linkedin_pages: 'LinkedIn (Página)',
  tiktok_business: 'TikTok Business',
  youtube: 'YouTube',
};

export const MARKET_SOCIAL_SOURCE_REF_LABEL: Record<MarketSocialSource, string> = {
  instagram: 'ID da conta profissional (Instagram Business Account ID)',
  facebook_pages: 'ID da Página no Facebook',
  linkedin_pages: 'ID da organização no LinkedIn',
  tiktok_business: 'ID do anunciante (Advertiser ID) no TikTok Business',
  youtube: 'ID do canal (ou "próprio canal", a API já resolve pela credencial)',
};

export type SocialSource = {
  id: string;
  source: MarketSocialSource;
  externalRef: string;
  label: string;
  ativo: boolean;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
};

export type SocialSourceInput = { source: MarketSocialSource; externalRef: string; label: string };

function requireClient() {
  if (!universoSupabase) throw new Error('Supabase não configurado neste ambiente.');
  return universoSupabase;
}

const SOURCE_SELECT = 'id, source, external_ref, label, ativo, last_synced_at, last_sync_error';

function mapSource(row: Record<string, unknown>): SocialSource {
  return {
    id: row.id as string,
    source: row.source as MarketSocialSource,
    externalRef: row.external_ref as string,
    label: row.label as string,
    ativo: row.ativo as boolean,
    lastSyncedAt: (row.last_synced_at as string) || null,
    lastSyncError: (row.last_sync_error as string) || null,
  };
}

export async function listSocialSources(clienteId: string): Promise<SocialSource[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('market_social_sources')
    .select(SOURCE_SELECT)
    .eq('cliente_id', clienteId)
    .order('criado_em');
  if (error) throw error;
  return (data ?? []).map(mapSource);
}

export async function createSocialSource(clienteId: string, input: SocialSourceInput): Promise<SocialSource> {
  const client = requireClient();
  const { data, error } = await client
    .from('market_social_sources')
    .insert({ cliente_id: clienteId, source: input.source, external_ref: input.externalRef, label: input.label })
    .select(SOURCE_SELECT)
    .single();
  if (error) throw error;
  return mapSource(data);
}

export async function setSocialSourceAtivo(id: string, ativo: boolean): Promise<void> {
  const client = requireClient();
  const { error } = await client
    .from('market_social_sources')
    .update({ ativo, atualizado_em: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export type SocialSignal = {
  id: string;
  sourceId: string;
  source: MarketSocialSource;
  signalType: 'post' | 'profile_snapshot';
  caption: string | null;
  permalink: string | null;
  occurredAt: string;
  metrics: Record<string, number>;
};

const SIGNAL_SELECT = 'id, source_id, source, signal_type, caption, permalink, occurred_at, metrics';

function mapSignal(row: Record<string, unknown>): SocialSignal {
  return {
    id: row.id as string,
    sourceId: row.source_id as string,
    source: row.source as MarketSocialSource,
    signalType: row.signal_type as SocialSignal['signalType'],
    caption: (row.caption as string) || null,
    permalink: (row.permalink as string) || null,
    occurredAt: row.occurred_at as string,
    metrics: (row.metrics as Record<string, number>) ?? {},
  };
}

export async function listSocialSignals(clienteId: string, limit = 50): Promise<SocialSignal[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('market_social_signals')
    .select(SIGNAL_SELECT)
    .eq('cliente_id', clienteId)
    .order('occurred_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapSignal);
}

export type SocialStats = { totalPosts: number; totalEngagement: number; latestFollowers: number | null; last30Days: number };

export function computeSocialStats(signals: SocialSignal[]): SocialStats {
  const posts = signals.filter((s) => s.signalType === 'post');
  const totalEngagement = posts.reduce((sum, s) => sum + (s.metrics.likes ?? 0) + (s.metrics.comments ?? 0) + (s.metrics.shares ?? 0), 0);
  const snapshots = signals.filter((s) => s.signalType === 'profile_snapshot').sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const latestFollowers = snapshots.length > 0 ? (snapshots[0].metrics.followers ?? snapshots[0].metrics.subscribers ?? null) : null;
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const last30Days = posts.filter((s) => new Date(s.occurredAt).getTime() >= cutoff).length;
  return { totalPosts: posts.length, totalEngagement, latestFollowers, last30Days };
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

export async function syncSocialSourceNow(clienteId: string | null | undefined, source: MarketSocialSource): Promise<
  { sourcesSynced: number; signalsUpserted: number; errors: string[] } | { error: string }
> {
  const client = requireClient();
  try {
    const { data, error } = await client.functions.invoke('market-admin', {
      body: { action: 'syncSocialSource', source, clienteId: clienteId || null },
    });
    if (error) return { error: await extractFunctionErrorMessage(error) };
    const payload = data as MarketAdminResult<{ sourcesSynced: number; signalsUpserted: number; errors: string[] }>;
    if (!payload || payload.ok !== true) return { error: (payload as MarketAdminErr)?.error || 'Resposta vazia.' };
    return { sourcesSynced: payload.sourcesSynced, signalsUpserted: payload.signalsUpserted, errors: payload.errors };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Falha ao chamar market-admin.' };
  }
}
