import { universoSupabase } from '../lib/supabase';

export type TelaStatus = 'Ativa' | 'Inativa' | 'Rascunho';
export type TelaComportamento = 'Exibir ao abrir funcionalidade' | 'Exibir como atalho';
export type TelaTabModo = 'Campos' | 'Lista';
export type TelaFieldArea = 'Principal' | 'Contexto';
export type TelaFieldWidth = 'Inteira' | 'Metade' | 'Terço';

export type TelaTab = { id: string; nome: string; modo: TelaTabModo; ordem: number };
export type TelaSection = { id: string; tabId: string; nome: string; colunas: 1 | 2 | 3; ordem: number };

export type TelaCampoPosicionado = {
  id: string;
  tabId: string;
  sectionId: string | null;
  area: TelaFieldArea;
  largura: TelaFieldWidth;
  obrigatorio: boolean;
  visivel: boolean;
  ocultoUsuario: boolean;
  valorPadrao: string;
  ordem: number;
  campoContextoId: string | null;
  campoSistemaChave: string | null;
};

export type TelaRecord = {
  id: string;
  nome: string;
  funcionalidade: string;
  status: TelaStatus;
  comportamento: TelaComportamento;
  descricao: string;
  agente: boolean;
  atualizadoEm: string;
  tabs: TelaTab[];
  sections: TelaSection[];
  campos: TelaCampoPosicionado[];
};

export type TelaInput = Omit<TelaRecord, 'id' | 'atualizadoEm'>;

const TELA_SELECT = 'id, nome, funcionalidade, status, comportamento, descricao, agente, atualizado_em';

async function loadChildren(client: NonNullable<typeof universoSupabase>, telaId: string) {
  const [tabsResult, sectionsResult, camposResult] = await Promise.all([
    client.from('tela_tabs').select('id, nome, modo, ordem').eq('tela_id', telaId).order('ordem'),
    client.from('tela_sections').select('id, tab_id, nome, colunas, ordem').eq('tela_id', telaId).order('ordem'),
    client.from('tela_campos').select('id, tab_id, section_id, area, largura, obrigatorio, visivel, oculto_usuario, valor_padrao, ordem, campo_contexto_id, campo_sistema_chave').eq('tela_id', telaId).order('ordem'),
  ]);

  const tabs: TelaTab[] = (tabsResult.data || []).map((row) => ({ id: row.id, nome: row.nome, modo: row.modo as TelaTabModo, ordem: row.ordem }));
  const sections: TelaSection[] = (sectionsResult.data || []).map((row) => ({ id: row.id, tabId: row.tab_id, nome: row.nome, colunas: row.colunas as 1 | 2 | 3, ordem: row.ordem }));
  const campos: TelaCampoPosicionado[] = (camposResult.data || []).map((row) => ({
    id: row.id,
    tabId: row.tab_id,
    sectionId: row.section_id,
    area: row.area as TelaFieldArea,
    largura: row.largura as TelaFieldWidth,
    obrigatorio: !!row.obrigatorio,
    visivel: !!row.visivel,
    ocultoUsuario: !!row.oculto_usuario,
    valorPadrao: row.valor_padrao || '',
    ordem: row.ordem,
    campoContextoId: row.campo_contexto_id,
    campoSistemaChave: row.campo_sistema_chave,
  }));

  return { tabs, sections, campos };
}

function mapTelaRow(row: Record<string, unknown>, tabs: TelaTab[], sections: TelaSection[], campos: TelaCampoPosicionado[]): TelaRecord {
  return {
    id: row.id as string,
    nome: row.nome as string,
    funcionalidade: row.funcionalidade as string,
    status: row.status as TelaStatus,
    comportamento: row.comportamento as TelaComportamento,
    descricao: (row.descricao as string) || '',
    agente: !!row.agente,
    atualizadoEm: row.atualizado_em as string,
    tabs,
    sections,
    campos,
  };
}

export async function listTelas(clienteId: string): Promise<{ items: TelaRecord[]; source: 'supabase' | 'local' }> {
  const client = universoSupabase;
  if (!client) return { items: [], source: 'local' };

  const { data, error } = await client.from('telas').select(TELA_SELECT).eq('cliente_id', clienteId).is('excluido_em', null).order('atualizado_em', { ascending: false });
  if (error || !data) return { items: [], source: 'local' };

  const items = await Promise.all(data.map(async (row) => {
    const { tabs, sections, campos } = await loadChildren(client, row.id);
    return mapTelaRow(row, tabs, sections, campos);
  }));

  return { items, source: 'supabase' };
}

