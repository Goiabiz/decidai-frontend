import { universoSupabase } from '../lib/supabase';

/** Canal do Unified Inbox que esta linha representa, se for o caso -- não confundir com `tipo`
 * (categoria ampla de platform_channels: Mensageria/Canal próprio/etc). Vazio/undefined =
 * canal manual/genérico, sem ingestão automática. */
export type UnifiedInboxCanal = 'WhatsApp' | 'Telegram' | 'Instagram' | 'Messenger' | 'SMS';

export const UNIFIED_INBOX_CANAIS: UnifiedInboxCanal[] = ['WhatsApp', 'Telegram', 'Instagram', 'Messenger', 'SMS'];

/** Telegram não precisa de ID de roteamento -- cada bot tem webhook próprio, já identifica o
 * tenant pela URL. Os outros 3 usam webhook centralizado da plataforma (Meta/Twilio) e
 * precisam de um ID que vem no payload pra saber de qual tenant é a mensagem. */
export function canalPrecisaDeRoteamento(canal: UnifiedInboxCanal | ''): boolean {
  return canal === 'WhatsApp' || canal === 'Instagram' || canal === 'Messenger' || canal === 'SMS';
}

export type ChannelRecord = {
  id: string;
  nome: string;
  tipo: string;
  providerCode: string;
  providerName: string;
  fila: string;
  sla: string;
  status: string;
  canalInbox: UnifiedInboxCanal | '';
  roteamentoExterno: string;
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
  /** Ícone do agente (coluna real `avatar_url`, não `config`) -- um por agente, vale pra todos
   * os usuários finais desse cliente que falarem com ele (mesmo espírito do avatar de usuário,
   * mas aqui é 1 imagem representando o agente, não uma pessoa). */
  avatarUrl: string;
  /** Cor de fundo do ícone (coluna real `color`, hex "#RRGGBB") -- a imagem de `avatarUrl` fica
   * por cima dessa cor (`object-fit: contain`, não `cover`), estilo avatar do Discord: dá pra
   * subir uma imagem com fundo transparente e escolher a cor por trás dela. */
  color: string;
  /** Tom de voz -- descrição livre (coluna real `voice_tone`), ex.: "voz feminina e suave,
   * tom acolhedor". Já era lido pelo runtime (client-agent-identity.ts) mas a tela nunca
   * deixava editar. */
  voiceTone: string;
  /** Voz do TTS -- ID real da OpenAI (nova/shimmer/alloy/echo/fable/onyx), gravado em
   * `config.ttsVoice`. Sobrepõe a voz global só na conversa deste agente (voice-tts.ts). */
  ttsVoice: string;
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

type ChannelConfiguration = {
  tipo: string; providerCode: string; providerName: string; fila: string; sla: string;
  /** Presente só quando canalInbox === 'WhatsApp' -- nome de campo fixado pelo webhook
   * WhatsApp já existente (fn_resolve_tenant_by_whatsapp_phone_number_id), não mexer. */
  whatsappPhoneNumberId?: string;
  /** Presente pros outros 3 canais do Unified Inbox (Telegram/Instagram/Messenger/SMS) --
   * lido por fn_resolve_tenant_by_channel_external_id. Telegram não usa externalRoutingId
   * (webhook próprio por bot), só grava `canal` pra exibição/consistência. */
  canal?: UnifiedInboxCanal;
  externalRoutingId?: string;
};

function mapChannelRow(row: { id: string; display_name: string | null; status: string; configuration: unknown; platform_channels?: { name: string } | null }): ChannelRecord {
  const config = (row.configuration || {}) as Partial<ChannelConfiguration>;
  const canalInbox = config.canal || (config.whatsappPhoneNumberId ? 'WhatsApp' : '');
  return {
    id: row.id,
    nome: row.display_name || '',
    tipo: row.platform_channels?.name || config.tipo || '',
    providerCode: config.providerCode || '',
    providerName: config.providerName || '',
    fila: config.fila || '',
    sla: config.sla || '',
    status: row.status,
    canalInbox: canalInbox as UnifiedInboxCanal | '',
    roteamentoExterno: config.whatsappPhoneNumberId || config.externalRoutingId || '',
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

type ChannelInput = {
  nome: string; tipo: string; providerCode: string; providerName: string; fila: string; sla: string; status: string;
  canalInbox: UnifiedInboxCanal | '';
  roteamentoExterno: string;
};

async function resolveChannelTypeId(client: NonNullable<ReturnType<typeof getClient>>, tipoNome: string): Promise<string | null> {
  const { data } = await client.from('platform_channels').select('id').eq('name', tipoNome).maybeSingle();
  return data?.id || null;
}

function buildInboxConfig(canalInbox: UnifiedInboxCanal | '', roteamentoExterno: string): Pick<ChannelConfiguration, 'whatsappPhoneNumberId' | 'canal' | 'externalRoutingId'> {
  if (canalInbox === 'WhatsApp') return { whatsappPhoneNumberId: roteamentoExterno.trim() || undefined };
  if (canalInbox === 'Telegram') return { canal: 'Telegram' };
  if (canalInbox === 'Instagram' || canalInbox === 'Messenger' || canalInbox === 'SMS') {
    return { canal: canalInbox, externalRoutingId: roteamentoExterno.trim() || undefined };
  }
  return {};
}

export async function createChannel(clienteId: string, input: ChannelInput): Promise<{ item: ChannelRecord; source: CanaisAgentesLoadState }> {
  const client = getClient();
  if (client) {
    const channelId = await resolveChannelTypeId(client, input.tipo);
    if (channelId) {
      const configuration: ChannelConfiguration = {
        tipo: input.tipo, providerCode: input.providerCode, providerName: input.providerName, fila: input.fila, sla: input.sla,
        ...buildInboxConfig(input.canalInbox, input.roteamentoExterno),
      };
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
      const configuration: ChannelConfiguration = {
        tipo: input.tipo, providerCode: input.providerCode, providerName: input.providerName, fila: input.fila, sla: input.sla,
        ...buildInboxConfig(input.canalInbox, input.roteamentoExterno),
      };
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

type AgentConfig = { flows: string; usage: string; providers: string; prompt: string; ttsVoice?: string };

const AGENT_SELECT = 'id, name, description, status, config, avatar_url, color, voice_tone';

function mapAgentRow(row: { id: string; name: string; description: string | null; status: string; config: unknown; avatar_url: string | null; color: string | null; voice_tone: string | null }): AgentRecord {
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
    avatarUrl: row.avatar_url || '',
    color: row.color || '',
    voiceTone: row.voice_tone || '',
    ttsVoice: config.ttsVoice || '',
  };
}

/** Agente de cliente ativado (status='ativo', escrito de verdade por Agentes.tsx ao clicar
 * "Ativar agente") -- usado pelo App.tsx pra decidir se mostra o ícone dele GLOBALMENTE, em
 * qualquer tela, pra qualquer usuário do ambiente (não só enquanto alguém está na tela
 * Agentes -- pedido direto do usuário, "isso não é funcional" testando ao vivo). */
export async function getActiveClientAgent(clienteId: string): Promise<AgentRecord | null> {
  const client = getClient();
  if (!client) return null;
  const { data, error } = await client
    .from('client_agents')
    .select(AGENT_SELECT)
    .eq('cliente_id', clienteId)
    .eq('status', 'ativo')
    // Defesa em profundidade: deleteAgent() já tira o agente de 'ativo', mas se algum caminho
    // futuro marcar só `deleted_at`, o ícone global não pode continuar no ar por causa disso.
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return mapAgentRow(data);
}

/** Agente que REALMENTE vai responder numa conversa com `mode='usuario-cliente'`.
 *
 * Diferente de `getActiveClientAgent` de propósito, e a diferença importa: o backend
 * (`resolveActiveClientAgent`, client-agent-identity.ts) resolve o agente do tenant **sem
 * filtrar por `status`** -- pega o mais recente não-excluído. `status='ativo'` gate só o ÍCONE
 * GLOBAL na plataforma, não quem responde.
 *
 * Usar a função errada aqui criava um descompasso real: a tela de chat mostrava "Agente"
 * genérico no cabeçalho enquanto a SUSi (desativada, mas ainda cadastrada) era quem de fato
 * respondia. Esta função espelha a regra do backend pra o cabeçalho nunca mentir sobre com
 * quem a pessoa está falando. */
export async function getClientAgentThatAnswers(clienteId: string): Promise<AgentRecord | null> {
  const client = getClient();
  if (!client) return null;
  const { data, error } = await client
    .from('client_agents')
    .select(AGENT_SELECT)
    .eq('cliente_id', clienteId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return mapAgentRow(data);
}

/** Excluir agente -- exclusão LÓGICA (`deleted_at`), decisão do usuário registrada em
 * `design-excluir-agente-v1.md`.
 *
 * Por que lógica e não física: exclusão física dispararia `SET NULL` em `agent_usage_events`
 * (consumo faturável), `agent_audit_events` e `agent_conversations`. As linhas sobreviveriam,
 * mas perderiam **para sempre** qual agente atendeu -- perda irreversível justamente em
 * auditoria e cobrança. A coluna `deleted_at` já existia e o runtime já a respeita
 * (`resolveActiveClientAgent` no backend filtra por ela), então isto não precisou de migration.
 *
 * As duas limpezas manuais abaixo existem porque **`ON DELETE CASCADE` só dispara em exclusão
 * física**. Na lógica, sem elas, sobraria um agente fantasma: invisível na tela, mas ainda
 * sendo o agente padrão de canais e ainda com roteamento ativo apontando pra ele. */
export async function deleteAgent(clienteId: string, agentId: string): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  const { error } = await client
    .from('client_agents')
    // Sai de 'ativo' junto: o ícone global na plataforma é montado a partir do status, então
    // marcar só `deleted_at` deixaria o ícone no ar até alguém recarregar.
    .update({ deleted_at: new Date().toISOString(), status: 'excluido' })
    .eq('id', agentId)
    .eq('cliente_id', clienteId);

  if (error) return false;

  // Canais que tinham este agente como padrão ficariam apontando pra um agente que não existe
  // mais na tela. Erro aqui não desfaz a exclusão -- o agente já saiu do ar, que é o essencial;
  // o vínculo órfão é inerte (o agente nunca mais é resolvido).
  await client.from('client_channels').update({ default_agent_id: null }).eq('cliente_id', clienteId).eq('default_agent_id', agentId);

  // Roteamento por canal não pode sobreviver à exclusão -- mensagem não deve cair num agente
  // excluído.
  await client.from('agent_channel_bindings').delete().eq('agent_id', agentId);

  return true;
}

export async function listAgents(clienteId: string): Promise<{ items: AgentRecord[]; source: CanaisAgentesLoadState }> {
  const client = getClient();
  if (client) {
    const { data, error } = await client
      .from('client_agents')
      .select(AGENT_SELECT)
      .eq('cliente_id', clienteId)
      // Agente excluído (exclusão lógica) não pode reaparecer na lista -- ver deleteAgent().
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (!error) {
      return { items: (data || []).map((row) => mapAgentRow(row)), source: 'supabase' };
    }
  }
  const store = loadLocalStore();
  return { items: store.agents, source: 'local' };
}

type AgentInput = { name: string; purpose: string; status: string; flows: string; usage: string; providers: string; prompt: string; avatarUrl: string; color: string; voiceTone: string; ttsVoice: string };

export async function createAgent(clienteId: string, input: AgentInput): Promise<{ item: AgentRecord; source: CanaisAgentesLoadState }> {
  const client = getClient();
  if (client) {
    const config: AgentConfig = { flows: input.flows, usage: input.usage, providers: input.providers, prompt: input.prompt, ttsVoice: input.ttsVoice };
    const { data, error } = await client
      .from('client_agents')
      .insert({ cliente_id: clienteId, name: input.name, description: input.purpose, status: input.status, config, avatar_url: input.avatarUrl || null, color: input.color || null, voice_tone: input.voiceTone || null })
      .select(AGENT_SELECT)
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
    const config: AgentConfig = { flows: input.flows, usage: input.usage, providers: input.providers, prompt: input.prompt, ttsVoice: input.ttsVoice };
    const { data, error } = await client
      .from('client_agents')
      .update({ name: input.name, description: input.purpose, status: input.status, config, avatar_url: input.avatarUrl || null, color: input.color || null, voice_tone: input.voiceTone || null })
      .eq('id', id)
      .eq('cliente_id', clienteId)
      .select(AGENT_SELECT)
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
