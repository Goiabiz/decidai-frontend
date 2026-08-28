import { universoSupabase } from '../lib/supabase';

export type AtendimentoStatus = 'Novo' | 'Em andamento' | 'Aguardando resposta' | 'Concluído' | 'Cancelado';
export type MensagemTipo = 'publica' | 'interna' | 'sistema';
/** Alinhado com service_sla_rules.priority (services/servicosFilas.ts) desde a migration 155 -- antes atendimentos só aceitava 3 valores, sem Crítica. */
export type AtendimentoPrioridade = 'Crítica' | 'Alta' | 'Média' | 'Baixa';
export const prioridadesAtendimento: AtendimentoPrioridade[] = ['Crítica', 'Alta', 'Média', 'Baixa'];

export type Atendimento = {
  id: string;
  numero_sequencial: number;
  cliente_id: string;
  canal: string;
  origem_portal: boolean;
  solicitante_usuario_portal_id: string | null;
  solicitante_nome: string | null;
  solicitante_email: string | null;
  solicitante_telefone: string | null;
  assunto: string;
  status: AtendimentoStatus;
  prioridade: AtendimentoPrioridade;
  responsavel_usuario_sistema_id: string | null;
  responsavel_nome?: string | null;
  servico_id?: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type AtendimentoMensagem = {
  id: string;
  atendimento_id: string;
  tipo: MensagemTipo;
  autor_nome: string | null;
  texto: string;
  criado_em: string;
};

export type AtendimentosLoadState = 'supabase' | 'local';

/**
 * Portal do Cliente exige conta (ver services/portalAuth.ts) -- a tabela `atendimentos`
 * pode ainda não existir no ambiente atual (migrations 027-029 escritas, não aplicadas).
 * Todo método aqui tenta o Supabase real primeiro e cai para um fallback local
 * (localStorage) sem erro visível, mesmo padrão de services/v35Supabase.ts.
 */
function getClient() {
  return universoSupabase;
}

/** Número puro, sem prefixo/zero à esquerda (ex.: "nº 145") -- decisão explícita do usuário. */
function formatProtocolo(atendimento: Pick<Atendimento, 'numero_sequencial'>) {
  return `nº ${atendimento.numero_sequencial}`;
}

const LOCAL_KEY = 'radar-sus-portal-atendimentos-fallback';
let localSequence = 1;

type LocalStore = { atendimentos: Atendimento[]; mensagens: AtendimentoMensagem[] };

function loadLocalStore(): LocalStore {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return { atendimentos: [], mensagens: [] };
    const parsed = JSON.parse(raw) as LocalStore;
    localSequence = Math.max(localSequence, ...parsed.atendimentos.map((a) => a.numero_sequencial + 1), 1);
    return parsed;
  } catch {
    return { atendimentos: [], mensagens: [] };
  }
}

function saveLocalStore(store: LocalStore) {
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(store));
}

export type NovoAtendimentoPortalInput = {
  clienteId: string;
  usuarioPortalId: string;
  solicitanteNome: string;
  solicitanteEmail: string;
  solicitanteTelefone?: string;
  assunto: string;
  mensagem: string;
};

export async function createAtendimentoPortal(input: NovoAtendimentoPortalInput): Promise<{ atendimento: Atendimento; protocolo: string; source: AtendimentosLoadState }> {
  const client = getClient();

  if (client) {
    const { data: atendimento, error } = await client
      .from('atendimentos')
      .insert({
        cliente_id: input.clienteId,
        canal: 'Portal',
        origem_portal: true,
        solicitante_usuario_portal_id: input.usuarioPortalId,
        solicitante_nome: input.solicitanteNome,
        solicitante_email: input.solicitanteEmail,
        solicitante_telefone: input.solicitanteTelefone || null,
        assunto: input.assunto,
        status: 'Novo',
      })
      .select('*')
      .single();

    if (!error && atendimento) {
      await client.from('atendimento_mensagens').insert({
        atendimento_id: atendimento.id,
        tipo: 'publica',
        autor_nome: input.solicitanteNome,
        texto: input.mensagem,
      });
      const typed = atendimento as Atendimento;
      return { atendimento: typed, protocolo: formatProtocolo(typed), source: 'supabase' };
    }
  }

  const store = loadLocalStore();
  const now = new Date().toISOString();
  const atendimento: Atendimento = {
    id: `local-${Date.now()}`,
    numero_sequencial: localSequence++,
    cliente_id: input.clienteId,
    canal: 'Portal',
    origem_portal: true,
    solicitante_usuario_portal_id: input.usuarioPortalId,
    solicitante_nome: input.solicitanteNome,
    solicitante_email: input.solicitanteEmail,
    solicitante_telefone: input.solicitanteTelefone || null,
    assunto: input.assunto,
    status: 'Novo',
    prioridade: 'Média',
    responsavel_usuario_sistema_id: null,
    criado_em: now,
    atualizado_em: now,
  };
  const mensagem: AtendimentoMensagem = {
    id: `local-msg-${Date.now()}`,
    atendimento_id: atendimento.id,
    tipo: 'publica',
    autor_nome: input.solicitanteNome,
    texto: input.mensagem,
    criado_em: now,
  };
  store.atendimentos.push(atendimento);
  store.mensagens.push(mensagem);
  saveLocalStore(store);
  return { atendimento, protocolo: formatProtocolo(atendimento), source: 'local' };
}

