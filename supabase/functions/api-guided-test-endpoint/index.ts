import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient, getUserIdFromRequest } from "../_shared/supabaseAdmin.ts";
import { appendQuery, applyPathParams, buildAuthHeaders, fetchWithTimeout, flattenJsonFields, joinUrl, normalizeBaseUrl, safeBodyPreview } from "../_shared/http.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "Método não permitido." }, 405);
  const supabase = createAdminClient();
  const started = Date.now();

  try {
    const body = await req.json();
    if (!body.endpoint_id) return jsonResponse({ ok: false, error: "endpoint_id obrigatório." }, 400);

    const { data: endpoint, error: eErr } = await supabase.from("api_guided_endpoints").select("*, api_guided_connections(*)").eq("id", body.endpoint_id).single();
    if (eErr) throw eErr;
    const connection = endpoint.api_guided_connections;

    const { data: credentials, error: credErr } = await supabase.from("api_guided_credentials").select("credential_type, secret_ciphertext").eq("connection_id", connection.id).eq("status", "configured");
    if (credErr) throw credErr;

    const path = applyPathParams(endpoint.path_template, body.path_params || {});
    const url = appendQuery(joinUrl(normalizeBaseUrl(connection.base_url), path), body.query || {});
    const headers = { ...(await buildAuthHeaders(connection, credentials || [])), ...(body.headers || {}) };
    if (endpoint.request_content_type) headers["Content-Type"] = endpoint.request_content_type;

    const method = endpoint.http_method || "GET";
    const init: RequestInit = { method, headers };
    if (!["GET", "HEAD"].includes(method.toUpperCase()) && body.body !== undefined) {
      init.body = typeof body.body === "string" ? body.body : JSON.stringify(body.body);
    }

    const response = await fetchWithTimeout(url, init, body.timeout_ms || 20000);
    const text = await response.text();
    const elapsed = Date.now() - started;
    const success = response.status >= 200 && response.status < 500;

    let parsed: unknown = null;
    let discoveredFields: unknown[] = [];
    try { parsed = text ? JSON.parse(text) : null; discoveredFields = flattenJsonFields(parsed, "", body.max_fields || 80); } catch { parsed = null; }

    await supabase.from("api_guided_endpoints").update({
      last_test_status: success ? "success" : "failed",
      last_test_at: new Date().toISOString(),
      last_error_message: success ? null : safeBodyPreview(text, 500),
      response_sample: parsed ?? { preview: safeBodyPreview(text, 1000) },
      status: success ? "active" : endpoint.status,
    }).eq("id", body.endpoint_id);

    await supabase.from("api_guided_call_logs").insert({
      cliente_id: connection.cliente_id,
      ambiente_id: connection.ambiente_id,
      connection_id: connection.id,
      endpoint_id: body.endpoint_id,
      user_id: getUserIdFromRequest(req),
      source: "edge_function",
      action: "test_endpoint",
      request_summary: { url, method },
      response_status: response.status,
      response_time_ms: elapsed,
      success,
      error_message: success ? null : safeBodyPreview(text, 500),
    });

    return jsonResponse({ ok: true, success, status: response.status, response_time_ms: elapsed, preview: safeBodyPreview(text), discovered_fields: discoveredFields });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) }, 500);
  }
});
