import { universoSupabase } from '../lib/supabase';

export type FlowTriggerType = 'manual' | 'cron';
export type FlowStepType = 'instrucao' | 'acao';

export type FlowSummary = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  usageArea: string;
  status: string;
  triggerType: FlowTriggerType;
  cronExpression: string | null;
  isActive: boolean;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FlowStep = {
  id?: string;
  stepOrder: number;
  stepType: FlowStepType;
  instruction: string;
  requiresHumanApproval: boolean;
  config: Record<string, unknown>;
};

export type FlowRunSummary = {
  id: string;
  status: string;
  triggerType: FlowTriggerType;
  currentStepOrder: number | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

export type FlowStepRun = {
  id: string;
  stepId: string;
  stepOrder: number;
  status: string;
  actionStatusId: string | null;
  result: Record<string, unknown>;
  errorMessage: string | null;
};

export type FlowRunDetail = {
  id: string;
  flowId: string;
  status: string;
  triggerType: FlowTriggerType;
  currentStepOrder: number | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

type FlowAdminOk<T> = { ok: true; data: T };
type FlowAdminErr = { ok: false; error: string };
type FlowAdminResult<T> = FlowAdminOk<T> | FlowAdminErr;

function isFlowAdminOk<T>(result: FlowAdminResult<T>): result is FlowAdminOk<T> {
  return result.ok === true;
}

// Mesmo problema documentado em baseConhecimento.ts: functions.invoke() só devolve mensagem
// genérica em error.message -- o corpo JSON real fica em error.context (Response não lido).
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

async function callFlowAdmin<T = Record<string, never>>(body: Record<string, unknown>): Promise<FlowAdminResult<T>> {
  const client = universoSupabase;
  if (!client) return { ok: false, error: 'Supabase não configurado.' };

  try {
    const { data, error } = await client.functions.invoke('flow-admin', { body });
    if (error) return { ok: false, error: await extractFunctionErrorMessage(error) };
    const payload = data as { ok?: boolean; error?: string } & T;
    if (!payload || payload.ok !== true) return { ok: false, error: payload?.error || 'Resposta vazia.' };
    return { ok: true, data: payload };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Falha ao chamar flow-admin.' };
  }
}

// clienteId (opcional) só importa pra conta de staff "Acessando como" um tenant
// (session.activeClientId) -- mesma convenção de baseConhecimento.ts. flow-admin ignora esse
// campo pra usuário real de tenant (resolve pelo próprio JWT) e só confia nele depois de
// confirmar server-side que quem chamou é staff de verdade.
export async function listFlows(clienteId?: string | null): Promise<{ items: FlowSummary[]; error?: string }> {
  const result = await callFlowAdmin<{ items: FlowSummary[] }>({ action: 'list', clienteId: clienteId || null });
  if (isFlowAdminOk(result)) return { items: result.data.items };
  return { items: [], error: result.error };
}

export async function getFlow(id: string, clienteId?: string | null): Promise<{ flow: FlowSummary; steps: FlowStep[] } | { error: string }> {
  const result = await callFlowAdmin<{ flow: FlowSummary; steps: FlowStep[] }>({ action: 'get', id, clienteId: clienteId || null });
  if (isFlowAdminOk(result)) return { flow: result.data.flow, steps: result.data.steps };
  return { error: result.error };
}

export async function upsertFlowDefinition(input: {
  id?: string;
  name: string;
  description: string | null;
  usageArea: string;
  triggerType: FlowTriggerType;
  cronExpression: string | null;
  isActive: boolean;
}, clienteId?: string | null): Promise<{ id: string } | { error: string }> {
  const result = await callFlowAdmin<{ id: string }>({ action: 'upsertDefinition', ...input, clienteId: clienteId || null });
  if (isFlowAdminOk(result)) return { id: result.data.id };
  return { error: result.error };
}

export async function saveFlowSteps(id: string, steps: FlowStep[], clienteId?: string | null): Promise<{ ok: true } | { error: string }> {
  const result = await callFlowAdmin({ action: 'saveSteps', id, steps, clienteId: clienteId || null });
  if (isFlowAdminOk(result)) return { ok: true };
  return { error: result.error };
}

export async function deleteFlow(id: string, clienteId?: string | null): Promise<{ ok: true } | { error: string }> {
  const result = await callFlowAdmin({ action: 'deleteDefinition', id, clienteId: clienteId || null });
  if (isFlowAdminOk(result)) return { ok: true };
  return { error: result.error };
}

export async function listFlowRuns(id: string, clienteId?: string | null): Promise<{ items: FlowRunSummary[]; error?: string }> {
  const result = await callFlowAdmin<{ items: FlowRunSummary[] }>({ action: 'listRuns', id, limit: 20, clienteId: clienteId || null });
  if (isFlowAdminOk(result)) return { items: result.data.items };
  return { items: [], error: result.error };
}

export async function getFlowRun(runId: string, clienteId?: string | null): Promise<{ run: FlowRunDetail; stepRuns: FlowStepRun[] } | { error: string }> {
  const result = await callFlowAdmin<{ run: FlowRunDetail; stepRuns: FlowStepRun[] }>({ action: 'getRun', runId, clienteId: clienteId || null });
  if (isFlowAdminOk(result)) return { run: result.data.run, stepRuns: result.data.stepRuns };
  return { error: result.error };
}

export async function runFlowNow(id: string, clienteId?: string | null): Promise<{ runId: string; status: string } | { error: string }> {
  const result = await callFlowAdmin<{ runId: string; status: string }>({ action: 'run', id, clienteId: clienteId || null });
  if (isFlowAdminOk(result)) return { runId: result.data.runId, status: result.data.status };
  return { error: result.error };
}

export async function confirmFlowStep(runId: string, clienteId?: string | null): Promise<{ status: string } | { error: string }> {
  const result = await callFlowAdmin<{ status: string }>({ action: 'confirmStep', runId, clienteId: clienteId || null });
  if (isFlowAdminOk(result)) return { status: result.data.status };
  return { error: result.error };
}