export async function listMeusChamadosPortal(usuarioPortalId: string, clienteId: string): Promise<{ chamados: Atendimento[]; source: AtendimentosLoadState }> {
  const client = getClient();

  if (client) {
    const { data, error } = await client
      .from('atendimentos')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('solicitante_usuario_portal_id', usuarioPortalId)
      .eq('origem_portal', true)
      .order('criado_em', { ascending: false });
    if (!error) {
      return { chamados: (data || []) as Atendimento[], source: 'supabase' };
    }
  }

  const store = loadLocalStore();
  const chamados = store.atendimentos
    .filter((item) => item.cliente_id === clienteId && item.solicitante_usuario_portal_id === usuarioPortalId)
    .sort((a, b) => (a.criado_em < b.criado_em ? 1 : -1));
  return { chamados, source: 'local' };
}

export async function getChamadoPortal(atendimentoId: string, usuarioPortalId: string): Promise<{ atendimento: Atendimento; mensagens: AtendimentoMensagem[]; source: AtendimentosLoadState } | null> {
  const client = getClient();

  if (client) {
    const { data: atendimento, error } = await client
      .from('atendimentos')
      .select('*')
      .eq('id', atendimentoId)
      .eq('solicitante_usuario_portal_id', usuarioPortalId)
      .maybeSingle();

    if (!error) {
      if (!atendimento) return null;
      const { data: mensagens } = await client
        .from('atendimento_mensagens')
        .select('*')
        .eq('atendimento_id', atendimento.id)
        .eq('tipo', 'publica')
        .order('criado_em', { ascending: true });
      return { atendimento: atendimento as Atendimento, mensagens: (mensagens || []) as AtendimentoMensagem[], source: 'supabase' };
    }
  }

  const store = loadLocalStore();
  const atendimento = store.atendimentos.find((item) => item.id === atendimentoId && item.solicitante_usuario_portal_id === usuarioPortalId);
  if (!atendimento) return null;
  const mensagens = store.mensagens.filter((item) => item.atendimento_id === atendimento.id && item.tipo === 'publica');
  return { atendimento, mensagens, source: 'local' };
}

export async function replyAtendimentoPortal(atendimentoId: string, autorNome: string, texto: string): Promise<AtendimentosLoadState> {
  const client = getClient();
  if (client) {
    const { error } = await client.from('atendimento_mensagens').insert({
      atendimento_id: atendimentoId,
      tipo: 'publica',
      autor_nome: autorNome,
      texto,
    });
    if (!error) return 'supabase';
  }

  const store = loadLocalStore();
  store.mensagens.push({
    id: `local-msg-${Date.now()}`,
    atendimento_id: atendimentoId,
    tipo: 'publica',
    autor_nome: autorNome,
    texto,
    criado_em: new Date().toISOString(),
  });
  saveLocalStore(store);
  return 'local';
}

