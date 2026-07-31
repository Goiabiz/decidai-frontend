import { universoSupabase, pocSupabase } from '../lib/supabase';
import { acoes, alertas, atendimentos, clientes, documentos, impactos, kpis } from '../data/mock';

function getPocClient() {
  if (!pocSupabase) throw new Error('Supabase POC nÃ£o configurado');
  return pocSupabase;
}

const supabaseUniverso = universoSupabase;
const supabasePoc = pocSupabase;



export type DataSource = 'supabase' | 'mock';

export type QueryResult<T> = {
  data: T;
  source: DataSource;
  error?: string;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
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
    return { data: kpis, source: 'mock' as DataSource, error: 'Supabase nÃ£o configurado' };
  }

  return tryQuery(async () => {
    const { data, error } = await supabaseUniverso.from('vw_radar_dashboard').select('*').maybeSingle();

    const mapped = data
      ? [
          { label: 'Documentos monitorados', value: String(data.total_documentos ?? 0), trend: 'base atual', tone: 'green' },
          { label: 'Alertas crÃ­ticos', value: String(data.alertas_pendentes_revisao ?? 0), trend: 'pendentes', tone: 'red' },
          { label: 'Impactos identificados', value: String(data.total_impactos_produto ?? 0), trend: 'mapeados', tone: 'blue' },
          { label: 'AÃ§Ãµes pendentes', value: String(data.total_decisoes_po ?? 0), trend: 'decisÃµes', tone: 'orange' },
          { label: 'Trechos indexados', value: String(data.total_trechos ?? 0), trend: 'base IA', tone: 'cyan' }
        ]
      : null;

    return { data: mapped, error };
  }, kpis);
}

