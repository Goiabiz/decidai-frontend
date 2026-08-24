import { universoSupabase } from '../lib/supabase';
import type { KnowledgeLifecycleState, KnowledgeSourceType } from './baseConhecimento';

// Onda F (emenda Imya, migrations 105/111/113/114) -- Enterprise Knowledge Intranet: uso
// interno da operadora (Produto/DEV/Suporte/Comercial/Marketing), decisão do usuário
// (AskUserQuestion, 23/08): tela staff separada de BaseConhecimento.tsx, mesmo backend
// (knowledge_entries), reaproveitando toda a camada de busca semântica/pgvector que já
// existia -- não uma tabela nova. cliente_id sempre null aqui (conteúdo de plataforma).
//
// Mesma decisão de escopo de BaseConhecimento.tsx: sem "criar" manual -- publicar exige
// embedding real (API de IA), responsabilidade exclusiva do agente via Tool Gateway. Esta
// tela organiza/qualifica o que o agente já publicou (título/conteúdo continuam vindo de
// lá) com os campos da Onda F: biblioteca, indústria/departamento/processo, Pain Library,
// visibilidade.

export type TipoBiblioteca = 'market' | 'industry' | 'process' | 'pain' | 'playbook' | 'geral';

export const TIPO_BIBLIOTECA_LABELS: Record<TipoBiblioteca, string> = {
  market: 'Markets Library',
  industry: 'Industry Library',
  process: 'Process Library',
  pain: 'Pain Library',
  playbook: 'Playbook',
  geral: 'Geral',
};

export type Visibilidade = 'interno' | 'cliente' | 'ambos';

export const VISIBILIDADE_LABELS: Record<Visibilidade, string> = {
  interno: 'Só interno (staff)',
  cliente: 'Só o próprio cliente',
  ambos: 'Cliente + plataforma (padrão anterior)',
};

export type IntranetKnowledgeEntry = {
  id: string;
  title: string;
  content: string;
  sourceType: KnowledgeSourceType;
  tags: string[];
  category: string | null;
  tipoBiblioteca: TipoBiblioteca | null;
  industriaId: string | null;
  departamentoId: string | null;
  processoId: string | null;
  dor: string | null;
  impacto: string | null;
  solucaoDecidai: string | null;
  roiEstimado: string | null;
  visibilidade: Visibilidade;
  lifecycleState: KnowledgeLifecycleState;
  createdAt: string;
};

export type IntranetKnowledgeEntryUpdate = {
  title: string;
  content: string;
  tags: string[];
  category: string | null;
  tipoBiblioteca: TipoBiblioteca | null;
  industriaId: string | null;
  departamentoId: string | null;
  processoId: string | null;
  dor: string | null;
  impacto: string | null;
  solucaoDecidai: string | null;
  roiEstimado: string | null;
  visibilidade: Visibilidade;
};

type KnowledgeAdminOk<T> = { ok: true; data: T };
type KnowledgeAdminErr = { ok: false; error: string };
type KnowledgeAdminResult<T> = KnowledgeAdminOk<T> | KnowledgeAdminErr;

function isOk<T>(result: KnowledgeAdminResult<T>): result is KnowledgeAdminOk<T> {
  return result.ok === true;
}

// Mesmo helper de baseConhecimento.ts -- error.context carrega o corpo JSON real da Edge
// Function, error.message sozinho só devolve "Edge Function returned a non-2xx status code".
async function extractFunctionErrorMessage(error: { message: string; context?: unknown }): Promise<string> {
  const context = error.context;
  if (context && typeof (context as Response).clone === 'function') {
    try {
      const body = await (context as Response).clone().json();
      if (body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string') {
        return (body as { error: string }).error;
      }
    } catch {
      // corpo não é JSON válido -- cai no fallback abaixo
    }
  }
  return error.message;
}

async function callKnowledgeAdmin<T = Record<string, never>>(body: Record<string, unknown>): Promise<KnowledgeAdminResult<T>> {
  const client = universoSupabase;
  if (!client) return { ok: false, error: 'Supabase não configurado.' };

  try {
    const { data, error } = await client.functions.invoke('knowledge-admin', { body });
    if (error) return { ok: false, error: await extractFunctionErrorMessage(error) };
    const payload = data as { ok?: boolean; error?: string } & T;
    if (!payload || payload.ok !== true) return { ok: false, error: payload?.error || 'Resposta vazia.' };
    return { ok: true, data: payload };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Falha ao chamar knowledge-admin.' };
  }
}

export async function listIntranetKnowledgeEntries(): Promise<{ items: IntranetKnowledgeEntry[]; error?: string }> {
  // clienteId nunca é passado -- a Edge Function resolve "staff sem tenant" sozinha
  // (fn_is_staff_sem_tenant) e devolve conteúdo de plataforma com incluir_interno=true.
  const result = await callKnowledgeAdmin<{ items: IntranetKnowledgeEntry[] }>({ action: 'list', limit: 200, offset: 0 });
  if (isOk(result)) return { items: result.data.items };
  return { items: [], error: result.error };
}

export async function updateIntranetKnowledgeEntry(id: string, input: IntranetKnowledgeEntryUpdate): Promise<void> {
  const result = await callKnowledgeAdmin({ action: 'update', id, ...input });
  if (!isOk(result)) throw new Error(result.error);
}

export async function deleteIntranetKnowledgeEntry(id: string): Promise<void> {
  const result = await callKnowledgeAdmin({ action: 'delete', id });
  if (!isOk(result)) throw new Error(result.error);
}