/** Fila de chamados (admin/staff) -- todos os atendimentos de um cliente, com nome de quem atende resolvido. */
export async function listAtendimentosAdmin(clienteId: string): Promise<{ chamados: Atendimento[]; source: AtendimentosLoadState }> {
  const client = getClient();

  if (client) {
    const { data, error } = await client
      .from('atendimentos')
      .select('*, responsavel:usuarios_sistema(nome)')
      .eq('cliente_id', clienteId)
      .is('excluido_em', null)
      .order('criado_em', { ascending: false });
    if (!error) {
      const chamados = (data || []).map((row) => {
        const responsavelRel = (row as { responsavel?: { nome?: string } | { nome?: string }[] }).responsavel;
        const responsavel = Array.isArray(responsavelRel) ? responsavelRel[0] : responsavelRel;
        return { ...(row as Atendimento), responsavel_nome: responsavel?.nome ?? null };
      });
      return { chamados, source: 'supabase' };
    }
  }

  const store = loadLocalStore();
  const chamados = store.atendimentos
    .filter((item) => item.cliente_id === clienteId)
    .sort((a, b) => (a.criado_em < b.criado_em ? 1 : -1));
  return { chamados, source: 'local' };
}

/** Todas as mensagens de um atendimento (pública + interna + sistema) -- visão da equipe, não do Portal. */
export async function listMensagensAdmin(atendimentoId: string): Promise<{ mensagens: AtendimentoMensagem[]; source: AtendimentosLoadState }> {
  const client = getClient();

  if (client) {
    const { data, error } = await client
      .from('atendimento_mensagens')
      .select('*')
      .eq('atendimento_id', atendimentoId)
      .order('criado_em', { ascending: true });
    if (!error) {
      return { mensagens: (data || []) as AtendimentoMensagem[], source: 'supabase' };
    }
  }

  const store = loadLocalStore();
  const mensagens = store.mensagens.filter((item) => item.atendimento_id === atendimentoId);
  return { mensagens, source: 'local' };
}

export type NovoAtendimentoManualInput = {
  clienteId: string;
  canal: string;
  solicitanteNome: string;
  assunto: string;
  mensagem: string;
  /** Opcional -- sem isso, o atendimento não entra na comparação de SLA real vs. meta (vw_atendimento_sla, migration 151). */
  servicoId?: string;
  /** Default 'Média' se omitido (mesmo default do banco, migration 027). */
  prioridade?: AtendimentoPrioridade;
};

/** Atendimento criado pela própria equipe (e-mail, WhatsApp, widget, API, manual) -- não é origem Portal. */
export async function createAtendimentoManual(input: NovoAtendimentoManualInput): Promise<{ atendimento: Atendimento; source: AtendimentosLoadState }> {
  const client = getClient();

  if (client) {
    const { data: atendimento, error } = await client
      .from('atendimentos')
      .insert({
        cliente_id: input.clienteId,
        canal: input.canal,
        origem_portal: false,
        solicitante_nome: input.solicitanteNome,
        assunto: input.assunto,
        status: 'Novo',
        servico_id: input.servicoId || null,
        prioridade: input.prioridade || 'Média',
      })
      .select('*')
      .single();

    if (!error && atendimento) {
      await client.from('atendimento_mensagens').insert([
        { atendimento_id: atendimento.id, tipo: 'sistema', autor_nome: null, texto: `Atendimento criado via ${input.canal}.` },
        { atendimento_id: atendimento.id, tipo: 'publica', autor_nome: input.solicitanteNome, texto: input.mensagem },
      ]);
      return { atendimento: atendimento as Atendimento, source: 'supabase' };
    }
  }

  const store = loadLocalStore();
  const now = new Date().toISOString();
  const atendimento: Atendimento = {
    id: `local-${Date.now()}`,
    numero_sequencial: localSequence++,
    cliente_id: input.clienteId,
    canal: input.canal,
    origem_portal: false,
    solicitante_usuario_portal_id: null,
    solicitante_nome: input.solicitanteNome,
    solicitante_email: null,
    solicitante_telefone: null,
    assunto: input.assunto,
    status: 'Novo',
    prioridade: input.prioridade || 'Média',
    responsavel_usuario_sistema_id: null,
    criado_em: now,
    atualizado_em: now,
  };
  store.atendimentos.push(atendimento);
  store.mensagens.push(
    { id: `local-msg-${Date.now()}-sys`, atendimento_id: atendimento.id, tipo: 'sistema', autor_nome: null, texto: `Atendimento criado via ${input.canal}.`, criado_em: now },
    { id: `local-msg-${Date.now()}`, atendimento_id: atendimento.id, tipo: 'publica', autor_nome: input.solicitanteNome, texto: input.mensagem, criado_em: now },
  );
  saveLocalStore(store);
  return { atendimento, source: 'local' };
}

