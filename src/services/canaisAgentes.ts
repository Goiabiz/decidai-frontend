import { universoSupabase } from '../lib/supabase';

export type ChannelRecord = {
  id: string;
  nome: string;
  tipo: string;
  providerCode: string;
  providerName: string;
  fila: string;
  sla: string;
  status: string;
};

export type AgentRecord = {
  id: string;
  name: string;
  purpose: string;
  status: string;
  flows: string;
  usage: string;
  providers: string;
  prompt: string;
};

export type ChannelType = { id: string; code: string; name: string };

export type CanaisAgentesLoadState = 'supabase' | 'local';

function getClient() {
  return universoSupabase;
}

const LOCAL_KEY = 'radar-sus-canais-agentes-fallback';

// Espelha o seed de platform_channels (032_canais_agentes_grava_dados_reais.sql) para o
// dropdown de Tipo continuar funcionando mesmo em modo local/fallback.
const FALLBACK_CHANNEL_TYPES: ChannelType[] = [
  { id: 'local-mensageria', code: 'mensageria', name: 'Mensageria' },
  { id: 'local-canal_proprio', code: 'canal_proprio', name: 'Canal próprio' },
  { id: 'local-assincrono', code: 'assincrono', name: 'Assíncrono' },
  { id: 'local-formulario', code: 'formulario', name: 'Formulário' },
  { id: 'local-api_externa', code: 'api_externa', name: 'API externa' },
];

type LocalStore = { channels: ChannelRecord[]; agents: AgentRecord[] };

function loadLocalStore(): LocalStore {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return { channels: [], agents: [] };
    return JSON.parse(raw) as LocalStore;
  } catch {
    return { channels: [], agents: [] };
  }
}

function saveLocalStore(store: LocalStore) {
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(store));
}

