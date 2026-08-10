import { universoSupabase } from '../lib/supabase';

export type PortalBanner = {
  id: string;
  imagemUrl: string;
  linkUrl: string;
  textoAlt: string;
  ativoDe: string | null;
  ativoAte: string | null;
  ordem: number;
};

export type PortalFooterLink = { titulo: string; url: string };

export type PortalConfiguracao = {
  clienteId: string;
  nomePortal: string;
  logoUrl: string;
  faviconUrl: string;
  corPrimaria: string;
  corDestaque: string;
  heroImagemUrl: string;
  heroTitulo: string;
  heroSubtitulo: string;
  heroLinkUrl: string;
  anuncioTexto: string;
  anuncioCorFundo: string;
  anuncioAtivo: boolean;
  banners: PortalBanner[];
  linksRodape: PortalFooterLink[];
};

function defaultConfig(clienteId: string): PortalConfiguracao {
  return {
    clienteId,
    nomePortal: 'Central de Ajuda',
    logoUrl: '',
    faviconUrl: '',
    corPrimaria: '#003f2a',
    corDestaque: '#00784d',
    heroImagemUrl: '',
    heroTitulo: '',
    heroSubtitulo: '',
    heroLinkUrl: '',
    anuncioTexto: '',
    anuncioCorFundo: '#fef3c7',
    anuncioAtivo: false,
    banners: [],
    linksRodape: [],
  };
}

function fromRow(row: Record<string, unknown>): PortalConfiguracao {
  const base = defaultConfig(row.platform_client_id as string);
  return {
    ...base,
    nomePortal: (row.nome_portal as string) || base.nomePortal,
    logoUrl: (row.logo_url as string) || '',
    faviconUrl: (row.favicon_url as string) || '',
    corPrimaria: (row.cor_primaria as string) || base.corPrimaria,
    corDestaque: (row.cor_destaque as string) || base.corDestaque,
    heroImagemUrl: (row.hero_imagem_url as string) || '',
    heroTitulo: (row.hero_titulo as string) || '',
    heroSubtitulo: (row.hero_subtitulo as string) || '',
    heroLinkUrl: (row.hero_link_url as string) || '',
    anuncioTexto: (row.anuncio_texto as string) || '',
    anuncioCorFundo: (row.anuncio_cor_fundo as string) || base.anuncioCorFundo,
    anuncioAtivo: Boolean(row.anuncio_ativo),
    banners: (row.banners as PortalBanner[]) || [],
    linksRodape: (row.links_rodape as PortalFooterLink[]) || [],
  };
}

function toRow(config: PortalConfiguracao) {
  return {
    platform_client_id: config.clienteId,
    nome_portal: config.nomePortal || null,
    logo_url: config.logoUrl || null,
    favicon_url: config.faviconUrl || null,
    cor_primaria: config.corPrimaria,
    cor_destaque: config.corDestaque,
    hero_imagem_url: config.heroImagemUrl || null,
    hero_titulo: config.heroTitulo || null,
    hero_subtitulo: config.heroSubtitulo || null,
    hero_link_url: config.heroLinkUrl || null,
    anuncio_texto: config.anuncioTexto || null,
    anuncio_cor_fundo: config.anuncioCorFundo,
    anuncio_ativo: config.anuncioAtivo,
    banners: config.banners,
    links_rodape: config.linksRodape,
    atualizado_em: new Date().toISOString(),
  };
}

const LOCAL_KEY_PREFIX = 'radar-sus-portal-config-fallback:';

function loadLocal(clienteId: string): PortalConfiguracao {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY_PREFIX + clienteId);
    if (!raw) return defaultConfig(clienteId);
    return { ...defaultConfig(clienteId), ...JSON.parse(raw) };
  } catch {
    return defaultConfig(clienteId);
  }
}

function saveLocal(config: PortalConfiguracao) {
  window.localStorage.setItem(LOCAL_KEY_PREFIX + config.clienteId, JSON.stringify(config));
}

export async function getPortalConfiguracao(clienteId: string): Promise<{ config: PortalConfiguracao; source: 'supabase' | 'local' }> {
  const client = universoSupabase;
  if (client) {
    const { data, error } = await client
      .from('portal_configuracoes')
      .select('*')
      .eq('platform_client_id', clienteId)
      .maybeSingle();
    if (!error) {
      return { config: data ? fromRow(data) : defaultConfig(clienteId), source: 'supabase' };
    }
  }
  return { config: loadLocal(clienteId), source: 'local' };
}

export async function savePortalConfiguracao(config: PortalConfiguracao): Promise<'supabase' | 'local'> {
  const client = universoSupabase;
  if (client) {
    const { error } = await client
      .from('portal_configuracoes')
      .upsert(toRow(config), { onConflict: 'platform_client_id' });
    if (!error) return 'supabase';
  }
  saveLocal(config);
  return 'local';
}
