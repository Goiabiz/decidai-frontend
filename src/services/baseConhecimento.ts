import { callEdgeFunction, isEdgeFunctionOk } from '../lib/edgeFunction';

export type KnowledgeSourceType = 'agente_extraido' | 'manual' | 'documento';

// Onda J (Knowledge Lifecycle, emenda Imya, migration 107). Grafo real:
// CANDIDATE -> PRIVATE -> PENDING_APPROVAL -> VALIDATED -> SHARED -> SUPERSEDED -> ARCHIVED.
// SHARED não é oferecido nesta tela -- promover pra lá exige decisão de produto sobre
// cross-customer learning ainda não tomada (Edge Function recusa esse alvo). SUPERSEDED
// não é alcançável por ação manual -- não existe versionamento de entrada ainda.
export type KnowledgeLifecycleState =
  | 'CANDIDATE' | 'PRIVATE' | 'PENDING_APPROVAL' | 'VALIDATED' | 'SHARED' | 'SUPERSEDED' | 'ARCHIVED';

export const KNOWLEDGE_LIFECYCLE_NEXT: Partial<Record<KnowledgeLifecycleState, { state: KnowledgeLifecycleState; label: string }>> = {
  CANDIDATE: { state: 'PRIVATE', label: 'Manter' },
  PRIVATE: { state: 'PENDING_APPROVAL', label: 'Enviar pra aprovação' },
  PENDING_APPROVAL: { state: 'VALIDATED', label: 'Aprovar' },
};

export const KNOWLEDGE_LIFECYCLE_LABELS: Record<KnowledgeLifecycleState, string> = {
  CANDIDATE: 'Candidato (não revisado)',
  PRIVATE: 'Privado',
  PENDING_APPROVAL: 'Aguardando aprovação',
  VALIDATED: 'Validado',
  SHARED: 'Compartilhado',
  SUPERSEDED: 'Substituído',
  ARCHIVED: 'Arquivado',
};

export type KnowledgeEntryRecord = {
  id: string;
  title: string;
  content: string;
  sourceType: KnowledgeSourceType;
  tags: string[];
  category: string | null;
  createdByUserId: string | null;
  lifecycleState: KnowledgeLifecycleState;
  createdAt: string;
};

type KnowledgeAdminOk<T> = { ok: true; data: T };
type KnowledgeAdminErr = { ok: false; error: string };
type KnowledgeAdminResult<T> = KnowledgeAdminOk<T> | KnowledgeAdminErr;

function isKnowledgeAdminOk<T>(result: KnowledgeAdminResult<T>): result is KnowledgeAdminOk<T> {
  return result.ok === true;
}

// Extração de mensagem real de erro (o `.clone().json()` que `functions.invoke()` exige)
// e a chamada em si moraram aqui até a reforma de 29/08 -- agora vêm de lib/edgeFunction.ts,
// mesmo helper usado por billing.ts e qualquer serviço novo que chame Edge Function.
async function callKnowledgeAdmin<T = Record<string, never>>(body: Record<string, unknown>): Promise<KnowledgeAdminResult<T>> {
  const result = await callEdgeFunction<T>('knowledge-admin', body);
  if (!isEdgeFunctionOk(result)) return { ok: false, error: result.error };
  return { ok: true, data: result.data };
}

/**
 * Base de conhecimento é a mesma camada usada pelo agente (Knowledge Layer, pgvector) --
 * decisão registrada com a sessão irmã em 2026-08-11. `knowledge-admin` só expõe
 * list/update/delete (publicar é ferramenta exclusiva do agente via Tool Gateway) -- por
 * isso esta tela é só de curadoria (ver/editar/apagar o que já foi publicado), sem "novo
 * conhecimento" manual por aqui ainda.
 */
/**
 * `clienteId` só importa pra conta de staff "Acessando como" um tenant (session.activeClientId)
 * -- a Edge Function ignora esse campo pra usuário real de tenant (resolve pelo próprio JWT,
 * migration 053) e só confia nele depois de confirmar server-side que quem chamou é staff de
 * verdade. Repassar sempre é seguro: não abre nada pra quem não é staff.
 */
export async function listKnowledgeEntries(category?: string, clienteId?: string | null): Promise<{ items: KnowledgeEntryRecord[]; error?: string }> {
  const result = await callKnowledgeAdmin<{ items: KnowledgeEntryRecord[] }>({ action: 'list', category: category || null, limit: 100, offset: 0, clienteId: clienteId || null });
  if (isKnowledgeAdminOk(result)) return { items: result.data.items };
  return { items: [], error: result.error };
}

export async function updateKnowledgeEntry(id: string, input: { title: string; content: string; tags: string[]; category: string | null }, clienteId?: string | null): Promise<void> {
  const result = await callKnowledgeAdmin({ action: 'update', id, ...input, clienteId: clienteId || null });
  if (!isKnowledgeAdminOk(result)) throw new Error(result.error);
}

export async function deleteKnowledgeEntry(id: string, clienteId?: string | null): Promise<void> {
  const result = await callKnowledgeAdmin({ action: 'delete', id, clienteId: clienteId || null });
  if (!isKnowledgeAdminOk(result)) throw new Error(result.error);
}

export async function transitionKnowledgeEntry(id: string, newState: KnowledgeLifecycleState, clienteId?: string | null): Promise<void> {
  const result = await callKnowledgeAdmin({ action: 'transition', id, newState, clienteId: clienteId || null });
  if (!isKnowledgeAdminOk(result)) throw new Error(result.error);
}
