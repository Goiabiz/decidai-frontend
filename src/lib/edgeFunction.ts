import { universoSupabase } from './supabase';

/**
 * `functions.invoke()` só devolve mensagem genérica ("Edge Function returned a non-2xx status
 * code") em `error.message` -- o corpo JSON real (`{ ok: false, error: "..." }`) fica em
 * `error.context`, um Response não lido por padrão. Esse contorno já foi escrito na mão em
 * pelo menos 2 arquivos (baseConhecimento.ts, billing.ts) -- centraliza aqui. Reforma de
 * arquitetura 29/08.
 */
async function extractFunctionErrorMessage(error: { message: string; context?: unknown }): Promise<string> {
  const context = error.context;
  if (context && typeof (context as Response).clone === 'function') {
    try {
      const body = await (context as Response).clone().json();
      if (body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string') {
        return (body as { error: string }).error;
      }
      if (body && typeof body === 'object' && typeof (body as { message?: unknown }).message === 'string') {
        return (body as { message: string }).message;
      }
    } catch {
      // corpo não é JSON válido -- cai no fallback abaixo
    }
  }
  return error.message;
}

export type EdgeFunctionResult<T> = { ok: true; data: T } | { ok: false; error: string };

// Este projeto roda com strictNullChecks:false (tsconfig.json) -- sob essa configuração, o
// TypeScript não estreita de forma confiável um union genérico discriminado só com
// `if (!result.ok)` (confirmado isolando o caso: falha com strictNullChecks:false, passa com
// true). Sem poder mudar strictNullChecks pra todo o projeto por causa de 1 helper, o jeito
// certo é sempre checar via este predicado `is`, nunca `if (!result.ok)` direto -- mesmo
// padrão que `isKnowledgeAdminOk` já usava em baseConhecimento.ts antes desta reforma.
export function isEdgeFunctionOk<T>(result: EdgeFunctionResult<T>): result is { ok: true; data: T } {
  return result.ok === true;
}

export async function callEdgeFunction<T = Record<string, never>>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<EdgeFunctionResult<T>> {
  const client = universoSupabase;
  if (!client) return { ok: false, error: 'Supabase não configurado.' };

  try {
    const { data, error } = await client.functions.invoke(functionName, { body });
    if (error) return { ok: false, error: await extractFunctionErrorMessage(error) };
    const payload = data as { ok?: boolean; error?: string; message?: string } & T;
    if (!payload || payload.ok !== true) {
      return { ok: false, error: payload?.error || payload?.message || 'Resposta vazia.' };
    }
    return { ok: true, data: payload };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : `Falha ao chamar ${functionName}.` };
  }
}
