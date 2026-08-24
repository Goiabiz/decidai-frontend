import { universoSupabase } from '../lib/supabase';

// Onda E (emenda Imya, migration 096) -- biblioteca de referência global da plataforma, não
// tenant-scoped. Leitura liberada a qualquer authenticated (RLS: *_select_authenticated).
// Só o necessário pra popular seletores na Enterprise Knowledge Intranet (Onda F) -- não é
// uma camada de acesso completa às 9 tabelas de ontologia_*.

export type OntologiaRef = { id: string; nome: string };

async function listRef(table: string): Promise<OntologiaRef[]> {
  const client = universoSupabase;
  if (!client) return [];
  const { data, error } = await client.from(table).select('id, nome').order('nome');
  if (error || !data) return [];
  return data as OntologiaRef[];
}

export async function listOntologiaDepartamentos(): Promise<OntologiaRef[]> {
  return listRef('ontologia_departamentos');
}

export async function listOntologiaProcessos(): Promise<OntologiaRef[]> {
  return listRef('ontologia_processos');
}

export async function listOntologiaIndustrias(): Promise<OntologiaRef[]> {
  return listRef('ontologia_industrias');
}