function localId(prefix: string) {
  return `${prefix}-local-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// ---------------------------------------------------------------------------
// Catálogo de tipos de canal (platform_channels)
// ---------------------------------------------------------------------------

export async function listChannelTypes(): Promise<{ items: ChannelType[]; source: CanaisAgentesLoadState }> {
  const client = getClient();
  if (client) {
    const { data, error } = await client.from('platform_channels').select('id, code, name').order('name', { ascending: true });
    if (!error && data && data.length > 0) {
      return { items: data as ChannelType[], source: 'supabase' };
    }
  }
  return { items: FALLBACK_CHANNEL_TYPES, source: 'local' };
}

// ---------------------------------------------------------------------------
// Canais (client_channels)
// ---------------------------------------------------------------------------

type ChannelConfiguration = { tipo: string; providerCode: string; providerName: string; fila: string; sla: string };

function mapChannelRow(row: { id: string; display_name: string | null; status: string; configuration: unknown; platform_channels?: { name: string } | null }): ChannelRecord {
  const config = (row.configuration || {}) as Partial<ChannelConfiguration>;
  return {
    id: row.id,
    nome: row.display_name || '',
    tipo: row.platform_channels?.name || config.tipo || '',
    providerCode: config.providerCode || '',
    providerName: config.providerName || '',
    fila: config.fila || '',
    sla: config.sla || '',
    status: row.status,
  };
}

export async function listChannels(clienteId: string): Promise<{ items: ChannelRecord[]; source: CanaisAgentesLoadState }> {
  const client = getClient();
  if (client) {
    const { data, error } = await client
      .from('client_channels')
      .select('id, display_name, status, configuration, platform_channels(name)')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });
    if (!error) {
      return { items: (data || []).map((row) => mapChannelRow(row as unknown as Parameters<typeof mapChannelRow>[0])), source: 'supabase' };
    }
  }
  const store = loadLocalStore();
  return { items: store.channels, source: 'local' };
}

type ChannelInput = { nome: string; tipo: string; providerCode: string; providerName: string; fila: string; sla: string; status: string };

async function resolveChannelTypeId(client: NonNullable<ReturnType<typeof getClient>>, tipoNome: string): Promise<string | null> {
  const { data } = await client.from('platform_channels').select('id').eq('name', tipoNome).maybeSingle();
  return data?.id || null;
}

export async function createChannel(clienteId: string, input: ChannelInput): Promise<{ item: ChannelRecord; source: CanaisAgentesLoadState }> {
  const client = getClient();
  if (client) {
    const channelId = await resolveChannelTypeId(client, input.tipo);
    if (channelId) {
      const configuration: ChannelConfiguration = { tipo: input.tipo, providerCode: input.providerCode, providerName: input.providerName, fila: input.fila, sla: input.sla };
      const { data, error } = await client
        .from('client_channels')
        .insert({ cliente_id: clienteId, channel_id: channelId, display_name: input.nome, status: input.status, configuration })
        .select('id, display_name, status, configuration, platform_channels(name)')
        .single();
      if (!error && data) {
        return { item: mapChannelRow(data as unknown as Parameters<typeof mapChannelRow>[0]), source: 'supabase' };
      }
    }
  }
  const store = loadLocalStore();
  const item: ChannelRecord = { id: localId('canal'), ...input };
  store.channels.unshift(item);
  saveLocalStore(store);
  return { item, source: 'local' };
}

export async function updateChannel(clienteId: string, id: string, input: ChannelInput): Promise<{ item: ChannelRecord; source: CanaisAgentesLoadState }> {
  const client = getClient();
  if (client && !id.startsWith('canal-local-')) {
    const channelId = await resolveChannelTypeId(client, input.tipo);
    if (channelId) {
      const configuration: ChannelConfiguration = { tipo: input.tipo, providerCode: input.providerCode, providerName: input.providerName, fila: input.fila, sla: input.sla };
      const { data, error } = await client
        .from('client_channels')
        .update({ channel_id: channelId, display_name: input.nome, status: input.status, configuration })
        .eq('id', id)
        .eq('cliente_id', clienteId)
        .select('id, display_name, status, configuration, platform_channels(name)')
        .single();
      if (!error && data) {
        return { item: mapChannelRow(data as unknown as Parameters<typeof mapChannelRow>[0]), source: 'supabase' };
      }
    }
  }
  const store = loadLocalStore();
  const item: ChannelRecord = { id, ...input };
  store.channels = store.channels.map((row) => (row.id === id ? item : row));
  saveLocalStore(store);
  return { item, source: 'local' };
}

// ---------------------------------------------------------------------------
// Agentes (client_agents)
// ---------------------------------------------------------------------------

type AgentConfig = { flows: string; usage: string; providers: string; prompt: string };

function mapAgentRow(row: { id: string; name: string; description: string | null; status: string; config: unknown }): AgentRecord {
  const config = (row.config || {}) as Partial<AgentConfig>;
  return {
    id: row.id,
    name: row.name,
    purpose: row.description || '',
    status: row.status,
    flows: config.flows || '',
    usage: config.usage || '',
    providers: config.providers || '',
    prompt: config.prompt || '',
  };
}

export async function listAgents(clienteId: string): Promise<{ items: AgentRecord[]; source: CanaisAgentesLoadState }> {
  const client = getClient();
  if (client) {
    const { data, error } = await client
      .from('client_agents')
      .select('id, name, description, status, config')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });
    if (!error) {
      return { items: (data || []).map((row) => mapAgentRow(row)), source: 'supabase' };
    }
  }
  const store = loadLocalStore();
  return { items: store.agents, source: 'local' };
}

type AgentInput = { name: string; purpose: string; status: string; flows: string; usage: string; providers: string; prompt: string };

export async function createAgent(clienteId: string, input: AgentInput): Promise<{ item: AgentRecord; source: CanaisAgentesLoadState }> {
  const client = getClient();
  if (client) {
    const config: AgentConfig = { flows: input.flows, usage: input.usage, providers: input.providers, prompt: input.prompt };
    const { data, error } = await client
      .from('client_agents')
      .insert({ cliente_id: clienteId, name: input.name, description: input.purpose, status: input.status, config })
      .select('id, name, description, status, config')
      .single();
    if (!error && data) {
      return { item: mapAgentRow(data), source: 'supabase' };
    }
  }
  const store = loadLocalStore();
  const item: AgentRecord = { id: localId('agente'), ...input };
  store.agents.unshift(item);
  saveLocalStore(store);
  return { item, source: 'local' };
}

export async function updateAgent(clienteId: string, id: string, input: AgentInput): Promise<{ item: AgentRecord; source: CanaisAgentesLoadState }> {
  const client = getClient();
  if (client && !id.startsWith('agente-local-')) {
    const config: AgentConfig = { flows: input.flows, usage: input.usage, providers: input.providers, prompt: input.prompt };
    const { data, error } = await client
      .from('client_agents')
      .update({ name: input.name, description: input.purpose, status: input.status, config })
      .eq('id', id)
      .eq('cliente_id', clienteId)
      .select('id, name, description, status, config')
      .single();
    if (!error && data) {
      return { item: mapAgentRow(data), source: 'supabase' };
    }
  }
  const store = loadLocalStore();
  const item: AgentRecord = { id, ...input };
  store.agents = store.agents.map((row) => (row.id === id ? item : row));
  saveLocalStore(store);
  return { item, source: 'local' };
}
