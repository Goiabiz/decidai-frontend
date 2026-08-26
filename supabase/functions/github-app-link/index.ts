import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabaseAdmin.ts";
import { readVerifiedAuthUser } from "../_shared/auth.ts";

// Contrato da sessão irmã (database/00_controle/brief-github-app-conexao-17-08.md): GitHub App
// "DecidAI" (org DecidAI-io, App ID 4630733) substitui o fluxo de instalação manual por PAT.
// Instalar um GitHub App NÃO é OAuth -- o GitHub redireciona direto pra uma Setup URL com
// `installation_id` na query, sem nenhum código/token pra trocar no frontend. Esta function:
// 1) resolve o tenant só via JWT (mesma disciplina de tenant-connector-credentials/
//    knowledge-admin, nunca confia em clienteId do corpo pra decidir de QUEM é a instalação);
// 2) busca os dados reais da instalação chamando a rota HTTP que ela já expôs e provou real
//    (GET /connectors/github-app/installations/:id, autenticada com o mesmo token interno
//    compartilhado que agent-run já usa -- AGENT_RUNTIME_URL/AGENT_INTERNAL_TOKEN, secrets já
//    configurados neste projeto Supabase);
// 3) grava o vínculo via fn_link_github_installation (migration 060, já aplicada).
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
      const { data, error } = await supabase.rpc("fn_list_github_installations", {
        p_cliente_id: clienteId,
      });

      if (error) return jsonResponse({ ok: false, error: error.message }, 500);

      const installations = (data ?? []).map((row: Record<string, unknown>) => ({
        installationId: String(row.installation_id),
        accountLogin: row.account_login,
        accountType: row.account_type,
        repositorySelection: row.repository_selection,
        createdAt: row.created_at,
      }));

      return jsonResponse({ ok: true, installations });
    }

    if (action === "link") {
      const installationId = String(body.installationId || "").trim();
      if (!installationId || !/^\d+$/.test(installationId)) {
        return jsonResponse({ ok: false, error: "installationId é obrigatório e precisa ser numérico." }, 400);
      }

      const runtimeUrl = Deno.env.get("AGENT_RUNTIME_URL");
      const internalToken = Deno.env.get("AGENT_INTERNAL_TOKEN");
      if (!runtimeUrl) {
        return jsonResponse({ ok: false, error: "AGENT_RUNTIME_URL não configurado." }, 500);
      }

      const lookupResponse = await fetch(
        `${runtimeUrl.replace(/\/$/, "")}/connectors/github-app/installations/${installationId}`,
        {
          headers: {
            ...(internalToken ? { Authorization: `Bearer ${internalToken}` } : {}),
          },
        },
      );

      const lookup = await lookupResponse.json().catch(() => undefined);
      if (!lookupResponse.ok || !lookup?.ok) {
        return jsonResponse({
          ok: false,
          error: `Não foi possível confirmar a instalação no GitHub (HTTP ${lookupResponse.status}).`,
          raw: lookup,
        }, 502);
      }

      const { data: linkedId, error: linkError } = await supabase.rpc("fn_link_github_installation", {
        p_cliente_id: clienteId,
        p_installation_id: Number(lookup.installationId),
        p_account_login: lookup.accountLogin,
        p_account_type: lookup.accountType,
        p_repository_selection: lookup.repositorySelection,
      });

      if (linkError) return jsonResponse({ ok: false, error: linkError.message }, 500);
      if (!linkedId) return jsonResponse({ ok: false, error: "Não foi possível vincular a instalação." }, 500);

      return jsonResponse({
        ok: true,
        installation: {
          installationId: String(lookup.installationId),
          accountLogin: lookup.accountLogin,
          accountType: lookup.accountType,
          repositorySelection: lookup.repositorySelection,
        },
      });
    }

    if (action === "delete") {
      const installationId = String(body.installationId || "").trim();
      if (!installationId || !/^\d+$/.test(installationId)) {
        return jsonResponse({ ok: false, error: "installationId é obrigatório e precisa ser numérico." }, 400);
      }

      const { data, error } = await supabase.rpc("fn_delete_github_installation", {
        p_cliente_id: clienteId,
        p_installation_id: Number(installationId),
      });

      if (error) return jsonResponse({ ok: false, error: error.message }, 500);
      if (!data) return jsonResponse({ ok: false, error: "Instalação não encontrada pra este tenant." }, 404);

      return jsonResponse({ ok: true });
    }

    return jsonResponse({ ok: false, error: `action desconhecida: "${action}". Use "list", "link" ou "delete".` }, 400);
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : "Erro inesperado em github-app-link.",
    }, 500);
  }
});
