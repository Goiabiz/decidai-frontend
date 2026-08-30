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

    // Preço dos planos (migration 125, monthly_price_brl/overage_price_per_usd_brl) -- ação
    // administrativa cross-tenant de propósito (platform_plans não pertence a nenhum cliente),
    // então fica ANTES da resolução de clienteId abaixo (que existe pra ações de UM tenant
    // específico). RLS de platform_plans não dá UPDATE nem pra authenticated nem pra staff --
    // só service_role tem GRANT (migration 020) -- por isso precisa passar por Edge Function,
    // não dá pra fazer com supabase.rpc/direct update do frontend.
    if (action === 'updatePlanPricing') {
      const { data: isStaff, error: staffError } = await supabase.rpc('fn_is_staff_sem_tenant', { p_auth_user_id: user.id });
      if (staffError) return jsonResponse({ ok: false, error: staffError.message }, 500);
      if (!isStaff) return jsonResponse({ ok: false, error: 'Apenas suporte/administrador da operadora pode editar preço de plano.' }, 403);

      const planCode = body.planCode;
      const monthlyPriceBrl = body.monthlyPriceBrl;
      // overagePricePerUsdBrl virou OPCIONAL (30/08/2026): o modelo comercial deixou de ter
      // excedente -- é limite rígido + recarga (decisoes-usuario-29-08-rodada-noite.md). A tela
      // de admin não edita mais esse campo. Segue aceito no corpo só pra não quebrar um chamador
      // antigo, mas quando ausente a coluna NÃO é tocada (fica NULL, que é o estado correto).
      const overagePricePerUsdBrl = body.overagePricePerUsdBrl;
      const temOverage = overagePricePerUsdBrl !== undefined && overagePricePerUsdBrl !== null;

      if (!['basic', 'team', 'pro', 'business', 'scale', 'enterprise'].includes(planCode)) {
        return jsonResponse({ ok: false, error: `planCode inválido: "${planCode}". Trial é sempre R$0 e não é editável aqui.` }, 400);
      }
      if (typeof monthlyPriceBrl !== 'number' || !Number.isFinite(monthlyPriceBrl) || monthlyPriceBrl < 0) {
        return jsonResponse({ ok: false, error: 'monthlyPriceBrl precisa ser um número >= 0.' }, 400);
      }
      if (temOverage && (typeof overagePricePerUsdBrl !== 'number' || !Number.isFinite(overagePricePerUsdBrl) || overagePricePerUsdBrl < 0)) {
        return jsonResponse({ ok: false, error: 'overagePricePerUsdBrl, se enviado, precisa ser um número >= 0.' }, 400);
      }

      const { data: updated, error: updateError } = await supabase
        .from('platform_plans')
        .update({
          monthly_price_brl: monthlyPriceBrl,
          ...(temOverage ? { overage_price_per_usd_brl: overagePricePerUsdBrl } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('code', planCode)
        .select('code, name, monthly_price_brl, overage_price_per_usd_brl')
        .maybeSingle();

      if (updateError) return jsonResponse({ ok: false, error: updateError.message }, 500);
      if (!updated) return jsonResponse({ ok: false, error: `Plano "${planCode}" não encontrado.` }, 404);

      return jsonResponse({ ok: true, plan: updated });
    }

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

    // Gatilho manual de dunning (§35, migration 125) -- botão "Executar cobrança agora",
    // staff-only. Diferente de createGatewayCharge (qualquer tenant pode cobrar a própria
    // fatura): aqui quem aciona precisa ser staff da operadora, checado via
    // fn_is_staff_sem_tenant (mesmo padrão de knowledge-admin, migration 114) porque o
    // service_role desta função não enxerga usuarios_sistema direto (sem GRANT de propósito).
    if (action === 'runDunningNow') {
      if (!body.invoiceId) return jsonResponse({ ok: false, error: 'invoiceId é obrigatório.' }, 400);

      const { data: isStaff, error: staffError } = await supabase.rpc('fn_is_staff_sem_tenant', { p_auth_user_id: user.id });
      if (staffError) return jsonResponse({ ok: false, error: staffError.message }, 500);
      if (!isStaff) return jsonResponse({ ok: false, error: 'Apenas suporte/administrador da operadora pode executar cobrança manual.' }, 403);

      const runtimeUrl = Deno.env.get('AGENT_RUNTIME_URL');
      const internalToken = Deno.env.get('AGENT_INTERNAL_TOKEN');
      if (!runtimeUrl) return jsonResponse({ ok: false, error: 'AGENT_RUNTIME_URL não configurado.' }, 500);

      const response = await fetch(`${runtimeUrl.replace(/\/$/, '')}/billing/dunning/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(internalToken ? { Authorization: `Bearer ${internalToken}` } : {}),
        },
        body: JSON.stringify({ invoiceId: body.invoiceId }),
      });

      const runResponse = await response.json().catch(() => undefined);

      if (!response.ok || !runResponse) {
        return jsonResponse({
          ok: false,
          error: runResponse?.message || `Agent runtime retornou HTTP ${response.status}.`,
        }, 502);
      }

      return jsonResponse(runResponse);
    }

    return jsonResponse({
      ok: false,
      error: `action desconhecida: "${action}". Use "createGatewayCharge", "runDunningNow" ou "updatePlanPricing".`,
    }, 400);
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : 'Erro inesperado em billing-admin.',
    }, 500);
  }
});