export async function fetchAlertas() {
  if (!supabaseUniverso) {
    return { data: alertas, source: 'mock' as DataSource, error: 'Supabase nÃ£o configurado' };
  }

  return tryQuery(async () => {
    const { data, error } = await supabaseUniverso
      .from('vw_alertas_pendentes')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(20);

    const mapped = data?.map((item) => ({
      criticidade: safeText(item.criticidade_validada, item.criticidade_sugerida, 'MÃ©dio'),
      titulo: safeText(item.titulo_alerta, item.resumo),
      fonte: safeText(item.documento_titulo, 'Fonte nÃ£o informada'),
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
    return { data: documentos, source: 'mock' as DataSource, error: 'Supabase nÃ£o configurado' };
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

export async function fetchImpactos() {
  if (!supabaseUniverso) {
    return { data: impactos, source: 'mock' as DataSource, error: 'Supabase nÃ£o configurado' };
  }

  return tryQuery(async () => {
    const { data, error } = await supabaseUniverso
      .from('vw_impactos_produto')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(20);

    const mapped = data?.map((item) => ({
      modulo: safeText(item.modulo_nome),
      funcionalidade: safeText(item.funcionalidade_nome),
      origem: safeText(item.tipo_impacto_nome, item.tipo_impacto, 'Impacto identificado'),
      criticidade: safeText(item.nivel_impacto, item.prioridade_produto, 'MÃ©dio'),
      cliente: safeText(item.impacto_cliente, item.serie_titulo, 'Produto'),
      status: safeText(item.status_acao_nome, item.status_acao_codigo, 'Em anÃ¡lise')
    }));

    return { data: mapped, error };
  }, impactos);
}

export async function fetchAcoes() {
  if (!supabaseUniverso) {
    return { data: acoes, source: 'mock' as DataSource, error: 'Supabase nÃ£o configurado' };
  }

  return tryQuery(async () => {
    const { data, error } = await supabaseUniverso
      .from('vw_decisoes_po')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(20);

    const mapped = data?.map((item) => ({
      origem: safeText(item.titulo_alerta, item.documento_titulo, 'AnÃ¡lise'),
      resumo: safeText(item.titulo_decisao, item.resumo_decisao, item.acao_recomendada),
      criticidade: item.requer_requisito ? 'Alta' : 'MÃ©dia',
      responsavel: safeText(item.decidido_por_nome, 'Equipe PO'),
      prazo: item.decidido_em ? formatDateTime(item.decidido_em).slice(0, 10) : '-',
      status: safeText(item.status_nome, item.status_codigo)
    }));

    return { data: mapped, error };
  }, acoes);
}

export async function fetchAtendimentos() {
  if (!supabasePoc) {
    return { data: atendimentos, source: 'mock' as DataSource, error: 'Supabase POC nÃ£o configurado' };
  }

  return tryQuery(async () => {
    const { data, error } = await supabasePoc
      .from('vw_universe_poc_atendimentos')
      .select('*')
      .order('atualizado_em', { ascending: false })
      .limit(20);

    const mapped = data?.map((item) => ({
      canal: safeText(item.canal_origem),
      cliente: safeText(item.organizacao_atendida_nome, item.cliente_contratante_nome),
      assunto: safeText(item.titulo, item.intencao_detectada, item.titulo_ticket),
      prioridade: safeText(item.prioridade, 'MÃ©dia'),
      responsavel: safeText(item.responsavel_nome, 'NÃ£o atribuÃ­do'),
      ultimaInteracao: item.atualizado_em ?? item.iniciado_em ?? '-',
      ticket: safeText(item.ticket_externo_codigo, item.ticket_externo_url, ''),
      status: safeText(item.status)
    }));

    return { data: mapped, error };
  }, atendimentos as any) as any;
}

export async function fetchClientes() {
  if (!supabasePoc) {
    return { data: clientes, source: 'mock' as DataSource, error: 'Supabase POC nÃ£o configurado' };
  }

  return tryQuery(async () => {
    const { data, error } = await supabasePoc
      .from('clientes_contratantes')
      .select('id,nome_fantasia,cnpj,status,tipo_cliente,atualizado_em,cor_primaria,cor_secundaria,cor_destaque')
      .order('nome_fantasia', { ascending: true })
      .limit(20);

    const mapped = data?.map((item) => ({
      cliente: safeText(item.nome_fantasia),
      plano: safeText(item.tipo_cliente, 'Contratante'),
      ambiente: 'ProduÃ§Ã£o',
      status: safeText(item.status),
      integracoes: 0,
      atualizado: formatDateTime(item.atualizado_em)
    }));

    return { data: mapped, error };
  }, clientes);
}

export type ClienteConfig = {
  nome: string;
  tipo: string;
  status: string;
  plano: string;
  ambiente: string;
  integracoes: string;
  atualizadoEm: string;
};

export type IntegracaoConfig = {
  nome: string;
  provedor: string;
  status: string;
  autenticacao: string;
  cliente: string;
  atualizadoEm: string;
};

export type UsuarioConfig = {
  nome: string;
  email: string;
  perfil: string;
  status: string;
  cliente: string;
  ultimoLogin: string;
};

const fallbackClientesConfig: ClienteConfig[] = [
  {
    nome: 'Prefeitura Demonstrativa',
    tipo: 'MunicÃ­pio',
    status: 'ativo',
    plano: 'PadrÃ£o',
    ambiente: 'ProduÃ§Ã£o',
    integracoes: '3',
    atualizadoEm: '2026-07-19',
  },
];

const fallbackIntegracoesConfig: IntegracaoConfig[] = [
  {
    nome: 'Jira',
    provedor: 'Atlassian',
    status: 'ativo',
    autenticacao: 'OAuth',
    cliente: 'Prefeitura Demonstrativa',
    atualizadoEm: '2026-07-19',
  },
];

const fallbackUsuariosConfig: UsuarioConfig[] = [
  {
    nome: 'Bruno Oliveira',
    email: 'bruno@exemplo.com',
    perfil: 'Administrador',
    status: 'ativo',
    cliente: 'Operadora',
    ultimoLogin: '2026-07-19',
  },
];

export async function fetchClientesConfig(): Promise<QueryResult<ClienteConfig[]>> {
  if (!supabasePoc) {
    return { data: fallbackClientesConfig, source: 'mock', error: 'Supabase POC nÃ£o configurado' };
  }

  return tryQuery(async () => {
    const { data, error } = await supabasePoc
      .from('vw_frontend_config_clientes')
      .select('nome,tipo,status,plano,ambiente,integracoes,atualizado_em')
      .order('nome', { ascending: true });

    const mapped = data?.map((item) => ({
      nome: item.nome ?? '-',
      tipo: item.tipo ?? '-',
      status: item.status ?? '-',
      plano: item.plano ?? 'PadrÃ£o',
      ambiente: item.ambiente ?? 'ProduÃ§Ã£o',
      integracoes: String(item.integracoes ?? '0'),
      atualizadoEm: item.atualizado_em ?? '-',
    }));

    return { data: mapped, error };
  }, fallbackClientesConfig);
}

export async function fetchIntegracoesConfig(): Promise<QueryResult<IntegracaoConfig[]>> {
  if (!supabasePoc) {
    return { data: fallbackIntegracoesConfig, source: 'mock', error: 'Supabase POC nÃ£o configurado' };
  }

  return tryQuery(async () => {
    const { data, error } = await supabasePoc
      .from('vw_frontend_config_integracoes')
      .select('nome,provedor,status,autenticacao,cliente,atualizado_em')
      .order('nome', { ascending: true });

    const mapped = data?.map((item) => ({
      nome: item.nome ?? '-',
      provedor: item.provedor ?? '-',
      status: item.status ?? '-',
      autenticacao: item.autenticacao ?? 'nÃ£o informada',
      cliente: item.cliente ?? 'Geral',
      atualizadoEm: item.atualizado_em ?? '-',
    }));

    return { data: mapped, error };
  }, fallbackIntegracoesConfig);
}

export async function fetchUsuariosConfig(): Promise<QueryResult<UsuarioConfig[]>> {
  if (!supabasePoc) {
    return { data: fallbackUsuariosConfig, source: 'mock', error: 'Supabase POC nÃ£o configurado' };
  }

  return tryQuery(async () => {
    const { data, error } = await supabasePoc
      .from('vw_frontend_config_usuarios')
      .select('nome,email,perfil,status,cliente,ultimo_login_em')
      .order('nome', { ascending: true });

    const mapped = data?.map((item) => ({
      nome: item.nome ?? '-',
      email: item.email ?? '-',
      perfil: item.perfil ?? '-',
      status: item.status ?? '-',
      cliente: item.cliente ?? 'Operadora',
      ultimoLogin: item.ultimo_login_em ?? '-',
    }));

    return { data: mapped, error };
  }, fallbackUsuariosConfig);
}


