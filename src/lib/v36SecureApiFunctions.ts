import { universoSupabase } from "./supabase";

export type ApiGuidedSaveConnectionInput = {
  name: string;
  base_url: string;
  auth_type: "none" | "bearer" | "oauth2" | "api_key_header" | "api_key_query" | "basic";
  secret?: string;
  credential_type?: string;
  credential_label?: string;
  description?: string;
  provider_id?: string;
  provider_code?: string;
  cliente_id?: string;
  ambiente_id?: string;
  config?: Record<string, unknown>;
};

type FunctionResult<T> = T & {
  ok?: boolean;
  error?: string;
};

function getSupabaseClient() {
  // O fallback pro projeto "POC" saiu daqui: aquele projeto não existe mais (host sem DNS desde
  // 28/08/2026), então cair nele nunca resolveria nada -- só trocava um erro claro de
  // configuração por um erro de rede confuso. Ver comentário em ./supabase.ts.
  const client = universoSupabase;

  if (!client) {
    throw new Error("Supabase não configurado. Confira VITE_SUPABASE_UNIVERSO_URL/VITE_SUPABASE_UNIVERSO_ANON_KEY.");
  }

  return client;
}

async function invokeFunction<T>(functionName: string, body: unknown): Promise<FunctionResult<T>> {
  const client = getSupabaseClient();
  const { data, error } = await client.functions.invoke(functionName, { body });

  if (error) {
    throw new Error(error.message || `Falha ao chamar ${functionName}.`);
  }

  if (data && typeof data === "object" && "ok" in data && data.ok === false) {
    throw new Error(String((data as { error?: string }).error || "Falha na função segura."));
  }

  return data as FunctionResult<T>;
}

/**
 * api_guided_connections.auth_type (migration 019, universo-conectasus-db) só aceita
 * 'none'/'api_key'/'bearer_token'/'basic'/'oauth2'/'custom_header'/'signed_request' -- um
 * vocabulário mais grosso que os modos que a tela de Integrações oferece na UI. A distinção
 * fina (cabeçalho x URL) já viaja separada em credential_type/config.credential_header_name;
 * aqui só traduz pro rótulo que o CHECK constraint aceita antes de chamar a Edge Function,
 * senão o INSERT do lado do banco estoura (23514) pra bearer/api_key_header/api_key_query.
 */
function toDbAuthType(mode: ApiGuidedSaveConnectionInput["auth_type"]): string {
  if (mode === "bearer") return "bearer_token";
  if (mode === "api_key_header" || mode === "api_key_query") return "api_key";
  return mode;
}

export function saveApiGuidedConnection(input: ApiGuidedSaveConnectionInput) {
  return invokeFunction<{
    connection?: { id: string; name: string; base_url: string; auth_type: string; status: string };
    credential?: { id: string; credential_type: string; label: string; public_hint: string; status: string } | null;
  }>("api-guided-save-connection", { ...input, auth_type: toDbAuthType(input.auth_type) });
}

export function testApiGuidedConnection(connectionId: string) {
  return invokeFunction<{
    success: boolean;
    status: number;
    response_time_ms: number;
    preview: string;
  }>("api-guided-test-connection", { connection_id: connectionId });
}

export function testApiGuidedEndpoint(endpointId: string, options: Record<string, unknown> = {}) {
  return invokeFunction<{
    success: boolean;
    status: number;
    response_time_ms: number;
    preview: string;
    discovered_fields?: Array<Record<string, unknown>>;
  }>("api-guided-test-endpoint", { endpoint_id: endpointId, ...options });
}

export function discoverApiGuidedFields(endpointId: string, options: Record<string, unknown> = {}) {
  return invokeFunction<{
    fields_discovered: number;
    fields: Array<Record<string, unknown>>;
  }>("api-guided-discover-fields", { endpoint_id: endpointId, ...options });
}
