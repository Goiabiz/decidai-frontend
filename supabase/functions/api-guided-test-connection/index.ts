import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";
import { readVerifiedAuthUser } from "../_shared/auth.ts";
import { buildAuthHeaders, fetchWithTimeout, normalizeBaseUrl, safeBodyPreview } from "../_shared/http.ts";

// Achado em auditoria de segurança em 19/08/2026: esta function rodava com service_role
// (bypassa RLS) e nunca checava que `connection_id` pertencia ao tenant de quem chamava --
// qualquer usuário autenticado conseguia descriptografar e usar a credencial de API salva por
// OUTRO tenant, e via a resposta real de volta. Corrigido com o mesmo padrão já usado em
// tenant-connector-credentials/github-app-link/knowledge-admin: resolve o tenant via JWT
// verificado de verdade (readVerifiedAuthUser, não o getUserIdFromRequest antigo que só
// decodifica sem checar assinatura) e escopa a busca da conexão por esse tenant.
Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "Método não permitido." }, 405);
  const supabase = createAdminClient();
  const started = Date.now();

  try {
    const user = await readVerifiedAuthUser(req);
    if (!user) return jsonResponse({ ok: false, error: "Não autenticado." }, 401);

    const body = await req.json();
    if (!body.connection_id) return jsonResponse({ ok: false, error: "connection_id obrigatório." }, 400);

    const { data: clienteId, error: resolveError } = await supabase.rpc(
      "fn_resolve_platform_client_id_by_auth_user",
      { p_auth_user_id: user.id, p_requested_cliente_id: body.cliente_id ?? null },
    );
    if (resolveError) return jsonResponse({ ok: false, error: resolveError.message }, 500);
    if (!clienteId) return jsonResponse({ ok: false, error: "Usuário sem tenant associado (platform_client_id)." }, 403);

    const { data: connection, error: cErr } = await supabase.from("api_guided_connections").select("*").eq("id", body.connection_id).eq("cliente_id", clienteId).maybeSingle();
    if (cErr) throw cErr;
    if (!connection) return jsonResponse({ ok: false, error: "Conexão não encontrada ou não pertence a este tenant." }, 404);
    const { data: credentials, error: credErr } = await supabase.from("api_guided_credentials").select("credential_type, secret_ciphertext").eq("connection_id", body.connection_id).eq("status", "active");
    if (credErr) throw credErr;

    const url = normalizeBaseUrl(connection.base_url);
    const response = await fetchWithTimeout(url, { method: body.method || "GET", headers: await buildAuthHeaders(connection, credentials || []) }, body.timeout_ms || 15000);
    const text = await response.text();
    const elapsed = Date.now() - started;
    const success = response.status >= 200 && response.status < 500;

    await supabase.from("api_guided_connections").update({
      last_test_status: success ? "success" : "failed",
      last_test_at: new Date().toISOString(),
      last_error_message: success ? null : safeBodyPreview(text, 500),
      status: success ? "active" : connection.status,
    }).eq("id", body.connection_id);

    await supabase.from("api_guided_call_logs").insert({
      cliente_id: connection.cliente_id,
      ambiente_id: connection.ambiente_id,
      connection_id: body.connection_id,
      user_id: user.id,
      source: "edge_function",
      action: "test_connection",
      request_summary: { url, method: body.method || "GET" },
      response_status: response.status,
      response_time_ms: elapsed,
      success,
      error_message: success ? null : safeBodyPreview(text, 500),
    });

    return jsonResponse({ ok: true, success, status: response.status, response_time_ms: elapsed, preview: safeBodyPreview(text) });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) }, 500);
  }
});