async function saveChildren(client: NonNullable<typeof universoSupabase>, clienteId: string, telaId: string, input: TelaInput) {
  // Apaga todas as abas -- cascade em tela_sections/tela_campos (FK tab_id on delete cascade)
  // cuida do resto. Reinsere tudo do zero: mais simples que diff, e o volume por tela é baixo.
  await client.from('tela_tabs').delete().eq('tela_id', telaId);

  const tabIdMap = new Map<string, string>();
  const { data: insertedTabs, error: tabsError } = await client
    .from('tela_tabs')
    .insert(input.tabs.map((tab) => ({ tela_id: telaId, cliente_id: clienteId, nome: tab.nome, modo: tab.modo, ordem: tab.ordem })))
    .select('id, nome, ordem');
  if (tabsError) throw new Error(tabsError.message);

  // Casa cada aba original (por posição/ordem) com a linha nova inserida.
  input.tabs.forEach((tab, index) => {
    const inserted = insertedTabs?.[index];
    if (inserted) tabIdMap.set(tab.id, inserted.id);
  });

  const sectionIdMap = new Map<string, string>();
  if (input.sections.length) {
    const { data: insertedSections, error: sectionsError } = await client
      .from('tela_sections')
      .insert(input.sections.map((section) => ({
        tela_id: telaId,
        cliente_id: clienteId,
        tab_id: tabIdMap.get(section.tabId) || null,
        nome: section.nome,
        colunas: section.colunas,
        ordem: section.ordem,
      })))
      .select('id');
    if (sectionsError) throw new Error(sectionsError.message);
    input.sections.forEach((section, index) => {
      const inserted = insertedSections?.[index];
      if (inserted) sectionIdMap.set(section.id, inserted.id);
    });
  }

  const camposValidos = input.campos.filter((campo) => tabIdMap.has(campo.tabId));
  if (camposValidos.length) {
    const { error: camposError } = await client.from('tela_campos').insert(camposValidos.map((campo) => ({
      tela_id: telaId,
      cliente_id: clienteId,
      tab_id: tabIdMap.get(campo.tabId),
      section_id: campo.sectionId ? sectionIdMap.get(campo.sectionId) || null : null,
      area: campo.area,
      largura: campo.largura,
      obrigatorio: campo.obrigatorio,
      visivel: campo.visivel,
      oculto_usuario: campo.ocultoUsuario,
      valor_padrao: campo.valorPadrao || null,
      ordem: campo.ordem,
      campo_contexto_id: campo.campoContextoId,
      campo_sistema_chave: campo.campoSistemaChave,
    })));
    if (camposError) throw new Error(camposError.message);
  }
}

export async function createTela(clienteId: string, input: TelaInput): Promise<TelaRecord> {
  const client = universoSupabase;
  if (!client) throw new Error('Supabase não configurado.');

  const { data: tela, error } = await client
    .from('telas')
    .insert({ cliente_id: clienteId, nome: input.nome, funcionalidade: input.funcionalidade, status: input.status, comportamento: input.comportamento, descricao: input.descricao || null, agente: input.agente })
    .select(TELA_SELECT)
    .single();
  if (error || !tela) throw new Error(error?.message || 'Não foi possível criar a tela.');

  await saveChildren(client, clienteId, tela.id, input);
  const { tabs, sections, campos } = await loadChildren(client, tela.id);
  return mapTelaRow(tela, tabs, sections, campos);
}

export async function updateTela(id: string, clienteId: string, input: TelaInput): Promise<TelaRecord> {
  const client = universoSupabase;
  if (!client) throw new Error('Supabase não configurado.');

  const { data: tela, error } = await client
    .from('telas')
    .update({ nome: input.nome, funcionalidade: input.funcionalidade, status: input.status, comportamento: input.comportamento, descricao: input.descricao || null, agente: input.agente, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .select(TELA_SELECT)
    .single();
  if (error || !tela) throw new Error(error?.message || 'Não foi possível salvar a tela.');

  await saveChildren(client, clienteId, id, input);
  const { tabs, sections, campos } = await loadChildren(client, id);
  return mapTelaRow(tela, tabs, sections, campos);
}

export async function softDeleteTela(id: string): Promise<void> {
  const client = universoSupabase;
  if (!client) throw new Error('Supabase não configurado.');
  const { error } = await client.from('telas').update({ excluido_em: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}
