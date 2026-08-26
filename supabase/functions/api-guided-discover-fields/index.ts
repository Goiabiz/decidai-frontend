import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";
import { readVerifiedAuthUser } from "../_shared/auth.ts";
import { appendQuery, applyPathParams, buildAuthHeaders, fetchWithTimeout, flattenJsonFields, joinUrl, normalizeBaseUrl, safeBodyPreview } from "../_shared/http.ts";

// Mesmo achado/correção de api-guided-test-connection (auditoria de segurança, 19/08/2026):
// `endpoint_id` nunca era checado contra o tenant de quem chamava -- aqui era ainda mais
// sério, porque a function também SOBRESCREVIA api_guided_response_fields do endpoint alheio.
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
    if (!body.endpoint_id) return jsonResponse({ ok: false, error: "endpoint_id obrigatório." }, 400);

    const { data: clienteId, error: resolveError } = await supabase.rpc(
      "fn_resolve_platform_client_id_by_auth_user",
      { p_auth_user_id: user.id, p_requested_cliente_id: body.cliente_id ?? null },
    );
    if (resolveError) return jsonResponse({ ok: false, error: resolveError.message }, 500);
    if (!clienteId) return jsonResponse({ ok: false, error: "Usuário sem tenant associado (platform_client_id)." }, 403);

    const { data: endpoint, error: eErr } = await supabase.from("api_guided_endpoints").select("*, api_guided_connections!inner(*)").eq("id", body.endpoint_id).eq("api_guided_connections.cliente_id", clienteId).maybeSingle();
    if (eErr) throw eErr;
    if (!endpoint) return jsonResponse({ ok: false, error: "Endpoint não encontrado ou não pertence a este tenant." }, 404);
    const connection = endpoint.api_guided_connections;

    const { data: credentials, error: credErr } = await supabase.from("api_guided_credentials").select("credential_type, secret_ciphertext").eq("connection_id", connection.id).eq("status", "active");
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
      user_id: user.id,
      source: "edge_function",
      action: "discover_fields",
      request_summary: { url, method },
      response_status: response.status,
      response_time_ms: elapsed,
      success,
      error_message: success ? null : safeBodyPreview(text, 500),
    });

    if (!parsed) return jsonResponse({ ok: false, error: "Retorno não é JSON. Não foi possível descobrir campos automaticamente.", preview: safeBodyPreview(text) }, 422);

    await supabase.from("api_guided_response_fields").delete().eq("endpoint_id", body.endpoint_id);
    if (discoveredFields.length) {
      const rows = (discoveredFields as any[]).map((field) => ({
        endpoint_id: body.endpoint_id,
        field_path: field.path,
        field_key: field.key,
        field_label: String(field.key).replace(/_/g, " "),
        data_type: field.dataType,
        sample_value: field.sampleValue,
        description: "Campo descoberto automaticamente pela API guiada.",
        discovered_by_agent: true,
        can_use_in_screen: true,
        can_use_in_alert: true,
        can_use_in_report: true,
        can_use_by_agent: true,
      }));
      const { error: insertErr } = await supabase.from("api_guided_response_fields").insert(rows);
      if (insertErr) throw insertErr;
    }

    return jsonResponse({ ok: true, fields_discovered: discoveredFields.length, fields: discoveredFields });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) }, 500);
  }
});
