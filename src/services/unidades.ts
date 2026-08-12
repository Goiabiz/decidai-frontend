import { universoSupabase } from '../lib/supabase';

export type UnidadeTipo = 'Matriz' | 'Filial' | 'Prestador' | 'Fornecedor' | 'Cliente';
export type UnidadeStatus = 'Ativa' | 'Inativa' | 'Bloqueada' | 'Pendente';

export type UnidadeSetor = {
  id: string;
  nome: string;
  responsavel: string;
};

export type UnidadeRecord = {
  id: string;
  nome: string;
  tipo: UnidadeTipo;
  status: UnidadeStatus;
  responsavel: string;
  email: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  pais: string;
  latitude: string;
  longitude: string;
  dados: Record<string, string>;
  setores: UnidadeSetor[];
};

export type UnidadeInput = Omit<UnidadeRecord, 'id' | 'setores'> & { setores: Array<{ nome: string; responsavel: string }> };

const SELECT = 'id, nome, tipo, status, responsavel, email, telefone, cep, logradouro, numero, complemento, bairro, cidade, uf, pais, latitude, longitude, dados';

function mapUnidade(row: Record<string, unknown>, setores: UnidadeSetor[]): UnidadeRecord {
  return {
    id: row.id as string,
    nome: row.nome as string,
    tipo: row.tipo as UnidadeTipo,
    status: row.status as UnidadeStatus,
    responsavel: (row.responsavel as string) || '',
    email: (row.email as string) || '',
    telefone: (row.telefone as string) || '',
    cep: (row.cep as string) || '',
    logradouro: (row.logradouro as string) || '',
    numero: (row.numero as string) || '',
    complemento: (row.complemento as string) || '',
    bairro: (row.bairro as string) || '',
    cidade: (row.cidade as string) || '',
    uf: (row.uf as string) || '',
    pais: (row.pais as string) || 'Brasil',
    latitude: (row.latitude as string) || '',
    longitude: (row.longitude as string) || '',
    dados: (row.dados as Record<string, string>) || {},
    setores,
  };
}

export async function listUnidades(clienteId: string): Promise<{ items: UnidadeRecord[]; source: 'supabase' | 'local' }> {
  const client = universoSupabase;
  if (!client) return { items: [], source: 'local' };

  const [unidadesResult, setoresResult] = await Promise.all([
    client.from('unidades').select(SELECT).eq('cliente_id', clienteId).is('excluido_em', null).order('criado_em', { ascending: false }),
    client.from('unidade_setores').select('id, unidade_id, nome, responsavel').eq('cliente_id', clienteId),
  ]);

  if (unidadesResult.error || !unidadesResult.data) return { items: [], source: 'local' };

  const setoresPorUnidade = new Map<string, UnidadeSetor[]>();
  (setoresResult.data || []).forEach((row) => {
    const list = setoresPorUnidade.get(row.unidade_id) || [];
    list.push({ id: row.id, nome: row.nome, responsavel: row.responsavel || '' });
    setoresPorUnidade.set(row.unidade_id, list);
  });

  return {
    items: unidadesResult.data.map((row) => mapUnidade(row, setoresPorUnidade.get(row.id as string) || [])),
    source: 'supabase',
  };
}

export async function createUnidade(clienteId: string, input: UnidadeInput): Promise<UnidadeRecord> {
  const client = universoSupabase;
  if (!client) throw new Error('Supabase não configurado.');

  const { data: unidade, error } = await client
    .from('unidades')
    .insert({
      cliente_id: clienteId,
      nome: input.nome,
      tipo: input.tipo,
      status: input.status,
      responsavel: input.responsavel || null,
      email: input.email || null,
      telefone: input.telefone || null,
      cep: input.cep || null,
      logradouro: input.logradouro || null,
      numero: input.numero || null,
      complemento: input.complemento || null,
      bairro: input.bairro || null,
      cidade: input.cidade || null,
      uf: input.uf || null,
      pais: input.pais || 'Brasil',
      latitude: input.latitude || null,
      longitude: input.longitude || null,
      dados: input.dados || {},
    })
    .select(SELECT)
    .single();

  if (error || !unidade) throw new Error(error?.message || 'Não foi possível criar a unidade.');

  const setores = await saveSetores(clienteId, unidade.id as string, input.setores);
  return mapUnidade(unidade, setores);
}

export async function updateUnidade(id: string, clienteId: string, input: UnidadeInput): Promise<UnidadeRecord> {
  const client = universoSupabase;
  if (!client) throw new Error('Supabase não configurado.');

  const { data: unidade, error } = await client
    .from('unidades')
    .update({
      nome: input.nome,
      tipo: input.tipo,
      status: input.status,
      responsavel: input.responsavel || null,
      email: input.email || null,
      telefone: input.telefone || null,
      cep: input.cep || null,
      logradouro: input.logradouro || null,
      numero: input.numero || null,
      complemento: input.complemento || null,
      bairro: input.bairro || null,
      cidade: input.cidade || null,
      uf: input.uf || null,
      pais: input.pais || 'Brasil',
      latitude: input.latitude || null,
      longitude: input.longitude || null,
      dados: input.dados || {},
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', id)
    .select(SELECT)
    .single();

  if (error || !unidade) throw new Error(error?.message || 'Não foi possível salvar a unidade.');

  const setores = await saveSetores(clienteId, id, input.setores);
  return mapUnidade(unidade, setores);
}

async function saveSetores(clienteId: string, unidadeId: string, setores: Array<{ nome: string; responsavel: string }>): Promise<UnidadeSetor[]> {
  const client = universoSupabase;
  if (!client) return [];

  await client.from('unidade_setores').delete().eq('unidade_id', unidadeId);

  const validSetores = setores.filter((setor) => setor.nome.trim());
  if (!validSetores.length) return [];

  const { data, error } = await client
    .from('unidade_setores')
    .insert(validSetores.map((setor) => ({ unidade_id: unidadeId, cliente_id: clienteId, nome: setor.nome, responsavel: setor.responsavel || null })))
    .select('id, nome, responsavel');

  if (error || !data) return [];
  return data.map((row) => ({ id: row.id, nome: row.nome, responsavel: row.responsavel || '' }));
}
