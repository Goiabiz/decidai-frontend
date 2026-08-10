import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient, getUserIdFromRequest } from "../_shared/supabaseAdmin.ts";
import { buildAuthHeaders, fetchWithTimeout, normalizeBaseUrl, safeBodyPreview } from "../_shared/http.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "Método não permitido." }, 405);
  const supabase = createAdminClient();
  const started = Date.now();

  try {
    const body = await req.json();
    if (!body.connection_id) return jsonResponse({ ok: false, error: "connection_id obrigatório." }, 400);

    const { data: connection, error: cErr } = await supabase.from("api_guided_connections").select("*").eq("id", body.connection_id).single();
    if (cErr) throw cErr;
    const { data: credentials, error: credErr } = await supabase.from("api_guided_credentials").select("credential_type, secret_ciphertext").eq("connection_id", body.connection_id).eq("status", "configured");
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
      user_id: getUserIdFromRequest(req),
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
