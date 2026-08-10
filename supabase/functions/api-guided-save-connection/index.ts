import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient, getUserIdFromRequest } from "../_shared/supabaseAdmin.ts";
import { encryptSecret, secretHint } from "../_shared/crypto.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "Método não permitido." }, 405);
  const supabase = createAdminClient();

  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const baseUrl = String(body.base_url || "").trim();
    const authType = String(body.auth_type || "none").trim();
    if (!name) return jsonResponse({ ok: false, error: "Informe o nome da conexão." }, 400);
    if (!baseUrl) return jsonResponse({ ok: false, error: "Informe a URL base." }, 400);

    let providerId = body.provider_id || null;
    if (!providerId && body.provider_code) {
      const { data: provider } = await supabase.from("integration_providers").select("id").eq("code", body.provider_code).maybeSingle();
      providerId = provider?.id || null;
    }

    const { data: connection, error: connectionError } = await supabase.from("api_guided_connections").insert({
      cliente_id: body.cliente_id || null,
      ambiente_id: body.ambiente_id || null,
      created_by_user_id: body.created_by_user_id || getUserIdFromRequest(req),
      provider_id: providerId,
      name,
      description: body.description || null,
      connection_kind: body.connection_kind || "custom_rest_api",
      base_url: baseUrl,
      auth_type: authType,
      status: "configured",
      guided_by_agent: body.guided_by_agent ?? true,
      config: body.config || {},
    }).select("id, name, base_url, auth_type, status").single();
    if (connectionError) throw connectionError;

    let credential = null;
    if (body.secret) {
      const secret = String(body.secret);
      const { data, error } = await supabase.from("api_guided_credentials").insert({
        connection_id: connection.id,
        credential_type: body.credential_type || authType,
        label: body.credential_label || "Credencial principal",
        secret_ciphertext: await encryptSecret(secret),
        public_hint: secretHint(secret),
        status: "configured",
      }).select("id, credential_type, label, public_hint, status").single();
      if (error) throw error;
      credential = data;
    }

    await supabase.from("api_guided_call_logs").insert({
      cliente_id: body.cliente_id || null,
      ambiente_id: body.ambiente_id || null,
      connection_id: connection.id,
      user_id: getUserIdFromRequest(req),
      source: "edge_function",
      action: "save_connection",
      success: true,
      request_summary: { auth_type: authType, has_secret: Boolean(body.secret) },
    });

    return jsonResponse({ ok: true, connection, credential });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) }, 500);
  }
});
