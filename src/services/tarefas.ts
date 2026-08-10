import { universoSupabase } from '../lib/supabase';
import type { StatusCategory } from '../lib/statusCategory';

export type Prioridade = 'Baixa' | 'Média' | 'Alta' | 'Crítico';

export type TaskRecord = {
  id: string;
  descricao: string;
  origem: string;
  categoria: StatusCategory;
  prioridade: Prioridade;
  responsavel: string;
  prazo: string;
};

export type TarefasLoadState = 'supabase' | 'local';

function getClient() {
  return universoSupabase;
}

const LOCAL_KEY = 'radar-sus-tarefas-fallback';

function loadLocalStore(): TaskRecord[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as TaskRecord[]) : [];
  } catch {
    return [];
  }
}

function saveLocalStore(items: TaskRecord[]) {
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

function localId() {
  return `tarefa-local-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function mapRow(row: { id: string; descricao: string; origem: string; categoria: string; prioridade: string; responsavel: string | null; prazo: string | null }): TaskRecord {
  return {
    id: row.id,
    descricao: row.descricao,
    origem: row.origem,
    categoria: row.categoria as StatusCategory,
    prioridade: row.prioridade as Prioridade,
    responsavel: row.responsavel || '',
    prazo: row.prazo || '',
  };
}

export async function listTasks(clienteId: string): Promise<{ items: TaskRecord[]; source: TarefasLoadState }> {
  const client = getClient();
  if (client) {
    const { data, error } = await client
      .from('client_tasks')
      .select('id, descricao, origem, categoria, prioridade, responsavel, prazo')
      .eq('cliente_id', clienteId)
      .is('excluido_em', null)
      .order('criado_em', { ascending: false });
    if (!error) {
      return { items: (data || []).map(mapRow), source: 'supabase' };
    }
  }
  return { items: loadLocalStore(), source: 'local' };
}

export async function createTask(clienteId: string, input: { descricao: string; origem: string; responsavel: string; prazo: string }): Promise<{ item: TaskRecord; source: TarefasLoadState }> {
  const client = getClient();
  if (client) {
    const { data, error } = await client
      .from('client_tasks')
      .insert({ cliente_id: clienteId, descricao: input.descricao, origem: input.origem, responsavel: input.responsavel || null, prazo: input.prazo || null, categoria: 'novo', prioridade: 'Média' })
      .select('id, descricao, origem, categoria, prioridade, responsavel, prazo')
      .single();
    if (!error && data) {
      return { item: mapRow(data), source: 'supabase' };
    }
  }
  const items = loadLocalStore();
  const item: TaskRecord = { id: localId(), descricao: input.descricao, origem: input.origem, categoria: 'novo', prioridade: 'Média', responsavel: input.responsavel, prazo: input.prazo };
  items.unshift(item);
  saveLocalStore(items);
  return { item, source: 'local' };
}

export async function updateTask(clienteId: string, id: string, input: { descricao: string; origem: string; responsavel: string; prazo: string }): Promise<{ source: TarefasLoadState }> {
  const client = getClient();
  if (client && !id.startsWith('tarefa-local-')) {
    const { error } = await client
      .from('client_tasks')
      .update({ descricao: input.descricao, origem: input.origem, responsavel: input.responsavel || null, prazo: input.prazo || null })
      .eq('id', id)
      .eq('cliente_id', clienteId);
    if (!error) return { source: 'supabase' };
  }
  const items = loadLocalStore().map((item) => (item.id === id ? { ...item, ...input } : item));
  saveLocalStore(items);
  return { source: 'local' };
}

export async function updateTaskCategoria(clienteId: string, id: string, categoria: StatusCategory): Promise<{ source: TarefasLoadState }> {
  const client = getClient();
  if (client && !id.startsWith('tarefa-local-')) {
    const { error } = await client.from('client_tasks').update({ categoria }).eq('id', id).eq('cliente_id', clienteId);
    if (!error) return { source: 'supabase' };
  }
  const items = loadLocalStore().map((item) => (item.id === id ? { ...item, categoria } : item));
  saveLocalStore(items);
  return { source: 'local' };
}

export async function deleteTask(clienteId: string, id: string): Promise<{ source: TarefasLoadState }> {
  const client = getClient();
  if (client && !id.startsWith('tarefa-local-')) {
    const { error } = await client.from('client_tasks').update({ excluido_em: new Date().toISOString() }).eq('id', id).eq('cliente_id', clienteId);
    if (!error) return { source: 'supabase' };
  }
  const items = loadLocalStore().filter((item) => item.id !== id);
  saveLocalStore(items);
  return { source: 'local' };
}
