import { universoSupabase } from '../lib/supabase';

export type CrmEmpresa = {
  id: string;
  nome: string;
  documento: string | null;
  observacao: string | null;
  ativo: boolean;
  criadoEm: string;
};

export type CrmEmpresaInput = { nome: string; documento?: string; observacao?: string };

export type CrmContato = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  canalOrigem: string | null;
  observacao: string | null;
  empresaId: string | null;
  empresaNome: string | null;
  ativo: boolean;
  criadoEm: string;
};

export type CrmContatoInput = {
  nome: string;
  email?: string;
  telefone?: string;
  canalOrigem?: string;
  observacao?: string;
  empresaId?: string | null;
};

export type CrmEstagioTerminal = 'ganho' | 'perdido';

export type CrmEstagio = {
  id: string;
  nome: string;
  ordem: number;
  cor: string | null;
  terminal: CrmEstagioTerminal | null;
};

export type CrmCasoStatus = 'aberto' | 'ganho' | 'perdido';

export type CrmCaso = {
  id: string;
  titulo: string;
  contatoId: string;
  contatoNome: string;
  empresaId: string | null;
  empresaNome: string | null;
  estagioId: string;
  valor: number | null;
  responsavelId: string | null;
  responsavelNome: string | null;
  status: CrmCasoStatus;
  observacao: string | null;
  criadoEm: string;
};

export type CrmCasoInput = {
  titulo: string;
  contatoId: string;
  empresaId?: string | null;
  estagioId: string;
  valor?: number | null;
  responsavelId?: string | null;
  observacao?: string;
};

export type CrmAtendimentoResumo = {
  id: string;
  numeroSequencial: number;
  assunto: string;
  status: string;
  canal: string;
  criadoEm: string;
};

export type CrmContato360 = {
  contato: CrmContato;
  casos: CrmCaso[];
  atendimentos: CrmAtendimentoResumo[];
};

const ESTAGIOS_PADRAO: Array<{ nome: string; ordem: number; terminal: CrmEstagioTerminal | null }> = [
  { nome: 'Novo', ordem: 1, terminal: null },
  { nome: 'Qualificando', ordem: 2, terminal: null },
  { nome: 'Proposta', ordem: 3, terminal: null },
  { nome: 'Ganho', ordem: 4, terminal: 'ganho' },
  { nome: 'Perdido', ordem: 5, terminal: 'perdido' },
];

function requireClient() {
  if (!universoSupabase) throw new Error('Supabase não configurado neste ambiente.');
  return universoSupabase;
}

function firstOf<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

// =========================================================================
// Empresas
// =========================================================================

const EMPRESA_SELECT = 'id, nome, documento, observacao, ativo, criado_em';

function mapEmpresa(row: Record<string, unknown>): CrmEmpresa {
  return {
    id: row.id as string,
    nome: row.nome as string,
    documento: (row.documento as string) || null,
    observacao: (row.observacao as string) || null,
    ativo: row.ativo as boolean,
    criadoEm: row.criado_em as string,
  };
}

export async function listEmpresas(clienteId: string): Promise<CrmEmpresa[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('crm_empresas')
    .select(EMPRESA_SELECT)
    .eq('cliente_id', clienteId)
    .is('excluido_em', null)
    .order('nome');
  if (error) throw error;
  return (data ?? []).map(mapEmpresa);
}

export async function createEmpresa(clienteId: string, input: CrmEmpresaInput): Promise<CrmEmpresa> {
  const client = requireClient();
  const { data, error } = await client
    .from('crm_empresas')
    .insert({
      cliente_id: clienteId,
      nome: input.nome,
      documento: input.documento || null,
      observacao: input.observacao || null,
    })
    .select(EMPRESA_SELECT)
    .single();
  if (error) throw error;
  return mapEmpresa(data);
}

// =========================================================================
// Contatos
// =========================================================================

const CONTATO_SELECT = 'id, nome, email, telefone, canal_origem, observacao, empresa_id, ativo, criado_em, empresa:crm_empresas(nome)';

function mapContato(row: Record<string, unknown>): CrmContato {
  const empresa = firstOf(row.empresa as { nome?: string } | { nome?: string }[] | null);
  return {
    id: row.id as string,
    nome: row.nome as string,
    email: (row.email as string) || null,
    telefone: (row.telefone as string) || null,
    canalOrigem: (row.canal_origem as string) || null,
    observacao: (row.observacao as string) || null,
    empresaId: (row.empresa_id as string) || null,
    empresaNome: empresa?.nome ?? null,
    ativo: row.ativo as boolean,
    criadoEm: row.criado_em as string,
  };
}

export async function listContatos(clienteId: string): Promise<CrmContato[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('crm_contatos')
    .select(CONTATO_SELECT)
    .eq('cliente_id', clienteId)
    .is('excluido_em', null)
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapContato);
}

export async function createContato(clienteId: string, input: CrmContatoInput): Promise<CrmContato> {
  const client = requireClient();
  const { data, error } = await client
    .from('crm_contatos')
    .insert({
      cliente_id: clienteId,
      nome: input.nome,
      email: input.email || null,
      telefone: input.telefone || null,
      canal_origem: input.canalOrigem || null,
      observacao: input.observacao || null,
      empresa_id: input.empresaId || null,
    })
    .select(CONTATO_SELECT)
    .single();
  if (error) throw error;
  return mapContato(data);
}

