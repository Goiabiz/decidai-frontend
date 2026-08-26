import { universoSupabase } from '../lib/supabase';

// Adaptive Application Engine, Onda G2 (UI Schema Engine) -- consome objetos/registros que a
// Imya cria em runtime (Tool Gateway do agente, Onda G1/G2). Esta tela só LÊ definições e faz
// CRUD de REGISTRO -- criar objeto/campo/publicar continua exclusivo da Imya via conversa
// (mesma decisão de escopo de knowledge-admin/publish_knowledge).

export type EstadoObjetoDinamico = 'DRAFT' | 'SANDBOX' | 'PUBLISHED' | 'ARCHIVED';

export type ObjetoDinamicoRecord = {
  id: string;
  nome: string;
  descricao: string | null;
  estado: EstadoObjetoDinamico;
  versaoAtual: number;
  objetoUniversalId: string | null;
};

export type CampoDinamico = {
  id: string;
  nome: string;
  tipo: string;
  obrigatorio: boolean;
  unico: boolean;
  ordem: number;
  configExtra: Record<string, unknown> | null;
};

export type RelacaoDinamica = {
  id: string;
  objetoDestinoId: string;
  tipoRelacao: string;
  nomeRelacao: string;
};

export type ObjetoDinamicoCompleto = ObjetoDinamicoRecord & {
  campos: CampoDinamico[];
  relacoes: RelacaoDinamica[];
};

export type RegistroDinamico = {
  id: string;
  dados: Record<string, unknown>;
  ehTeste: boolean;
  criadoEm: string;
  atualizadoEm: string | null;
};

type AdminOk<T> = { ok: true } & T;
type AdminErr = { ok: false; error: string };
type AdminResult<T> = AdminOk<T> | AdminErr;

function isOk<T>(result: AdminResult<T>): result is AdminOk<T> {
  return result.ok === true;
}

// Mesmo helper já usado em baseConhecimento.ts/enterpriseKnowledgeIntranet.ts --
// error.context carrega o corpo JSON real da Edge Function.
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

async function callAppObjetosAdmin<T>(body: Record<string, unknown>): Promise<AdminResult<T>> {
  const client = universoSupabase;
  if (!client) return { ok: false, error: 'Supabase não configurado.' };

  try {
    const { data, error } = await client.functions.invoke('app-objetos-admin', { body });
    if (error) return { ok: false, error: await extractFunctionErrorMessage(error) };
    const payload = data as { ok?: boolean; error?: string } & T;
    if (!payload || payload.ok !== true) return { ok: false, error: payload?.error || 'Resposta vazia.' };
    return payload as AdminOk<T>;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Falha ao chamar app-objetos-admin.' };
  }
}

export async function listarObjetosDinamicos(): Promise<{ items: ObjetoDinamicoRecord[]; error?: string }> {
  const result = await callAppObjetosAdmin<{ items: ObjetoDinamicoRecord[] }>({ action: 'listObjetos' });
  if (isOk(result)) return { items: result.items };
  return { items: [], error: result.error };
}

export async function obterObjetoDinamico(objetoDefinicaoId: string): Promise<{ objeto: ObjetoDinamicoCompleto | null; error?: string }> {
  const result = await callAppObjetosAdmin<{ objeto: ObjetoDinamicoCompleto }>({ action: 'getObjeto', objetoDefinicaoId });
  if (isOk(result)) return { objeto: result.objeto };
  return { objeto: null, error: result.error };
}

export async function listarRegistrosDinamicos(objetoDefinicaoId: string, incluirTeste = false): Promise<{ items: RegistroDinamico[]; error?: string }> {
  const result = await callAppObjetosAdmin<{ items: RegistroDinamico[] }>({ action: 'listRegistros', objetoDefinicaoId, incluirTeste });
  if (isOk(result)) return { items: result.items };
  return { items: [], error: result.error };
}

export async function criarRegistroDinamico(objetoDefinicaoId: string, dados: Record<string, unknown>): Promise<void> {
  const result = await callAppObjetosAdmin<{ id: string }>({ action: 'createRegistro', objetoDefinicaoId, dados });
  if (!isOk(result)) throw new Error(result.error);
}

export async function editarRegistroDinamico(id: string, dados: Record<string, unknown>): Promise<void> {
  const result = await callAppObjetosAdmin({ action: 'updateRegistro', id, dados });
  if (!isOk(result)) throw new Error(result.error);
}

export async function excluirRegistroDinamico(id: string): Promise<void> {
  const result = await callAppObjetosAdmin({ action: 'deleteRegistro', id });
  if (!isOk(result)) throw new Error(result.error);
}
