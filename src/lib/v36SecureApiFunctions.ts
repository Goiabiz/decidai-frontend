import { pocSupabase, universoSupabase } from "./supabase";

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
  const client = universoSupabase ?? pocSupabase;

  if (!client) {
    throw new Error("Supabase não configurado. Confira VITE_SUPABASE_UNIVERSO_URL/VITE_SUPABASE_UNIVERSO_ANON_KEY ou VITE_SUPABASE_POC_URL/VITE_SUPABASE_POC_ANON_KEY.");
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

export function saveApiGuidedConnection(input: ApiGuidedSaveConnectionInput) {
  return invokeFunction<{
    connection?: { id: string; name: string; base_url: string; auth_type: string; status: string };
    credential?: { id: string; credential_type: string; label: string; public_hint: string; status: string } | null;
  }>("api-guided-save-connection", input);
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
