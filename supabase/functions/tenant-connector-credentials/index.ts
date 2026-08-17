import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";
import { readVerifiedAuthUser } from "../_shared/auth.ts";

// Contrato pedido pela sessão irmã (database/00_controle/brief-frontend-conectores-e-coordenacao-16-08.md,
// item 1): 1 função só, `action` no body (list/set/delete), resolve o tenant via JWT --
// nunca confia em clienteId vindo do corpo pra decidir de QUEM é a credencial, mesmo padrão
// de segurança do knowledge-admin (universo-conectasus-agent). fn_get_tenant_secret nunca é
// chamada aqui -- o valor do segredo nunca volta pro frontend depois de salvo, só o status
// "configurado" (mesmo padrão de gerenciador de senha: escreve, nunca relê).
//
// Decisão de acesso confirmada com o usuário em 16/08/2026: admin_cliente do próprio tenant
// configura normal (resolvido só pelo JWT); staff (admin_operadora/suporte) pode configurar
// em nome de um tenant via "Acessar como", mandando clienteId no corpo -- só é confiado
// depois que fn_resolve_platform_client_id_by_auth_user (migration 053) confirma
// server-side que quem chamou é staff de verdade. Mesma função, mesmo teste, já usados por
// knowledge-admin -- nenhuma lógica de resolução de tenant nova aqui.
Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Método não permitido." }, 405);
  }

  try {
    const user = await readVerifiedAuthUser(request);
    if (!user) {
      return jsonResponse({ ok: false, error: "Não autenticado." }, 401);
    }

    const supabase = createAdminClient();
    const body = await request.json();
    const action = body.action;

    const { data: clienteId, error: resolveError } = await supabase.rpc(
      "fn_resolve_platform_client_id_by_auth_user",
      { p_auth_user_id: user.id, p_requested_cliente_id: body.clienteId ?? null },
    );

    if (resolveError) {
      return jsonResponse({ ok: false, error: resolveError.message }, 500);
    }
    if (!clienteId) {
      return jsonResponse({ ok: false, error: "Usuário sem tenant associado (platform_client_id)." }, 403);
    }

    if (action === "list") {
      const { data, error } = await supabase.rpc("fn_list_tenant_secret_providers", {
        p_cliente_id: clienteId,
      });

      if (error) return jsonResponse({ ok: false, error: error.message }, 500);

      const providers = (data ?? []).map((row: Record<string, unknown>) => ({
        providerCode: row.provider_code,
        updatedAt: row.updated_at,
      }));

      return jsonResponse({ ok: true, providers });
    }

    if (action === "set") {
      const providerCode = String(body.providerCode || "").trim();
      const secretValue = typeof body.secretValue === "string" ? body.secretValue : "";
      if (!providerCode) return jsonResponse({ ok: false, error: "providerCode é obrigatório." }, 400);
      if (!secretValue.trim()) return jsonResponse({ ok: false, error: "secretValue é obrigatório." }, 400);

      const { error } = await supabase.rpc("fn_set_tenant_secret", {
        p_cliente_id: clienteId,
        p_provider_code: providerCode,
        p_secret_value: secretValue,
      });

      if (error) return jsonResponse({ ok: false, error: error.message }, 500);
      return jsonResponse({ ok: true });
    }

    if (action === "delete") {
      const providerCode = String(body.providerCode || "").trim();
      if (!providerCode) return jsonResponse({ ok: false, error: "providerCode é obrigatório." }, 400);

      const { data, error } = await supabase.rpc("fn_delete_tenant_secret", {
        p_cliente_id: clienteId,
        p_provider_code: providerCode,
      });

      if (error) return jsonResponse({ ok: false, error: error.message }, 500);
      if (!data) return jsonResponse({ ok: false, error: "Nenhuma credencial configurada pra esse conector." }, 404);
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ ok: false, error: `action desconhecida: "${action}". Use "list", "set" ou "delete".` }, 400);
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : "Erro inesperado em tenant-connector-credentials.",
    }, 500);
  }
});
