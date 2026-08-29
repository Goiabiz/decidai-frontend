import { universoSupabase } from '../lib/supabase';
import { alertas, documentos, kpis } from '../data/mock';
import { formatDateTime } from '../lib/formatDate';

const supabaseUniverso = universoSupabase;

export type DataSource = 'supabase' | 'mock';

export type QueryResult<T> = {
  data: T;
  source: DataSource;
  error?: string;
};

const safeText = (...values: Array<unknown>) => {
  const value = values.find((item) => typeof item === 'string' && item.trim().length > 0);
  return typeof value === 'string' ? value : '-';
};

async function tryQuery<T>(query: () => Promise<{ data: T | null; error: { message?: string } | null }>, fallback: T): Promise<QueryResult<T>> {
  try {
    const { data, error } = await query();

    if (error || !data) {
      return { data: fallback, source: 'mock', error: error?.message ?? 'Retorno vazio do Supabase' };
    }

    return { data, source: 'supabase' };
  } catch (error) {
    return { data: fallback, source: 'mock', error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

export async function fetchDashboard() {
  if (!supabaseUniverso) {
    return { data: kpis, source: 'mock' as DataSource, error: 'Supabase não configurado' };
  }

  return tryQuery(async () => {
    const { data, error } = await supabaseUniverso.from('vw_radar_dashboard').select('*').maybeSingle();

    const mapped = data
      ? [
          { label: 'Documentos monitorados', value: String(data.total_documentos ?? 0), trend: 'base atual', tone: 'green' },
          { label: 'Alertas críticos', value: String(data.alertas_pendentes_revisao ?? 0), trend: 'pendentes', tone: 'red' },
          { label: 'Impactos identificados', value: String(data.total_impactos_produto ?? 0), trend: 'mapeados', tone: 'blue' },
          { label: 'Ações pendentes', value: String(data.total_decisoes_po ?? 0), trend: 'decisões', tone: 'orange' },
          { label: 'Trechos indexados', value: String(data.total_trechos ?? 0), trend: 'base IA', tone: 'cyan' }
        ]
      : null;

    return { data: mapped, error };
  }, kpis);
}

export async function fetchAlertas() {
  if (!supabaseUniverso) {
    return { data: alertas, source: 'mock' as DataSource, error: 'Supabase não configurado' };
  }

  return tryQuery(async () => {
    const { data, error } = await supabaseUniverso
      .from('vw_alertas_pendentes')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(20);

    const mapped = data?.map((item) => ({
      criticidade: safeText(item.criticidade_validada, item.criticidade_sugerida, 'Médio'),
      titulo: safeText(item.titulo_alerta, item.resumo),
      fonte: safeText(item.documento_titulo, 'Fonte não informada'),
      data: formatDateTime(item.criado_em),
      modulo: safeText(item.modulo_validado, item.modulo_sugerido),
      funcionalidade: safeText(item.funcionalidade_validada, item.funcionalidade_sugerida),
      status: safeText(item.status_nome, item.status_codigo)
    }));

    return { data: mapped, error };
  }, alertas);
}

export async function fetchDocumentos() {
  if (!supabaseUniverso) {
    return { data: documentos, source: 'mock' as DataSource, error: 'Supabase não configurado' };
  }

  return tryQuery(async () => {
    const { data, error } = await supabaseUniverso
      .from('vw_documentos_base')
      .select('*')
      .order('data_publicacao', { ascending: false, nullsFirst: false })
      .limit(20);

    const mapped = data?.map((item) => ({
      titulo: safeText(item.titulo),
      tipo: safeText(item.tipo_documento_nome, item.tipo_documento_codigo),
      fonte: safeText(item.fonte_nome, item.orgao_responsavel),
      publicacao: item.data_publicacao ? formatDateTime(item.data_publicacao).slice(0, 10) : '-',
      status: safeText(item.status_nome, item.status_codigo, item.ativo ? 'Ativo' : 'Inativo'),
      tags: [safeText(item.tipo_fonte_nome, item.esfera), safeText(item.competencia_referencia)].filter((tag) => tag !== '-')
    }));

    return { data: mapped, error };
  }, documentos);
}
