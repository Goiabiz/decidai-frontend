import { handleOptions, jsonResponse } from '../_shared/agent-cors.ts';
import { createServiceClient, readAuthUser } from '../_shared/agent-supabase.ts';

// Motor de Flow v1 (Frente G). Mesmo contrato de 1 função + campo `action` já usado em
// knowledge-admin (database/00_controle/reply-knowledge-edge-function-contract.md) --
// clienteId NUNCA vem confiado do corpo, sempre resolvido a partir do JWT de quem chamou via
// fn_resolve_platform_client_id_by_auth_user (mesma disciplina que corrigiu o achado crítico
// de agent-run na auditoria de 19/08/2026).
//
// Ações de definição/passo/run (list/get/upsertDefinition/saveSteps/deleteDefinition/
// listRuns/getRun) chamam as funções SECURITY DEFINER da migration 064 direto -- não
// precisam do runtime Node. Só `run` (disparar uma execução de verdade) encaminha pro agent
// runtime (Railway), mesmo padrão de agent-run: AGENT_RUNTIME_URL + AGENT_INTERNAL_TOKEN.
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

    if (action === 'list') {
      const { data, error } = await supabase.rpc('fn_list_flow_definitions', {
        p_cliente_id: clienteId,
        p_ambiente_id: body.ambienteId ?? null,
      });

      if (error) return jsonResponse({ ok: false, error: error.message }, 500);

      const items = (data ?? []).map((row: Record<string, unknown>) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        usageArea: row.usage_area,
        status: row.status,
        triggerType: row.trigger_type,
        cronExpression: row.cron_expression,
        isActive: row.is_active,
        nextRunAt: row.next_run_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return jsonResponse({ ok: true, items });
    }

    if (action === 'get') {
      if (!body.id) return jsonResponse({ ok: false, error: 'id é obrigatório.' }, 400);

      const { data, error } = await supabase.rpc('fn_get_flow_with_steps', {
        p_flow_id: body.id,
        p_cliente_id: clienteId,
      });

      if (error) return jsonResponse({ ok: false, error: error.message }, 500);
      if (!data || !data.definition) return jsonResponse({ ok: false, error: 'Flow não encontrado ou não pertence a este tenant.' }, 404);

      const d = data.definition as Record<string, unknown>;
      const steps = (data.steps as Record<string, unknown>[]) ?? [];

      return jsonResponse({
        ok: true,
        flow: {
          id: d.id,
          code: d.code,
          name: d.name,
          description: d.description,
          usageArea: d.usage_area,
          status: d.status,
          triggerType: d.trigger_type,
          cronExpression: d.cron_expression,
          isActive: d.is_active,
          nextRunAt: d.next_run_at,
        },
        steps: steps.map((s) => ({
          id: s.id,
          stepOrder: s.step_order,
          stepType: s.step_type,
          instruction: s.instruction,
          requiresHumanApproval: s.requires_human_approval,
          config: s.config,
        })),
      });
    }

    if (action === 'upsertDefinition') {
      if (!body.name || !body.usageArea) {
        return jsonResponse({ ok: false, error: 'name e usageArea são obrigatórios.' }, 400);
      }

      const triggerType = body.triggerType === 'cron' ? 'cron' : 'manual';
      if (triggerType === 'cron' && !body.cronExpression) {
        return jsonResponse({ ok: false, error: 'cronExpression é obrigatório quando triggerType=cron.' }, 400);
      }

      const { data, error } = await supabase.rpc('fn_upsert_flow_definition', {
        p_id: body.id ?? null,
        p_cliente_id: clienteId,
        p_ambiente_id: body.ambienteId ?? null,
        p_code: body.code ?? `flow_${crypto.randomUUID().slice(0, 8)}`,
        p_name: body.name,
        p_description: body.description ?? null,
        p_usage_area: body.usageArea,
        p_status: body.status ?? 'active',
        p_trigger_type: triggerType,
        p_cron_expression: triggerType === 'cron' ? body.cronExpression : null,
        p_is_active: body.isActive ?? true,
      });

      if (error) return jsonResponse({ ok: false, error: error.message }, 500);
      return jsonResponse({ ok: true, id: data });
    }

    if (action === 'saveSteps') {
      if (!body.id) return jsonResponse({ ok: false, error: 'id é obrigatório.' }, 400);
      if (!Array.isArray(body.steps)) return jsonResponse({ ok: false, error: 'steps deve ser uma lista.' }, 400);

      const steps = body.steps.map((s: Record<string, unknown>, index: number) => ({
        step_order: typeof s.stepOrder === 'number' ? s.stepOrder : index + 1,
        step_type: s.stepType,
        instruction: s.instruction,
        requires_human_approval: Boolean(s.requiresHumanApproval),
        config: s.config ?? {},
      }));

      const { error } = await supabase.rpc('fn_save_flow_steps', {
        p_flow_id: body.id,
        p_cliente_id: clienteId,
        p_steps: steps,
      });

      if (error) return jsonResponse({ ok: false, error: error.message }, 500);
      return jsonResponse({ ok: true });
    }

    if (action === 'deleteDefinition') {
      if (!body.id) return jsonResponse({ ok: false, error: 'id é obrigatório.' }, 400);

      const { error } = await supabase.rpc('fn_delete_flow_definition', {
        p_id: body.id,
        p_cliente_id: clienteId,
      });

      if (error) return jsonResponse({ ok: false, error: error.message }, 500);
      return jsonResponse({ ok: true });
    }

    if (action === 'listRuns') {
      if (!body.id) return jsonResponse({ ok: false, error: 'id é obrigatório.' }, 400);

      const { data, error } = await supabase.rpc('fn_list_flow_runs', {
        p_flow_id: body.id,
        p_cliente_id: clienteId,
        p_limit: typeof body.limit === 'number' ? body.limit : 20,
      });

      if (error) return jsonResponse({ ok: false, error: error.message }, 500);

      const items = ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        id: r.id,
        status: r.status,
        triggerType: r.trigger_type,
        currentStepOrder: r.current_step_order,
        errorMessage: r.error_message,
        startedAt: r.started_at,
        finishedAt: r.finished_at,
        createdAt: r.created_at,
      }));

      return jsonResponse({ ok: true, items });
    }

    if (action === 'getRun') {
      if (!body.runId) return jsonResponse({ ok: false, error: 'runId é obrigatório.' }, 400);

      const { data, error } = await supabase.rpc('fn_get_flow_run', {
        p_run_id: body.runId,
        p_cliente_id: clienteId,
      });

      if (error) return jsonResponse({ ok: false, error: error.message }, 500);
      if (!data || !data.run) return jsonResponse({ ok: false, error: 'Run não encontrada ou não pertence a este tenant.' }, 404);

      const r = data.run as Record<string, unknown>;
      const stepRuns = (data.step_runs as Record<string, unknown>[]) ?? [];

      return jsonResponse({
        ok: true,
        run: {
          id: r.id,
          flowId: r.flow_id,
          status: r.status,
          triggerType: r.trigger_type,
          currentStepOrder: r.current_step_order,
          errorMessage: r.error_message,
          startedAt: r.started_at,
          finishedAt: r.finished_at,
        },
        stepRuns: stepRuns.map((sr) => ({
          id: sr.id,
          stepId: sr.step_id,
          stepOrder: sr.step_order,
          status: sr.status,
          actionStatusId: sr.action_status_id,
          result: sr.result,
          errorMessage: sr.error_message,
        })),
      });
    }

    if (action === 'run') {
      if (!body.id) return jsonResponse({ ok: false, error: 'id é obrigatório.' }, 400);

      const runtimeUrl = Deno.env.get('AGENT_RUNTIME_URL');
      const internalToken = Deno.env.get('AGENT_INTERNAL_TOKEN');

      if (!runtimeUrl) {
        return jsonResponse({ ok: false, error: 'AGENT_RUNTIME_URL não configurado.' }, 500);
      }

      const response = await fetch(`${runtimeUrl.replace(/\/$/, '')}/flows/${body.id}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(internalToken ? { Authorization: `Bearer ${internalToken}` } : {}),
        },
        body: JSON.stringify({ clienteId, triggeredByUserId: user.id }),
      });

      const runResponse = await response.json().catch(() => undefined);

      if (!response.ok || !runResponse) {
        return jsonResponse({
          ok: false,
          error: `Agent runtime retornou HTTP ${response.status}.`,
          raw: runResponse,
        }, 502);
      }

      return jsonResponse({ ok: true, runId: runResponse.runId, status: runResponse.status });
    }

    if (action === 'confirmStep') {
      if (!body.runId) return jsonResponse({ ok: false, error: 'runId é obrigatório.' }, 400);

      const runtimeUrl = Deno.env.get('AGENT_RUNTIME_URL');
      const internalToken = Deno.env.get('AGENT_INTERNAL_TOKEN');

      if (!runtimeUrl) {
        return jsonResponse({ ok: false, error: 'AGENT_RUNTIME_URL não configurado.' }, 500);
      }

      const response = await fetch(`${runtimeUrl.replace(/\/$/, '')}/flows/runs/${body.runId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(internalToken ? { Authorization: `Bearer ${internalToken}` } : {}),
        },
        body: JSON.stringify({ clienteId }),
      });

      const confirmResponse = await response.json().catch(() => undefined);

      if (!response.ok || !confirmResponse) {
        return jsonResponse({
          ok: false,
          error: `Agent runtime retornou HTTP ${response.status}.`,
          raw: confirmResponse,
        }, 502);
      }

      return jsonResponse({ ok: true, runId: confirmResponse.runId, status: confirmResponse.status });
    }

    return jsonResponse({
      ok: false,
      error: `action desconhecida: "${action}". Use "list", "get", "upsertDefinition", "saveSteps", "deleteDefinition", "listRuns", "getRun", "run" ou "confirmStep".`,
    }, 400);
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : 'Erro inesperado em flow-admin.',
    }, 500);
  }
});
