import { universoSupabase } from '../lib/supabase';

export type GithubAppInstallation = {
  installationId: string;
  accountLogin: string;
  accountType: string;
  repositorySelection: string;
  createdAt?: string;
};

type GithubAppOk<T> = { ok: true; data: T };
type GithubAppErr = { ok: false; error: string };
type GithubAppResult<T> = GithubAppOk<T> | GithubAppErr;

function isOk<T>(result: GithubAppResult<T>): result is GithubAppOk<T> {
  return result.ok === true;
}

/** Mesmo problema do `functions.invoke()` corrigido em baseConhecimento.ts/tenantCredentials.ts. */
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

async function callGithubAppLink<T = Record<string, never>>(body: Record<string, unknown>): Promise<GithubAppResult<T>> {
  const client = universoSupabase;
  if (!client) return { ok: false, error: 'Supabase não configurado.' };

  try {
    const { data, error } = await client.functions.invoke('github-app-link', { body });
    if (error) return { ok: false, error: await extractFunctionErrorMessage(error) };
    const payload = data as { ok?: boolean; error?: string } & T;
    if (!payload || payload.ok !== true) return { ok: false, error: payload?.error || 'Resposta vazia.' };
    return { ok: true, data: payload };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Falha ao chamar github-app-link.' };
  }
}

export async function listGithubInstallations(clienteId?: string | null): Promise<{ installations: GithubAppInstallation[]; error?: string }> {
  const result = await callGithubAppLink<{ installations: GithubAppInstallation[] }>({ action: 'list', clienteId: clienteId || null });
  if (isOk(result)) return { installations: result.data.installations };
  return { installations: [], error: result.error };
}

export async function linkGithubInstallation(installationId: string, clienteId?: string | null): Promise<GithubAppInstallation> {
  const result = await callGithubAppLink<{ installation: GithubAppInstallation }>({ action: 'link', installationId, clienteId: clienteId || null });
  if (!isOk(result)) throw new Error(result.error);
  return result.data.installation;
}

export async function unlinkGithubInstallation(installationId: string, clienteId?: string | null): Promise<void> {
  const result = await callGithubAppLink({ action: 'delete', installationId, clienteId: clienteId || null });
  if (!isOk(result)) throw new Error(result.error);
}
