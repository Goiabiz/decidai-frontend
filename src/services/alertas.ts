import { universoSupabase } from '../lib/supabase';

export type AlertStatus = 'Novo' | 'Em andamento' | 'Concluído';
export type AlertPrioridade = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export type AlertRecord = {
  id: string;
  descricao: string;
  status: AlertStatus;
  prioridade: AlertPrioridade;
  responsavel: string;
  canais: string[];
  mensagem: string;
  tarefas: number;
  duracaoHoras?: number;
  /** Contagem real de canais de disparo registrados (alert_delivery_channels) -- não é confirmação de entrega/leitura, isso ainda não existe no produto. */
  enviados: number;
};

export type AlertasLoadState = 'supabase' | 'local';

function getClient() {
  return universoSupabase;
}

const LOCAL_KEY = 'radar-sus-alertas-fallback';

function loadLocalStore(): AlertRecord[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as AlertRecord[]) : [];
  } catch {
    return [];
  }
}

function saveLocalStore(items: AlertRecord[]) {
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

export async function listAlertas(clienteId: string): Promise<{ items: AlertRecord[]; source: AlertasLoadState }> {
  const client = getClient();
  if (client) {
    const { data, error } = await client
      .from('alertas')
      .select('id, descricao, status, prioridade, responsavel, mensagem, tarefas_vinculadas, duracao_horas')
      .eq('cliente_id', clienteId)
      .is('excluido_em', null)
      .order('criado_em', { ascending: false });
    if (!error) {
      const alertaIds = (data || []).map((row) => row.id);
      const canaisPorAlerta = new Map<string, string[]>();
      const contagemPorAlerta = new Map<string, number>();
      if (alertaIds.length > 0) {
        const { data: entregas } = await client
          .from('alert_delivery_channels')
          .select('alert_id, canal_codigo')
          .in('alert_id', alertaIds);
        for (const entrega of entregas || []) {
          const id = entrega.alert_id as string;
          contagemPorAlerta.set(id, (contagemPorAlerta.get(id) || 0) + 1);
          if (entrega.canal_codigo) {
            const lista = canaisPorAlerta.get(id) || [];
            lista.push(entrega.canal_codigo);
            canaisPorAlerta.set(id, lista);
          }
        }
      }
      return {
        items: (data || []).map((row) => ({
          id: row.id,
          descricao: row.descricao,
          status: row.status as AlertStatus,
          prioridade: row.prioridade as AlertPrioridade,
          responsavel: row.responsavel || '',
          canais: canaisPorAlerta.get(row.id) || [],
          mensagem: row.mensagem,
          tarefas: row.tarefas_vinculadas,
          duracaoHoras: row.duracao_horas ?? undefined,
          enviados: contagemPorAlerta.get(row.id) || 0,
        })),
        source: 'supabase',
      };
    }
  }
  return { items: loadLocalStore(), source: 'local' };
}

export type NovoAlertaInput = {
  clienteId: string;
  descricao: string;
  status: AlertStatus;
  prioridade: AlertPrioridade;
  responsavel: string;
  canais: string[];
  mensagem: string;
  duracaoHoras?: number;
};

export async function createAlerta(input: NovoAlertaInput): Promise<{ item: AlertRecord; source: AlertasLoadState }> {
  const client = getClient();
  if (client) {
    const { data, error } = await client
      .from('alertas')
      .insert({
        cliente_id: input.clienteId,
        descricao: input.descricao,
        status: input.status,
        prioridade: input.prioridade,
        responsavel: input.responsavel || null,
        mensagem: input.mensagem,
        duracao_horas: input.duracaoHoras ?? null,
      })
      .select('id, descricao, status, prioridade, responsavel, mensagem, tarefas_vinculadas, duracao_horas')
      .single();
    if (!error && data) {
      if (input.canais.length > 0) {
        await client.from('alert_delivery_channels').insert(
          input.canais.map((canalCodigo) => ({ alert_id: data.id, canal_codigo: canalCodigo, delivery_status: 'pending' })),
        );
      }
      return {
        item: {
          id: data.id,
          descricao: data.descricao,
          status: data.status as AlertStatus,
          prioridade: data.prioridade as AlertPrioridade,
          responsavel: data.responsavel || '',
          canais: input.canais,
          mensagem: data.mensagem,
          tarefas: data.tarefas_vinculadas,
          duracaoHoras: data.duracao_horas ?? undefined,
          enviados: input.canais.length,
        },
        source: 'supabase',
      };
    }
  }

  const store = loadLocalStore();
  const item: AlertRecord = {
    id: `local-${Date.now()}`,
    descricao: input.descricao,
    status: input.status,
    prioridade: input.prioridade,
    responsavel: input.responsavel,
    canais: input.canais,
    mensagem: input.mensagem,
    tarefas: 0,
    duracaoHoras: input.duracaoHoras,
    enviados: input.canais.length,
  };
  store.unshift(item);
  saveLocalStore(store);
  return { item, source: 'local' };
}
