import { universoSupabase } from '../lib/supabase';
import type { Fluxo } from '../types/workflow';
import type { StatusCategory } from '../lib/statusCategory';

export type ItemStatus = 'Ativo' | 'Em análise' | 'Pendente';
export const prioridades = ['Crítica', 'Alta', 'Média', 'Baixa'] as const;
export type Prioridade = typeof prioridades[number];

export type ServicoRecord = { id: string; nome: string; descricao: string; status: ItemStatus };
export type FilaRecord = { id: string; servicoId: string; nome: string; responsavel: string; capacidade: string; status: ItemStatus };
export type GrupoFilaRecord = { id: string; nome: string; filaIds: string[]; transferenciaLivre: boolean; status: ItemStatus };
export type FluxoRecord = { id: string; nome: string; fluxo: Fluxo; status: ItemStatus };
export type SlaRecord = {
  id: string;
  servicoId: string;
  prioridade: Prioridade;
  prazoHoras: string;
  calendario: '24x7' | 'comercial';
  pausarEm: StatusCategory[];
  manterPrazo: boolean;
  status: ItemStatus;
};

export type ServicosFilasLoadState = 'supabase' | 'local';

function getClient() {
  return universoSupabase;
}

function slugCode(nome: string, fallback: string) {
  // NFD decompõe acentos em letra+marca separadas; o filtro [^a-z0-9] abaixo já
  // descarta as marcas de acento sozinho (não são a-z0-9), sem precisar de um
  // range unicode explícito na regex.
  const slug = nome.trim().toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return (slug || fallback).slice(0, 60);
}

const LOCAL_KEY = 'radar-sus-servicos-filas-fallback';

type LocalStore = {
  servicos: ServicoRecord[];
  filas: FilaRecord[];
  grupos: GrupoFilaRecord[];
  fluxos: FluxoRecord[];
  slas: SlaRecord[];
};

function loadLocalStore(): LocalStore {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return { servicos: [], filas: [], grupos: [], fluxos: [], slas: [] };
    return JSON.parse(raw) as LocalStore;
  } catch {
    return { servicos: [], filas: [], grupos: [], fluxos: [], slas: [] };
  }
}

function saveLocalStore(store: LocalStore) {
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(store));
}