export async function updateContato(id: string, input: CrmContatoInput): Promise<CrmContato> {
  const client = requireClient();
  const { data, error } = await client
    .from('crm_contatos')
    .update({
      nome: input.nome,
      email: input.email || null,
      telefone: input.telefone || null,
      canal_origem: input.canalOrigem || null,
      observacao: input.observacao || null,
      empresa_id: input.empresaId || null,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', id)
    .select(CONTATO_SELECT)
    .single();
  if (error) throw error;
  return mapContato(data);
}

/** Perfil 360: contato + casos (pipeline) + atendimentos (Central de Atendimento) vinculados a ele. */
export async function getContato360(contatoId: string): Promise<CrmContato360> {
  const client = requireClient();
  const [contatoResult, casosResult, atendimentosResult] = await Promise.all([
    client.from('crm_contatos').select(CONTATO_SELECT).eq('id', contatoId).single(),
    client.from('crm_casos').select(CASO_SELECT).eq('contato_id', contatoId).is('excluido_em', null).order('criado_em', { ascending: false }),
    client.from('atendimentos').select('id, numero_sequencial, assunto, status, canal, criado_em').eq('contato_id', contatoId).order('criado_em', { ascending: false }),
  ]);
  if (contatoResult.error) throw contatoResult.error;
  if (casosResult.error) throw casosResult.error;
  if (atendimentosResult.error) throw atendimentosResult.error;

  return {
    contato: mapContato(contatoResult.data as unknown as Record<string, unknown>),
    casos: (casosResult.data ?? []).map((row) => mapCaso(row as unknown as Record<string, unknown>)),
    atendimentos: (atendimentosResult.data ?? []).map((row) => ({
      id: row.id as string,
      numeroSequencial: row.numero_sequencial as number,
      assunto: row.assunto as string,
      status: row.status as string,
      canal: row.canal as string,
      criadoEm: row.criado_em as string,
    })),
  };
}

// =========================================================================
// Estágios do pipeline
// =========================================================================

export async function listEstagios(clienteId: string): Promise<CrmEstagio[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('crm_pipeline_estagios')
    .select('id, nome, ordem, cor, terminal')
    .eq('cliente_id', clienteId)
    .eq('ativo', true)
    .order('ordem');
  if (error) throw error;
  return (data ?? []) as CrmEstagio[];
}

/** Migration 065 já semeia os estágios padrão pra tenant existente -- isto cobre só tenant criado depois dela. */
export async function ensureEstagiosPadrao(clienteId: string): Promise<CrmEstagio[]> {
  const existentes = await listEstagios(clienteId);
  if (existentes.length > 0) return existentes;

  const client = requireClient();
  const { data, error } = await client
    .from('crm_pipeline_estagios')
    .insert(ESTAGIOS_PADRAO.map((estagio) => ({ cliente_id: clienteId, ...estagio })))
    .select('id, nome, ordem, cor, terminal');
  if (error) throw error;
  return ((data ?? []) as CrmEstagio[]).sort((a, b) => a.ordem - b.ordem);
}

// =========================================================================
// Casos (pipeline)
// =========================================================================

const CASO_SELECT = 'id, titulo, contato_id, empresa_id, estagio_id, valor, responsavel_usuario_cliente_id, status, observacao, criado_em, '
  + 'contato:crm_contatos(nome), empresa:crm_empresas(nome), responsavel:usuarios_cliente(nome)';

function mapCaso(row: Record<string, unknown>): CrmCaso {
  const contato = firstOf(row.contato as { nome?: string } | { nome?: string }[] | null);
  const empresa = firstOf(row.empresa as { nome?: string } | { nome?: string }[] | null);
  const responsavel = firstOf(row.responsavel as { nome?: string } | { nome?: string }[] | null);
  return {
    id: row.id as string,
    titulo: row.titulo as string,
    contatoId: row.contato_id as string,
    contatoNome: contato?.nome ?? '-',
    empresaId: (row.empresa_id as string) || null,
    empresaNome: empresa?.nome ?? null,
    estagioId: row.estagio_id as string,
    valor: row.valor === null || row.valor === undefined ? null : Number(row.valor),
    responsavelId: (row.responsavel_usuario_cliente_id as string) || null,
    responsavelNome: responsavel?.nome ?? null,
    status: row.status as CrmCasoStatus,
    observacao: (row.observacao as string) || null,
    criadoEm: row.criado_em as string,
  };
}

export async function listCasos(clienteId: string): Promise<CrmCaso[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('crm_casos')
    .select(CASO_SELECT)
    .eq('cliente_id', clienteId)
    .is('excluido_em', null)
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapCaso(row as unknown as Record<string, unknown>));
}

export async function createCaso(clienteId: string, input: CrmCasoInput): Promise<CrmCaso> {
  const client = requireClient();
  const { data, error } = await client
    .from('crm_casos')
    .insert({
      cliente_id: clienteId,
      titulo: input.titulo,
      contato_id: input.contatoId,
      empresa_id: input.empresaId || null,
      estagio_id: input.estagioId,
      valor: input.valor ?? null,
      responsavel_usuario_cliente_id: input.responsavelId || null,
      observacao: input.observacao || null,
    })
    .select(CASO_SELECT)
    .single();
  if (error) throw error;
  return mapCaso(data as unknown as Record<string, unknown>);
}

/** Move um caso pro estágio informado -- estágio terminal (ganho/perdido) já fecha o caso junto. */
export async function moveCasoEstagio(casoId: string, estagioId: string, estagios: CrmEstagio[]): Promise<void> {
  const client = requireClient();
  const estagio = estagios.find((item) => item.id === estagioId);
  const patch: Record<string, unknown> = { estagio_id: estagioId, atualizado_em: new Date().toISOString() };
  if (estagio?.terminal) {
    patch.status = estagio.terminal;
    patch.data_fechamento = new Date().toISOString();
  } else {
    patch.status = 'aberto';
    patch.data_fechamento = null;
  }
  const { error } = await client.from('crm_casos').update(patch).eq('id', casoId);
  if (error) throw error;
}
