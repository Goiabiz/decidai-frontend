import { universoSupabase } from '../lib/supabase';
import type { StatusCategory } from '../lib/statusCategory';

// Objeto Decision (Plano Mestre v4, §8) -- migration 099 (frente B, Intelligence v1) criou o
// schema completo (bate campo a campo com o §8) e a geração automática via Detection
// (service_role only). O que faltava, fechado na migration 160: um jeito de um humano revisar
// e fechar o loop (status/decisao_tomada/justificativa/resultado_observado) -- fn_review_decision,
// só esses 4 campos editáveis, nunca os campos de saída do Detection/Diagnosis automático.

export type DecisionStatus = 'draft' | 'em_analise' | 'decidida' | 'em_execucao' | 'concluida' | 'descartada';
export const decisionStatusList: DecisionStatus[] = ['draft', 'em_analise', 'decidida', 'em_execucao', 'concluida', 'descartada'];
export const decisionStatusLabels: Record<DecisionStatus, string> = {
  draft: 'Novo (não revisado)',
  em_analise: 'Em análise',
  decidida: 'Decidida',
  em_execucao: 'Em execução',
  concluida: 'Concluída',
  descartada: 'Descartada',
};

export type Decision = {
  id: string;
  cliente_id: string;
  problema: string;
  contexto: string | null;
  evidencias: unknown[];
  indicadores: Record<string, unknown>;
  alternativas: unknown[];
  riscos: string | null;
  recomendacao: string | null;
  confianca: 'baixa' | 'media' | 'alta' | null;
  decisao_tomada: string | null;
  justificativa: string | null;
  data_decisao: string | null;
  impacto_esperado: string | null;
  responsaveis: string[];
  acoes_resultantes: unknown[];
  resultado_observado: string | null;
  status: DecisionStatus;
  origem_regra_codigo: string | null;
  criado_em: string;
  atualizado_em: string | null;
};

function getClient() {
  return universoSupabase;
}

export async function listDecisions(clienteId: string): Promise<Decision[]> {
  const client = getClient();
  if (!client) return [];
  const { data, error } = await client
    .from('decisions')
    .select('*')
    .eq('cliente_id', clienteId)
    .is('excluido_em', null)
    .order('criado_em', { ascending: false });
  if (error) return [];
  return (data || []) as Decision[];
}

export type ReviewDecisionInput = {
  status: DecisionStatus;
  decisaoTomada?: string;
  justificativa?: string;
  resultadoObservado?: string;
};

/** Único caminho de escrita pra humano -- fn_review_decision (migration 160), só edita os 4 campos de revisão. */
export async function reviewDecision(decisionId: string, input: ReviewDecisionInput): Promise<{ ok: boolean; error?: string; decision?: Decision }> {
  const client = getClient();
  if (!client) return { ok: false, error: 'Supabase não configurado.' };
  const { data, error } = await client.rpc('fn_review_decision', {
    p_decision_id: decisionId,
    p_status: input.status,
    p_decisao_tomada: input.decisaoTomada || null,
    p_justificativa: input.justificativa || null,
    p_resultado_observado: input.resultadoObservado || null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, decision: data as Decision };
}

// Work Item Universal (§9) -- vw_work_items_universal (migration 160): tarefa/atendimento/
// alerta/decisão numa régua comum, sem tabela nova.

export type WorkItemTipo = 'Tarefa' | 'Atendimento' | 'Alerta' | 'Decisão';

export type WorkItem = {
  tipo: WorkItemTipo;
  id: string;
  cliente_id: string;
  titulo: string;
  status_bruto: string;
  categoria_status: StatusCategory;
  prioridade: string | null;
  responsavel: string | null;
  criado_em: string;
  atualizado_em: string | null;
};

export async function listWorkItemsUniversal(clienteId: string): Promise<WorkItem[]> {
  const client = getClient();
  if (!client) return [];
  const { data, error } = await client
    .from('vw_work_items_universal')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('criado_em', { ascending: false });
  if (error) return [];
  return (data || []) as WorkItem[];
}
