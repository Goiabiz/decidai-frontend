import { universoSupabase } from '../lib/supabase';

export type KnowledgeSourceType = 'agente_extraido' | 'manual' | 'documento';

export type KnowledgeEntryRecord = {
  id: string;
  title: string;
  content: string;
  sourceType: KnowledgeSourceType;
  tags: string[];
  category: string | null;
  createdByUserId: string | null;
  createdAt: string;
};

type KnowledgeAdminOk<T> = { ok: true; data: T };
type KnowledgeAdminErr = { ok: false; error: string };
type KnowledgeAdminResult<T> = KnowledgeAdminOk<T> | KnowledgeAdminErr;

function isKnowledgeAdminOk<T>(result: KnowledgeAdminResult<T>): result is KnowledgeAdminOk<T> {
  return result.ok === true;
}

/**
 * `functions.invoke()` só devolve uma mensagem genérica ("Edge Function returned a
 * non-2xx status code") em `error.message` -- o corpo JSON real que a função escreveu
 * (`{ ok: false, error: "..." }`) fica em `error.context`, um Response não lido por
 * padrão. Sem isso, todo erro real (401/403/500) aparece igual pro usuário.
 */
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
