import { universoSupabase } from '../lib/supabase';
import { callEdgeFunction, isEdgeFunctionOk } from '../lib/edgeFunction';

// DecidAI Core / Billing v1 (Plano Mestre v4 §29-36) -- Frente F. Fatura como documento real
// (Pricing + Billing Engine), sem gateway de pagamento ainda. Chamadas diretas via
// supabase.rpc(), mesmo padrão já usado em services/auth.ts (fn_claim_pending_usuario_cliente)
// -- as funções fn_close_billing_period/fn_mark_invoice_paid já se auto-protegem (staff-only,
// checado dentro da função via fn_current_usuario_sistema()), não precisa de Edge Function.

export type InvoiceStatus = 'open' | 'paid' | 'void';

export type DunningStage = 'none' | 'vencido' | 'retry' | 'negociacao' | 'suspenso';

export type BillingInvoice = {
  id: string;
  planCode: string;
  periodStart: string;
  periodEnd: string;
  planFixedAmountBrl: number;
  usageRawCostUsd: number;
  usageIncludedUsd: number;
  usageOverageUsd: number;
  usageBilledAmountBrl: number;
  totalAmountBrl: number;
  status: InvoiceStatus;
  dueDate: string;
  paidAt: string | null;
  gatewayProvider: string | null;
  gatewayQrCode: string | null;
  dunningStage: DunningStage;
  dunningAttempts: number;
};

export type BillingInvoiceItem = {
  id: string;
  kind: 'plan_fee' | 'usage_overage';
  description: string;
  amountBrl: number;
};

export type PlanPricing = {
  code: string;
  name: string;
  clientName: string;
  monthlyPriceBrl: number | null;
  includedCreditsUsd: number;
  overagePricePerUsdBrl: number | null;
};

// Override de preço por contrato (migration 20260830023640) -- primeiro uso é o preço founders
// (100 primeiros assinantes, 50% por 30 dias). RLS já libera leitura pro próprio tenant, então a
// consulta é direta, sem Edge Function: o cliente ver o desconto dele não é operação privilegiada.
export type PriceOverride = {
  descontoPercentual: number;
  vigenciaInicio: string;
  vigenciaFim: string;
  motivo: string;
  foundersSeq: number | null;
};

export type AdminPlanPricing = {
  code: string;
  name: string;
  monthlyPriceBrl: number | null;
  includedCreditsUsd: number;
  overagePricePerUsdBrl: number | null;
  updatedAt: string;
};

function requireClient() {
  if (!universoSupabase) throw new Error('Supabase não configurado neste ambiente.');
  return universoSupabase;
}

function mapInvoice(row: Record<string, unknown>): BillingInvoice {
  return {
    id: row.id as string,
    planCode: row.plan_code as string,
    periodStart: row.period_start as string,
    periodEnd: row.period_end as string,
    planFixedAmountBrl: Number(row.plan_fixed_amount_brl),
    usageRawCostUsd: Number(row.usage_raw_cost_usd),
    usageIncludedUsd: Number(row.usage_included_usd),
    usageOverageUsd: Number(row.usage_overage_usd),
    usageBilledAmountBrl: Number(row.usage_billed_amount_brl),
    totalAmountBrl: Number(row.total_amount_brl),
    status: row.status as InvoiceStatus,
    dueDate: row.due_date as string,
    paidAt: (row.paid_at as string) || null,
    gatewayProvider: (row.gateway_provider as string) || null,
    gatewayQrCode: (row.gateway_qr_code as string) || null,
    dunningStage: (row.dunning_stage as DunningStage) || 'none',
    dunningAttempts: Number(row.dunning_attempts ?? 0),
  };
}

export async function listInvoices(clienteId: string): Promise<BillingInvoice[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('billing_invoices')
    .select('id, plan_code, period_start, period_end, plan_fixed_amount_brl, usage_raw_cost_usd, usage_included_usd, usage_overage_usd, usage_billed_amount_brl, total_amount_brl, status, due_date, paid_at, gateway_provider, gateway_qr_code, dunning_stage, dunning_attempts')
    .eq('cliente_id', clienteId)
    .order('period_start', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapInvoice);
}

export async function listInvoiceItems(invoiceId: string): Promise<BillingInvoiceItem[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('billing_invoice_items')
    .select('id, kind, description, amount_brl')
    .eq('invoice_id', invoiceId);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    kind: row.kind as BillingInvoiceItem['kind'],
    description: row.description as string,
    amountBrl: Number(row.amount_brl),
  }));
}

export async function getPlanPricing(clienteId: string): Promise<PlanPricing | null> {
  const client = requireClient();
  const { data: cliente, error: clienteError } = await client
    .from('platform_clients')
    .select('plano_id, trade_name, name')
    .eq('id', clienteId)
    .maybeSingle();
  if (clienteError) throw clienteError;
  if (!cliente?.plano_id) return null;

  const { data: plano, error: planoError } = await client
    .from('platform_plans')
    .select('code, name, monthly_price_brl, included_credits_usd, overage_price_per_usd_brl')
    .eq('id', cliente.plano_id)
    .maybeSingle();
  if (planoError) throw planoError;
  if (!plano) return null;

  return {
    code: plano.code,
    name: plano.name,
    clientName: (cliente.trade_name as string | null) || cliente.name,
    monthlyPriceBrl: plano.monthly_price_brl === null ? null : Number(plano.monthly_price_brl),
    includedCreditsUsd: Number(plano.included_credits_usd),
    overagePricePerUsdBrl: plano.overage_price_per_usd_brl === null ? null : Number(plano.overage_price_per_usd_brl),
  };
}

