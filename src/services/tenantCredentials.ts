import { universoSupabase } from '../lib/supabase';

export type ConnectorProviderCode = 'github' | 'jira' | 'confluence' | 'mariadb' | 'trello';

export type TenantCredentialStatus = {
  providerCode: string;
  updatedAt: string;
};

type CredentialsAdminOk<T> = { ok: true; data: T };
type CredentialsAdminErr = { ok: false; error: string };
type CredentialsAdminResult<T> = CredentialsAdminOk<T> | CredentialsAdminErr;

function isOk<T>(result: CredentialsAdminResult<T>): result is CredentialsAdminOk<T> {
  return result.ok === true;
}

/**
 * Mesmo problema do `functions.invoke()` já corrigido em baseConhecimento.ts: em erro
 * (non-2xx), `error.message` é genérico -- o corpo JSON real fica em `error.context`.
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

async function callCredentialsAdmin<T = Record<string, never>>(body: Record<string, unknown>): Promise<CredentialsAdminResult<T>> {
  const client = universoSupabase;
  if (!client) return { ok: false, error: 'Supabase não configurado.' };

  try {
    const { data, error } = await client.functions.invoke('tenant-connector-credentials', { body });
    if (error) return { ok: false, error: await extractFunctionErrorMessage(error) };
    const payload = data as { ok?: boolean; error?: string } & T;
    if (!payload || payload.ok !== true) return { ok: false, error: payload?.error || 'Resposta vazia.' };
    return { ok: true, data: payload };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Falha ao chamar tenant-connector-credentials.' };
  }
}

/** `clienteId` só importa pra staff "Acessando como" um tenant -- ver knowledge-admin/baseConhecimento.ts pro mesmo padrão. */
export async function listTenantCredentials(clienteId?: string | null): Promise<{ providers: TenantCredentialStatus[]; error?: string }> {
  const result = await callCredentialsAdmin<{ providers: TenantCredentialStatus[] }>({ action: 'list', clienteId: clienteId || null });
  if (isOk(result)) return { providers: result.data.providers };
  return { providers: [], error: result.error };
}

export async function setTenantCredential(providerCode: ConnectorProviderCode, secretValue: string, clienteId?: string | null): Promise<void> {
  const result = await callCredentialsAdmin({ action: 'set', providerCode, secretValue, clienteId: clienteId || null });
  if (!isOk(result)) throw new Error(result.error);
}

export async function deleteTenantCredential(providerCode: ConnectorProviderCode, clienteId?: string | null): Promise<void> {
  const result = await callCredentialsAdmin({ action: 'delete', providerCode, clienteId: clienteId || null });
  if (!isOk(result)) throw new Error(result.error);
}