function localId(prefix: string) {
  return `${prefix}-local-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// ---------------------------------------------------------------------------
// Serviços
// ---------------------------------------------------------------------------

export async function listServicos(clienteId: string): Promise<{ items: ServicoRecord[]; source: ServicosFilasLoadState }> {
  const client = getClient();
  if (client) {
    const { data, error } = await client
      .from('service_definitions')
      .select('id, name, description, status')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });
    if (!error) {
      return {
        items: (data || []).map((row) => ({ id: row.id, nome: row.name, descricao: row.description || '', status: row.status as ItemStatus })),
        source: 'supabase',
      };
    }
  }
  const store = loadLocalStore();
  return { items: store.servicos, source: 'local' };
}

export async function createServico(clienteId: string, input: { nome: string; descricao: string; status: ItemStatus }): Promise<{ item: ServicoRecord; source: ServicosFilasLoadState }> {
  const client = getClient();
  if (client) {
    const { data, error } = await client
      .from('service_definitions')
      .insert({ cliente_id: clienteId, code: slugCode(input.nome, `srv-${Date.now()}`), name: input.nome, description: input.descricao, status: input.status })
      .select('id, name, description, status')
      .single();
    if (!error && data) {
      return { item: { id: data.id, nome: data.name, descricao: data.description || '', status: data.status as ItemStatus }, source: 'supabase' };
    }
  }
  const store = loadLocalStore();
  const item: ServicoRecord = { id: localId('SRV'), nome: input.nome, descricao: input.descricao, status: input.status };
  store.servicos.unshift(item);
  saveLocalStore(store);
  return { item, source: 'local' };
}

// ---------------------------------------------------------------------------
// Filas
// ---------------------------------------------------------------------------

export async function listFilas(clienteId: string): Promise<{ items: FilaRecord[]; source: ServicosFilasLoadState }> {
  const client = getClient();
  if (client) {
    const { data, error } = await client
      .from('service_queues')
      .select('id, service_id, name, description, status, service_definitions!inner(cliente_id)')
      .eq('service_definitions.cliente_id', clienteId)
      .order('created_at', { ascending: false });
    if (!error) {
      return {
        items: (data || []).map((row) => ({
          id: row.id,
          servicoId: row.service_id,
          nome: row.name,
          responsavel: '',
          capacidade: row.description || '',
          status: row.status as ItemStatus,
        })),
        source: 'supabase',
      };
    }
  }
  const store = loadLocalStore();
  return { items: store.filas, source: 'local' };
}

export async function createFila(input: { servicoId: string; nome: string; responsavel: string; capacidade: string; status: ItemStatus }): Promise<{ item: FilaRecord; source: ServicosFilasLoadState }> {
  const client = getClient();
  if (client) {
    // responsavel não tem coluna própria em service_queues -- guardamos junto da capacidade em description por ora.
    const description = [input.capacidade, input.responsavel ? `Responsável: ${input.responsavel}` : ''].filter(Boolean).join(' · ');
    const { data, error } = await client
      .from('service_queues')
      .insert({ service_id: input.servicoId, code: slugCode(input.nome, `fil-${Date.now()}`), name: input.nome, description, status: input.status })
      .select('id, service_id, name, description, status')
      .single();
    if (!error && data) {
      return {
        item: { id: data.id, servicoId: data.service_id, nome: data.name, responsavel: input.responsavel, capacidade: input.capacidade, status: data.status as ItemStatus },
        source: 'supabase',
      };
    }
  }
  const store = loadLocalStore();
  const item: FilaRecord = { id: localId('FIL'), servicoId: input.servicoId, nome: input.nome, responsavel: input.responsavel, capacidade: input.capacidade, status: input.status };
  store.filas.unshift(item);
  saveLocalStore(store);
  return { item, source: 'local' };
}

// ---------------------------------------------------------------------------
// Grupos de filas
// ---------------------------------------------------------------------------

export async function listGrupos(clienteId: string): Promise<{ items: GrupoFilaRecord[]; source: ServicosFilasLoadState }> {
  const client = getClient();
  if (client) {
    const { data, error } = await client
      .from('service_queue_groups')
      .select('id, nome, transferencia_livre, status, service_queue_group_members(queue_id)')
      .eq('cliente_id', clienteId)
      .order('criado_em', { ascending: false });
    if (!error) {
      return {
        items: (data || []).map((row) => {
          const membros = (row as unknown as { service_queue_group_members?: { queue_id: string }[] }).service_queue_group_members || [];
          return {
            id: row.id,
            nome: row.nome,
            filaIds: membros.map((m) => m.queue_id),
            transferenciaLivre: row.transferencia_livre,
            status: row.status as ItemStatus,
          };
        }),
        source: 'supabase',
      };
    }
  }
  const store = loadLocalStore();
  return { items: store.grupos, source: 'local' };
}

export async function createGrupo(clienteId: string, input: { nome: string; filaIds: string[]; transferenciaLivre: boolean; status: ItemStatus }): Promise<{ item: GrupoFilaRecord; source: ServicosFilasLoadState }> {
  const client = getClient();
  if (client) {
    const { data, error } = await client
      .from('service_queue_groups')
      .insert({ cliente_id: clienteId, nome: input.nome, transferencia_livre: input.transferenciaLivre, status: input.status })
      .select('id, nome, transferencia_livre, status')
      .single();
    if (!error && data) {
      if (input.filaIds.length > 0) {
        await client.from('service_queue_group_members').insert(input.filaIds.map((queueId) => ({ group_id: data.id, queue_id: queueId })));
      }
      return {
        item: { id: data.id, nome: data.nome, filaIds: input.filaIds, transferenciaLivre: data.transferencia_livre, status: data.status as ItemStatus },
        source: 'supabase',
      };
    }
  }
  const store = loadLocalStore();
  const item: GrupoFilaRecord = { id: localId('GRP'), nome: input.nome, filaIds: input.filaIds, transferenciaLivre: input.transferenciaLivre, status: input.status };
  store.grupos.unshift(item);
  saveLocalStore(store);
  return { item, source: 'local' };
}

// ---------------------------------------------------------------------------
// Fluxos
// ---------------------------------------------------------------------------

export async function listFluxos(clienteId: string): Promise<{ items: FluxoRecord[]; source: ServicosFilasLoadState }> {
  const client = getClient();
  if (client) {
    const { data, error } = await client
      .from('service_flow_definitions')
      .select('id, nome, fluxo, status')
      .eq('cliente_id', clienteId)
      .order('criado_em', { ascending: false });
    if (!error) {
      return { items: (data || []).map((row) => ({ id: row.id, nome: row.nome, fluxo: row.fluxo as Fluxo, status: row.status as ItemStatus })), source: 'supabase' };
    }
  }
  const store = loadLocalStore();
  return { items: store.fluxos, source: 'local' };
}

export async function createFluxo(clienteId: string, input: { nome: string; fluxo: Fluxo; status: ItemStatus }): Promise<{ item: FluxoRecord; source: ServicosFilasLoadState }> {
  const client = getClient();
  if (client) {
    const { data, error } = await client
      .from('service_flow_definitions')
      .insert({ cliente_id: clienteId, nome: input.nome, fluxo: input.fluxo, status: input.status })
      .select('id, nome, fluxo, status')
      .single();
    if (!error && data) {
      return { item: { id: data.id, nome: data.nome, fluxo: data.fluxo as Fluxo, status: data.status as ItemStatus }, source: 'supabase' };
    }
  }
  const store = loadLocalStore();
  const item: FluxoRecord = { id: localId('FLX'), nome: input.nome, fluxo: input.fluxo, status: input.status };
  store.fluxos.unshift(item);
  saveLocalStore(store);
  return { item, source: 'local' };
}

// ---------------------------------------------------------------------------
// SLA
// ---------------------------------------------------------------------------

function minutesToHoursLabel(minutes: number) {
  return String(Math.round(minutes / 60));
}

export async function listSlas(clienteId: string): Promise<{ items: SlaRecord[]; source: ServicosFilasLoadState }> {
  const client = getClient();
  if (client) {
    const { data, error } = await client
      .from('service_sla_rules')
      .select('id, service_id, priority, resolution_minutes, business_hours_only, pausar_em, manter_prazo_carry_over, status, service_definitions!inner(cliente_id)')
      .eq('service_definitions.cliente_id', clienteId);
    if (!error) {
      const items = (data || []).map((row) => ({
        id: row.id,
        servicoId: row.service_id,
        prioridade: row.priority as Prioridade,
        prazoHoras: minutesToHoursLabel(row.resolution_minutes),
        calendario: (row.business_hours_only ? 'comercial' : '24x7') as 'comercial' | '24x7',
        pausarEm: (row.pausar_em || []) as StatusCategory[],
        manterPrazo: row.manter_prazo_carry_over,
        status: row.status as ItemStatus,
      }));
      return { items, source: 'supabase' };
    }
  }
  const store = loadLocalStore();
  return { items: store.slas, source: 'local' };
}

export async function createSla(input: { servicoId: string; prioridade: Prioridade; prazoHoras: string; calendario: '24x7' | 'comercial'; pausarEm: StatusCategory[]; manterPrazo: boolean; status: ItemStatus }): Promise<{ item: SlaRecord; source: ServicosFilasLoadState }> {
  const client = getClient();
  const minutos = Math.max(0, Math.round(Number(input.prazoHoras) * 60)) || 0;
  if (client) {
    const { data, error } = await client
      .from('service_sla_rules')
      .insert({
        service_id: input.servicoId,
        priority: input.prioridade,
        first_response_minutes: minutos,
        resolution_minutes: minutos,
        business_hours_only: input.calendario === 'comercial',
        pausar_em: input.pausarEm,
        manter_prazo_carry_over: input.manterPrazo,
        status: input.status,
      })
      .select('id, service_id, priority, resolution_minutes, business_hours_only, pausar_em, manter_prazo_carry_over, status')
      .single();
    if (!error && data) {
      return {
        item: {
          id: data.id,
          servicoId: data.service_id,
          prioridade: data.priority as Prioridade,
          prazoHoras: minutesToHoursLabel(data.resolution_minutes),
          calendario: data.business_hours_only ? 'comercial' : '24x7',
          pausarEm: (data.pausar_em || []) as StatusCategory[],
          manterPrazo: data.manter_prazo_carry_over,
          status: data.status as ItemStatus,
        },
        source: 'supabase',
      };
    }
  }
  const store = loadLocalStore();
  const item: SlaRecord = { id: localId('SLA'), servicoId: input.servicoId, prioridade: input.prioridade, prazoHoras: input.prazoHoras, calendario: input.calendario, pausarEm: input.pausarEm, manterPrazo: input.manterPrazo, status: input.status };
  store.slas.push(item);
  saveLocalStore(store);
  return { item, source: 'local' };
}