// Tela de admin de preço dos planos (missão 29/08, frente F) -- leitura é direto contra
// platform_plans (RLS libera SELECT pra qualquer authenticated, mesma política de sempre pra
// dado de referência global). Escrita é só basic/pro/enterprise, staff-only -- ver
// updatePlanPricing() mais abaixo, que passa pela Edge Function billing-admin.
export async function listAdminPlanPricing(): Promise<AdminPlanPricing[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('platform_plans')
    .select('code, name, monthly_price_brl, included_credits_usd, overage_price_per_usd_brl, updated_at')
    .neq('code', 'trial')
    .order('code');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    code: row.code as string,
    name: row.name as string,
    monthlyPriceBrl: row.monthly_price_brl === null ? null : Number(row.monthly_price_brl),
    includedCreditsUsd: Number(row.included_credits_usd),
    overagePricePerUsdBrl: row.overage_price_per_usd_brl === null ? null : Number(row.overage_price_per_usd_brl),
    updatedAt: row.updated_at as string,
  }));
}

// Desconto vigente HOJE para este cliente, se houver. Devolve null quando não há nenhum -- o que
// é o caso da maioria (o programa founders tem 100 vagas). A constraint de exclusão no banco
// garante no máximo 1 override por dia por cliente, então `maybeSingle()` é seguro aqui.
export async function getActivePriceOverride(clienteId: string): Promise<PriceOverride | null> {
  const client = requireClient();
  const hoje = new Date().toISOString().slice(0, 10);
  const { data, error } = await client
    .from('client_price_overrides')
    .select('desconto_percentual, vigencia_inicio, vigencia_fim, motivo, founders_seq')
    .eq('cliente_id', clienteId)
    .lte('vigencia_inicio', hoje)
    .gte('vigencia_fim', hoje)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    descontoPercentual: Number(data.desconto_percentual),
    vigenciaInicio: data.vigencia_inicio as string,
    vigenciaFim: data.vigencia_fim as string,
    motivo: data.motivo as string,
    foundersSeq: data.founders_seq === null ? null : Number(data.founders_seq),
  };
}

// Troca de plano (§36, migration 123) -- via função SECURITY DEFINER, não update direto: ela
// checa autorização real (staff OU admin do próprio cliente) e bloqueia downgrade que estouraria
// limite já em uso. Chamável tanto pelo staff (impersonando um cliente) quanto pelo próprio
// admin_cliente logado -- mesma função pros dois casos.
export async function requestPlanChange(clienteId: string, planoId: string): Promise<{ ok: true } | { error: string }> {
  const client = requireClient();
  const { error } = await client.rpc('fn_request_plan_change', { p_cliente_id: clienteId, p_new_plano_id: planoId });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function closeBillingPeriod(clienteId: string, periodStart: string, periodEnd: string): Promise<{ id: string } | { error: string }> {
  const client = requireClient();
  const { data, error } = await client.rpc('fn_close_billing_period', {
    p_cliente_id: clienteId,
    p_period_start: periodStart,
    p_period_end: periodEnd,
  });
  if (error) return { error: error.message };
  return { id: data as string };
}

export async function markInvoicePaid(invoiceId: string): Promise<{ ok: true } | { error: string }> {
  const client = requireClient();
  const { error } = await client.rpc('fn_mark_invoice_paid', { p_invoice_id: invoiceId });
  if (error) return { error: error.message };
  return { ok: true };
}

// extractBillingFunctionErrorMessage/callEdgeFunction moraram aqui até a reforma de 29/08 --
// agora vêm de lib/edgeFunction.ts, mesmo helper usado por baseConhecimento.ts e qualquer
// serviço novo que chame Edge Function (elimina a duplicação do contorno pro bug real de
// `functions.invoke()` só devolver mensagem de erro genérica).

export async function createGatewayCharge(invoiceId: string, clienteId?: string | null): Promise<
  { chargeId: string; qrCode: string; expiresAt: string } | { error: string }
> {
  const result = await callEdgeFunction<{ chargeId: string; qrCode: string; expiresAt: string }>('billing-admin', {
    action: 'createGatewayCharge', invoiceId, clienteId: clienteId || null,
  });
  if (!isEdgeFunctionOk(result)) return { error: result.error };
  return { chargeId: result.data.chargeId, qrCode: result.data.qrCode, expiresAt: result.data.expiresAt };
}

// Gatilho manual de dunning (§35, migration 125) -- staff-only, checado de verdade dentro da
// Edge Function (fn_is_staff_sem_tenant), não só escondido aqui. Roda a MESMA lógica que o
// poller agendado (AGENT_DUNNING_ENABLED) usaria -- prova o mecanismo sem depender de confirmar
// a env var no Railway.
export async function runDunningNow(invoiceId: string, clienteId?: string | null): Promise<{ message: string } | { error: string }> {
  const result = await callEdgeFunction<{ message: string }>('billing-admin', {
    action: 'runDunningNow', invoiceId, clienteId: clienteId || null,
  });
  if (!isEdgeFunctionOk(result)) return { error: result.error };
  return { message: result.data.message };
}

// Edição de preço de plano (missão 29/08, frente F) -- staff-only, checado de verdade dentro da
// Edge Function (fn_is_staff_sem_tenant), igual runDunningNow. platform_plans não tem GRANT de
// UPDATE nenhum pra authenticated (só service_role) -- não dá pra fazer isso com supabase.rpc
// direto do frontend, precisa passar pela Edge Function.
export async function updatePlanPricing(
  planCode: string,
  monthlyPriceBrl: number,
  overagePricePerUsdBrl: number,
): Promise<{ ok: true } | { error: string }> {
  const result = await callEdgeFunction('billing-admin', {
    action: 'updatePlanPricing', planCode, monthlyPriceBrl, overagePricePerUsdBrl,
  });
  if (!isEdgeFunctionOk(result)) return { error: result.error };
  return { ok: true };
}
