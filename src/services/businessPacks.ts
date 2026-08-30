import { universoSupabase } from '../lib/supabase';

// Onda R (Marketplace/Business Packs, §110 emenda Imya) -- catálogo + checkout real.
// Distinto de services/marketplace.ts (esse é o marketplace de CONECTORES/integration_providers,
// um catálogo mais antigo e já existente) -- marketplace_packs é um catálogo separado
// (industry/business/regulatory/skill/workflow/connector/ontology), migration 140. Checkout
// (fn_acquire_marketplace_pack) não move dinheiro por pack -- monetização é só gate de plano
// (min_plan_code), decisão já confirmada na proposta original da Onda R.

export type BusinessPackType = 'industry' | 'business' | 'regulatory' | 'skill' | 'workflow' | 'connector' | 'ontology';
export type BusinessPackAuthorType = 'nativo' | 'oficial' | 'parceiro' | 'comunidade' | 'customizado';

export type BusinessPack = {
  id: string;
  packType: BusinessPackType;
  nome: string;
  descricao: string | null;
  autorTipo: BusinessPackAuthorType;
  autorEmpresaNome: string | null;
  licenca: string | null;
  versaoAtual: number;
  minPlanCode: string | null;
};

export type BusinessPackAcquisition = {
  id: string;
  packId: string;
  status: 'ativo' | 'revogado';
  adquiridoEm: string;
};

function requireClient() {
  if (!universoSupabase) throw new Error('Supabase não configurado neste ambiente.');
  return universoSupabase;
}

const PACK_SELECT = 'id, pack_type, nome, descricao, autor_tipo, autor_empresa_nome, licenca, versao_atual, min_plan_code';

function mapPack(row: Record<string, unknown>): BusinessPack {
  return {
    id: row.id as string,
    packType: row.pack_type as BusinessPackType,
    nome: row.nome as string,
    descricao: (row.descricao as string) || null,
    autorTipo: row.autor_tipo as BusinessPackAuthorType,
    autorEmpresaNome: (row.autor_empresa_nome as string) || null,
    licenca: (row.licenca as string) || null,
    versaoAtual: row.versao_atual as number,
    minPlanCode: (row.min_plan_code as string) || null,
  };
}

export async function listPublishedBusinessPacks(): Promise<BusinessPack[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('marketplace_packs')
    .select(PACK_SELECT)
    .eq('status', 'published')
    .order('pack_type')
    .order('nome');
  if (error) throw error;
  return (data ?? []).map(mapPack);
}

export async function listBusinessPackAcquisitions(clienteId: string): Promise<BusinessPackAcquisition[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('marketplace_pack_acquisitions')
    .select('id, pack_id, status, adquirido_em')
    .eq('cliente_id', clienteId);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    packId: row.pack_id as string,
    status: row.status as 'ativo' | 'revogado',
    adquiridoEm: row.adquirido_em as string,
  }));
}

export type AcquirePackResult = { ok: true; acquisitionId: string } | { ok: false; error: string };

export async function acquireBusinessPack(clienteId: string, packId: string): Promise<AcquirePackResult> {
  const client = requireClient();
  const { data, error } = await client.rpc('fn_acquire_marketplace_pack', { p_cliente_id: clienteId, p_pack_id: packId });
  if (error) return { ok: false, error: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  return { ok: true, acquisitionId: row?.acquisition_id as string };
}

export async function revokeBusinessPack(clienteId: string, packId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = requireClient();
  const { error } = await client.rpc('fn_revoke_marketplace_pack', { p_cliente_id: clienteId, p_pack_id: packId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
