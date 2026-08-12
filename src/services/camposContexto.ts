import { universoSupabase } from '../lib/supabase';

export type CampoOrigem = 'Manual' | 'Sistema' | 'Fórmula' | 'Integração/API';
export type CampoStatus = 'Ativo' | 'Inativo';

export type CampoContextoRecord = {
  id: string;
  nome: string;
  descricao: string;
  tipo: string;
  origem: CampoOrigem;
  status: CampoStatus;
  integracao?: string;
  endpoint?: string;
  campoExterno?: string;
  sensivel: boolean;
  usarTela: boolean;
  usarAlerta: boolean;
  usarRelatorio: boolean;
  usarAgente: boolean;
};

export type CampoContextoInput = Omit<CampoContextoRecord, 'id'>;

const SELECT = 'id, nome, descricao, tipo, origem, status, integracao, endpoint, campo_externo, sensivel, usar_tela, usar_alerta, usar_relatorio, usar_agente';

function mapCampo(row: Record<string, unknown>): CampoContextoRecord {
  return {
    id: row.id as string,
    nome: row.nome as string,
    descricao: (row.descricao as string) || '',
    tipo: row.tipo as string,
    origem: row.origem as CampoOrigem,
    status: row.status as CampoStatus,
    integracao: (row.integracao as string) || '',
    endpoint: (row.endpoint as string) || '',
    campoExterno: (row.campo_externo as string) || '',
    sensivel: !!row.sensivel,
    usarTela: !!row.usar_tela,
    usarAlerta: !!row.usar_alerta,
    usarRelatorio: !!row.usar_relatorio,
    usarAgente: !!row.usar_agente,
  };
}

export async function listCamposContexto(clienteId: string): Promise<{ items: CampoContextoRecord[]; source: 'supabase' | 'local' }> {
  const client = universoSupabase;
  if (!client) return { items: [], source: 'local' };

  const { data, error } = await client
    .from('campos_contexto')
    .select(SELECT)
    .eq('cliente_id', clienteId)
    .is('excluido_em', null)
    .order('criado_em', { ascending: false });

  if (error || !data) return { items: [], source: 'local' };
  return { items: data.map(mapCampo), source: 'supabase' };
}

function toRow(input: CampoContextoInput) {
  return {
    nome: input.nome,
    descricao: input.descricao || null,
    tipo: input.tipo,
    origem: input.origem,
    status: input.status,
    integracao: input.integracao || null,
    endpoint: input.endpoint || null,
    campo_externo: input.campoExterno || null,
    sensivel: input.sensivel,
    usar_tela: input.usarTela,
    usar_alerta: input.usarAlerta,
    usar_relatorio: input.usarRelatorio,
    usar_agente: input.usarAgente,
  };
}

export async function createCampoContexto(clienteId: string, input: CampoContextoInput): Promise<CampoContextoRecord> {
  const client = universoSupabase;
  if (!client) throw new Error('Supabase não configurado.');

  const { data, error } = await client.from('campos_contexto').insert({ cliente_id: clienteId, ...toRow(input) }).select(SELECT).single();
  if (error || !data) throw new Error(error?.message || 'Não foi possível criar o campo.');
  return mapCampo(data);
}

export async function updateCampoContexto(id: string, input: CampoContextoInput): Promise<CampoContextoRecord> {
  const client = universoSupabase;
  if (!client) throw new Error('Supabase não configurado.');

  const { data, error } = await client.from('campos_contexto').update({ ...toRow(input), atualizado_em: new Date().toISOString() }).eq('id', id).select(SELECT).single();
  if (error || !data) throw new Error(error?.message || 'Não foi possível salvar o campo.');
  return mapCampo(data);
}

export async function softDeleteCampoContexto(id: string): Promise<void> {
  const client = universoSupabase;
  if (!client) throw new Error('Supabase não configurado.');

  const { error } = await client.from('campos_contexto').update({ excluido_em: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}
