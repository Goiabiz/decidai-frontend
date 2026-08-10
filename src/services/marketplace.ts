import { universoSupabase } from '../lib/supabase';

export type ConnectorTier = 'nativo' | 'oficial' | 'parceiro' | 'comunidade' | 'customizado';

export type MarketplaceItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  categoryName: string | null;
  minPlanCode: string | null;
  logoHint: string | null;
  tier: ConnectorTier;
  partnerEmpresaNome: string | null;
  revenueSharePartnerPct: number | null;
  revenueSharePromoPct: number | null;
  revenueSharePromoUntil: string | null;
};

export type MarketplaceLoadState = 'supabase' | 'local';

function getClient() {
  return universoSupabase;
}

const FALLBACK_CATALOG: MarketplaceItem[] = [
  { id: 'local-1', code: 'gmail', name: 'Gmail', description: 'Envio e leitura de e-mails.', categoryName: 'Comunicação', minPlanCode: null, logoHint: 'gmail', tier: 'oficial', partnerEmpresaNome: null, revenueSharePartnerPct: null, revenueSharePromoPct: null, revenueSharePromoUntil: null },
  { id: 'local-2', code: 'jira', name: 'Jira', description: 'Integração com chamados e tickets.', categoryName: 'Gestão de trabalho', minPlanCode: 'pro', logoHint: 'jira', tier: 'oficial', partnerEmpresaNome: null, revenueSharePartnerPct: null, revenueSharePromoPct: null, revenueSharePromoUntil: null },
];

export async function listMarketplaceCatalog(): Promise<{ items: MarketplaceItem[]; source: MarketplaceLoadState }> {
  const client = getClient();
  if (client) {
    const { data, error } = await client
      .from('vw_v35_integration_catalog_client')
      .select('id, code, name, description, category_name, min_plan_code, logo_hint, connector_tier, partner_empresa_nome, revenue_share_partner_pct, revenue_share_promo_pct, revenue_share_promo_until')
      .order('category_name', { ascending: true })
      .order('name', { ascending: true });
    if (!error) {
      return {
        items: (data || []).map((row) => ({
          id: row.id,
          code: row.code,
          name: row.name,
          description: row.description,
          categoryName: row.category_name,
          minPlanCode: row.min_plan_code,
          logoHint: row.logo_hint,
          tier: (row.connector_tier || 'oficial') as ConnectorTier,
          partnerEmpresaNome: row.partner_empresa_nome,
          revenueSharePartnerPct: row.revenue_share_partner_pct,
          revenueSharePromoPct: row.revenue_share_promo_pct,
          revenueSharePromoUntil: row.revenue_share_promo_until,
        })),
        source: 'supabase',
      };
    }
  }
  return { items: FALLBACK_CATALOG, source: 'local' };
}

export type PartnerSubmissionInput = {
  empresaNome: string;
  contatoNome: string;
  contatoEmail: string;
  contatoTelefone?: string;
  appNome: string;
  appDescricao: string;
  categoriaSugerida?: string;
  websiteUrl?: string;
};

export async function submitPartnerApplication(input: PartnerSubmissionInput): Promise<{ ok: boolean; source: MarketplaceLoadState }> {
  const client = getClient();
  if (client) {
    const { error } = await client.from('marketplace_partner_submissions').insert({
      empresa_nome: input.empresaNome,
      contato_nome: input.contatoNome,
      contato_email: input.contatoEmail,
      contato_telefone: input.contatoTelefone || null,
      app_nome: input.appNome,
      app_descricao: input.appDescricao,
      categoria_sugerida: input.categoriaSugerida || null,
      website_url: input.websiteUrl || null,
    });
    if (!error) return { ok: true, source: 'supabase' };
  }
  return { ok: false, source: 'local' };
}

export type PartnerSubmissionStatus = 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado';

export type PartnerSubmission = {
  id: string;
  empresaNome: string;
  contatoNome: string;
  contatoEmail: string;
  contatoTelefone: string | null;
  appNome: string;
  appDescricao: string;
  categoriaSugerida: string | null;
  websiteUrl: string | null;
  status: PartnerSubmissionStatus;
  observacaoInterna: string | null;
  criadoEm: string;
};

export async function listPartnerSubmissions(): Promise<{ items: PartnerSubmission[]; source: MarketplaceLoadState }> {
  const client = getClient();
  if (client) {
    const { data, error } = await client
      .from('marketplace_partner_submissions')
      .select('id, empresa_nome, contato_nome, contato_email, contato_telefone, app_nome, app_descricao, categoria_sugerida, website_url, status, observacao_interna, criado_em')
      .order('criado_em', { ascending: false });
    if (!error) {
      return {
        items: (data || []).map((row) => ({
          id: row.id,
          empresaNome: row.empresa_nome,
          contatoNome: row.contato_nome,
          contatoEmail: row.contato_email,
          contatoTelefone: row.contato_telefone,
          appNome: row.app_nome,
          appDescricao: row.app_descricao,
          categoriaSugerida: row.categoria_sugerida,
          websiteUrl: row.website_url,
          status: row.status as PartnerSubmissionStatus,
          observacaoInterna: row.observacao_interna,
          criadoEm: row.criado_em,
        })),
        source: 'supabase',
      };
    }
  }
  return { items: [], source: 'local' };
}

export async function updateSubmissionStatus(id: string, status: PartnerSubmissionStatus, observacaoInterna?: string): Promise<MarketplaceLoadState> {
  const client = getClient();
  if (client) {
    const { error } = await client
      .from('marketplace_partner_submissions')
      .update({ status, observacao_interna: observacaoInterna ?? null, atualizado_em: new Date().toISOString() })
      .eq('id', id);
    if (!error) return 'supabase';
  }
  return 'local';
}
