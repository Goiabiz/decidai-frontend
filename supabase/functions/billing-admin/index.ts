import { handleOptions, jsonResponse } from '../_shared/agent-cors.ts';
import { createServiceClient, readAuthUser } from '../_shared/agent-supabase.ts';

// DecidAI Core / Billing -- Payment Provider real (23/08/2026, gateway C6 Bank, seção 25/26
// do roadmap). Fechamento/leitura de fatura são direto contra o Supabase (RLS + RPC, ver
// services/billing.ts) -- esta função só existe pra criar a cobrança Pix real, que precisa
// rodar no runtime do agente (é lá que mora o certificado mTLS do C6). Mesmo contrato de
// clienteId nunca confiado do corpo, sempre resolvido via JWT, igual market-admin/flow-admin.
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

    if (action === 'createGatewayCharge') {
      if (!body.invoiceId) return jsonResponse({ ok: false, error: 'invoiceId é obrigatório.' }, 400);

      const runtimeUrl = Deno.env.get('AGENT_RUNTIME_URL');
      const internalToken = Deno.env.get('AGENT_INTERNAL_TOKEN');
      if (!runtimeUrl) return jsonResponse({ ok: false, error: 'AGENT_RUNTIME_URL não configurado.' }, 500);

      const response = await fetch(`${runtimeUrl.replace(/\/$/, '')}/billing/gateway/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(internalToken ? { Authorization: `Bearer ${internalToken}` } : {}),
        },
        body: JSON.stringify({ invoiceId: body.invoiceId, clienteId }),
      });

      const chargeResponse = await response.json().catch(() => undefined);

      if (!response.ok || !chargeResponse) {
        return jsonResponse({
          ok: false,
          error: chargeResponse?.message || `Agent runtime retornou HTTP ${response.status}.`,
        }, 502);
      }

      return jsonResponse(chargeResponse);
    }

    return jsonResponse({
      ok: false,
      error: `action desconhecida: "${action}". Use "createGatewayCharge".`,
    }, 400);
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : 'Erro inesperado em billing-admin.',
    }, 500);
  }
});
