import { handleOptions, jsonResponse } from '../_shared/agent-cors.ts';
import { createServiceClient, readAuthUser } from '../_shared/agent-supabase.ts';

// DecidAI Market v1 -- Reputation Intelligence (Frente F, 19/08/2026, Plano Mestre v4 §6.5).
// Leitura de sinais/fontes é feita direto pelo frontend contra o Supabase (RLS normal, mesmo
// padrão de services/crm.ts) -- esta função só existe pra 1 ação sensível: disparar a
// sincronização real com o Google Business Profile, que precisa rodar no runtime do agente
// (é lá que mora a credencial OAuth). Mesmo contrato de clienteId nunca confiado do corpo,
// sempre resolvido via JWT (fn_resolve_platform_client_id_by_auth_user), igual a flow-admin.
Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Método não permitido.' }, 405);
  }

  try {
    const user = await readAuthUser(request);
    if (!user) {
      return jsonResponse({ ok: false, error: 'Não autenticado.' }, 401);
    }

    const supabase = createServiceClient();
    const body = await request.json();
    const action = body.action;

    const { data: clienteId, error: resolveError } = await supabase.rpc(
      'fn_resolve_platform_client_id_by_auth_user',
      { p_auth_user_id: user.id, p_requested_cliente_id: body.clienteId ?? null },
    );

    if (resolveError) {
      return jsonResponse({ ok: false, error: resolveError.message }, 500);
    }
    if (!clienteId) {
      return jsonResponse({ ok: false, error: 'Usuário sem tenant associado (platform_client_id).' }, 403);
    }

    if (action === 'syncGbp') {
      const runtimeUrl = Deno.env.get('AGENT_RUNTIME_URL');
      const internalToken = Deno.env.get('AGENT_INTERNAL_TOKEN');

      if (!runtimeUrl) {
        return jsonResponse({ ok: false, error: 'AGENT_RUNTIME_URL não configurado.' }, 500);
      }

      const response = await fetch(`${runtimeUrl.replace(/\/$/, '')}/market/gbp/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(internalToken ? { Authorization: `Bearer ${internalToken}` } : {}),
        },
        body: JSON.stringify({ clienteId }),
      });

      const syncResponse = await response.json().catch(() => undefined);

      if (!response.ok || !syncResponse) {
        return jsonResponse({
          ok: false,
          error: syncResponse?.message || `Agent runtime retornou HTTP ${response.status}.`,
          raw: syncResponse,
        }, 502);
      }

      return jsonResponse({
        ok: true,
        sourcesSynced: syncResponse.sourcesSynced,
        signalsUpserted: syncResponse.signalsUpserted,
        errors: syncResponse.errors ?? [],
      });
    }

    return jsonResponse({
      ok: false,
      error: `action desconhecida: "${action}". Use "syncGbp".`,
    }, 400);
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : 'Erro inesperado em market-admin.',
    }, 500);
  }
});