export type AutorEquipe = { kind: 'sistema' | 'cliente'; registroId: string };

/**
 * Resposta da equipe -- pública (visível ao solicitante) ou nota interna. `autor` grava a
 * FK certa (autor_usuario_sistema_id ou autor_usuario_cliente_id) -- sem isso não dava pra
 * distinguir, em atendimento_mensagens, mensagem da equipe de mensagem do solicitante (os
 * dois usam tipo='publica'; autor_nome é texto livre, não serve de sinal confiável). Base
 * real do tempo de primeira resposta em vw_atendimento_sla (migration 150).
 */
export async function postMensagemAdmin(atendimentoId: string, autorNome: string, tipo: 'publica' | 'interna', texto: string, autor?: AutorEquipe): Promise<AtendimentosLoadState> {
  const client = getClient();
  if (client) {
    const { error } = await client.from('atendimento_mensagens').insert({
      atendimento_id: atendimentoId,
      tipo,
      autor_nome: autorNome,
      autor_usuario_sistema_id: autor?.kind === 'sistema' ? autor.registroId : null,
      autor_usuario_cliente_id: autor?.kind === 'cliente' ? autor.registroId : null,
      texto,
    });
    if (!error) return 'supabase';
  }

  const store = loadLocalStore();
  store.mensagens.push({
    id: `local-msg-${Date.now()}`,
    atendimento_id: atendimentoId,
    tipo,
    autor_nome: autorNome,
    texto,
    criado_em: new Date().toISOString(),
  });
  saveLocalStore(store);
  return 'local';
}

/** Muda o status e grava um evento de sistema na timeline, igual ao comportamento antigo do mock. */
export async function updateAtendimentoStatus(atendimentoId: string, statusAnterior: AtendimentoStatus, statusNovo: AtendimentoStatus): Promise<AtendimentosLoadState> {
  const client = getClient();
  const textoEvento = `Status alterado de "${statusAnterior}" para "${statusNovo}".`;

  if (client) {
    const { error } = await client
      .from('atendimentos')
      .update({ status: statusNovo, atualizado_em: new Date().toISOString() })
      .eq('id', atendimentoId);
    if (!error) {
      await client.from('atendimento_mensagens').insert({
        atendimento_id: atendimentoId,
        tipo: 'sistema',
        autor_nome: null,
        texto: textoEvento,
      });
      return 'supabase';
    }
  }

  const store = loadLocalStore();
  const now = new Date().toISOString();
  store.atendimentos = store.atendimentos.map((item) => item.id === atendimentoId ? { ...item, status: statusNovo, atualizado_em: now } : item);
  store.mensagens.push({ id: `local-msg-${Date.now()}-status`, atendimento_id: atendimentoId, tipo: 'sistema', autor_nome: null, texto: textoEvento, criado_em: now });
  saveLocalStore(store);
  return 'local';
}

export type AtendimentoSla = {
  atendimento_id: string;
  cliente_id: string;
  canal: string;
  status: AtendimentoStatus;
  prioridade: AtendimentoPrioridade;
  origem_portal: boolean;
  criado_em: string;
  resolvido_em: string | null;
  primeira_resposta_em: string | null;
  tempo_primeira_resposta_segundos: number | null;
  tempo_resolucao_segundos: number | null;
  tem_resposta: boolean;
  servico_id: string | null;
  servico_nome: string | null;
  meta_primeira_resposta_minutos: number | null;
  meta_resolucao_minutos: number | null;
  meta_horario_comercial: boolean | null;
  primeira_resposta_dentro_meta: boolean | null;
  resolucao_dentro_meta: boolean | null;
};

/**
 * Uma linha por atendimento com os tempos já calculados (vw_atendimento_sla, migration 150)
 * e a comparação com a meta configurada em Central de Atendimento > Serviços > SLA, quando o
 * atendimento tem servico_id vinculado (migration 151). Sem fallback local -- é uma view do
 * banco real, não faz sentido simular em localStorage.
 */
export async function listAtendimentoSla(clienteId: string): Promise<AtendimentoSla[]> {
  const client = getClient();
  if (!client) return [];
  const { data, error } = await client
    .from('vw_atendimento_sla')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('criado_em', { ascending: false });
  if (error) return [];
  return (data || []) as AtendimentoSla[];
}

export { formatProtocolo };
