import { handleOptions, jsonResponse } from '../_shared/agent-cors.ts';
import { createServiceClient, readAuthUser } from '../_shared/agent-supabase.ts';

// Contrato definido pela sessão irmã (database/00_controle/reply-knowledge-edge-function-contract.md,
// 11/08/2026): 1 função só, campo `action` (list/update/delete), resposta em camelCase.
//
// Ponto de segurança pedido por ela: NUNCA confiar em clienteId vindo do corpo da
// requisição pra estas 3 ações -- resolve o tenant inteiramente a partir do JWT de quem
// chamou (usuarios_cliente.auth_user_id -> platform_client_id, mesmo lookup do
// loadSession() dela). fn_update_knowledge_entry/fn_delete_knowledge_entry já exigem
// p_cliente_id batendo com o dono da linha -- isso fecha o isolamento por dois lados.
//
// Achado ao vivo em 12/08/2026 (radar-sus-frontend, migration 053): a regra acima só cobre
// usuário real de tenant (usuarios_cliente). Conta de staff (usuarios_sistema,
// suporte/admin_operadora) não tem linha em usuarios_cliente -- fn_resolve_platform_client_id_by_auth_user
// sempre voltava null pra ela, mesmo "Acessando como" um tenant pela sidebar (isso é só
// estado local no frontend, nunca virou vínculo real -- ver session.activeClientId). Todas
// as outras telas já conectadas resolvem isso via RLS (cláusula OR que libera staff pra
// qualquer cliente_id); esta função roda com service_role, sem RLS, então precisa da mesma
// checagem manual. fn_resolve_platform_client_id_by_auth_user (053) agora aceita um 2º
// parâmetro opcional, mas só confia nele depois de confirmar server-side que quem chamou é
// staff de verdade -- usuário comum continua 100% preso ao próprio tenant, sem poder passar
// clienteId de outro.
//
// Extensão Onda F (Frente I, 24/08/2026, migration 105/111/113): Enterprise Knowledge
// Intranet -- staff gerencia conteúdo de PLATAFORMA (cliente_id null, visibilidade
// 'interno'), não conteúdo de um tenant. Staff normalmente NÃO está "Acessando como"
// nenhum cliente pra isso (esse é o estado normal de quem só quer usar a Intranet) --
// fn_resolve_platform_client_id_by_auth_user então devolve null, e antes isso batia direto
// no 403 "sem tenant associado". Agora: se não resolveu tenant, confere se é staff de
// verdade (query direta em usuarios_sistema com o user.id do JWT -- não dá pra usar
// fn_current_usuario_sistema() aqui porque ela depende de auth.uid(), que só existe quando
// a chamada usa o JWT do usuário; esta função inteira roda com a service_role key). Se for
// staff, segue com clienteId efetivo null e p_incluir_interno=true nas RPCs que suportam.
// Isso NÃO muda nada pro caminho de tenant normal (BaseConhecimento.tsx) -- só adiciona um
// caminho novo quando a resolução normal falha e quem chamou é staff confirmado.
//
// Decisão de escopo espelhando BaseConhecimento.tsx (services/baseConhecimento.ts:85-91):
// sem ação "publish" aqui de propósito -- publicar exige gerar embedding real (API de IA),
// e isso já é responsabilidade exclusiva do agente via Tool Gateway (mesma razão
// documentada lá). A Intranet edita/organiza o que o agente já publicou, não cria do zero.
//
// Achado ao vivo (não suposição): um `select` direto em usuarios_sistema com o client de
// service_role voltou "permission denied for table usuarios_sistema" -- essa tabela
// deliberadamente não dá select/insert/update/delete pra service_role (só
// REFERENCES/TRIGGER/TRUNCATE), mediada só por função SECURITY DEFINER. Corrigido usando
// fn_is_staff_sem_tenant (migration 114), mesmo padrão de fn_resolve_platform_client_id_by_auth_user.
async function resolveStaffSemTenant(
  supabase: ReturnType<typeof createServiceClient>,
  authUserId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('fn_is_staff_sem_tenant', { p_auth_user_id: authUserId });
  if (error) throw new Error(error.message);
  return data === true;
}

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

    let effectiveClienteId: string | null = clienteId ?? null;
    let staffSemTenant = false;

    if (!effectiveClienteId) {
      try {
        staffSemTenant = await resolveStaffSemTenant(supabase, user.id);
      } catch (staffError) {
        return jsonResponse({
          ok: false,
          error: staffError instanceof Error ? staffError.message : 'Erro ao verificar papel de staff.',
        }, 500);
      }
      if (!staffSemTenant) {
        return jsonResponse({ ok: false, error: 'Usuário sem tenant associado (platform_client_id).' }, 403);
      }
      // staffSemTenant confirmado: effectiveClienteId continua null -- staff gerenciando
      // conteúdo de plataforma (Enterprise Knowledge Intranet), não de um tenant.
    }

    if (action === 'list') {
      const { data, error } = await supabase.rpc('fn_list_knowledge_entries', {
        p_cliente_id: effectiveClienteId,
        p_category: body.category ?? null,
        p_limit: typeof body.limit === 'number' ? body.limit : 20,
        p_offset: typeof body.offset === 'number' ? body.offset : 0,
        p_tipo_biblioteca: body.tipoBiblioteca ?? null,
        p_incluir_interno: staffSemTenant,
      });

      if (error) return jsonResponse({ ok: false, error: error.message }, 500);

      const items = (data ?? []).map((row: Record<string, unknown>) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        sourceType: row.source_type,
        tags: row.tags,
        category: row.category,
        tipoBiblioteca: row.tipo_biblioteca,
        industriaId: row.industria_id,
        departamentoId: row.departamento_id,
        processoId: row.processo_id,
        dor: row.dor,
        impacto: row.impacto,
        solucaoDecidai: row.solucao_decidai,
        roiEstimado: row.roi_estimado,
        visibilidade: row.visibilidade,
        createdByUserId: row.created_by_user_id,
        lifecycleState: row.lifecycle_state,
        createdAt: row.created_at,
      }));

      return jsonResponse({ ok: true, items });
    }

    if (action === 'update') {
      if (!body.id) return jsonResponse({ ok: false, error: 'id é obrigatório.' }, 400);

      const { data, error } = await supabase.rpc('fn_update_knowledge_entry', {
        p_id: body.id,
        p_cliente_id: effectiveClienteId,
        p_title: body.title ?? null,
        p_content: body.content ?? null,
        p_tags: body.tags ?? null,
        p_category: body.category ?? null,
        p_tipo_biblioteca: body.tipoBiblioteca ?? null,
        p_industria_id: body.industriaId ?? null,
        p_departamento_id: body.departamentoId ?? null,
        p_processo_id: body.processoId ?? null,
        p_dor: body.dor ?? null,
        p_impacto: body.impacto ?? null,
        p_solucao_decidai: body.solucaoDecidai ?? null,
        p_roi_estimado: body.roiEstimado ?? null,
        p_visibilidade: body.visibilidade ?? null,
      });

      if (error) return jsonResponse({ ok: false, error: error.message }, 500);
      if (!data) return jsonResponse({ ok: false, error: 'Entrada não encontrada ou não pertence a este tenant.' }, 404);

      return jsonResponse({ ok: true });
    }

    if (action === 'delete') {
      if (!body.id) return jsonResponse({ ok: false, error: 'id é obrigatório.' }, 400);

      const { data, error } = await supabase.rpc('fn_delete_knowledge_entry', {
        p_id: body.id,
        p_cliente_id: effectiveClienteId,
      });

      if (error) return jsonResponse({ ok: false, error: error.message }, 500);
      if (!data) return jsonResponse({ ok: false, error: 'Entrada não encontrada ou não pertence a este tenant.' }, 404);

      return jsonResponse({ ok: true });
    }

    if (action === 'transition') {
      if (!body.id) return jsonResponse({ ok: false, error: 'id é obrigatório.' }, 400);

      const newState = body.newState;
      // Onda J (Knowledge Lifecycle, migration 107): SHARED significa "candidato a ficar
      // visível pra outros tenants" -- decisão de produto ainda não tomada. A função no
      // banco tecnicamente aceita esse alvo, mas este é o único caller hoje -- recusar
      // aqui é a fronteira real, não decorativa, até existir uma decisão explícita sobre
      // cross-customer learning.
      if (newState === 'SHARED') {
        return jsonResponse({ ok: false, error: 'Promover para SHARED ainda não está disponível.' }, 403);
      }

      const { data, error } = await supabase.rpc('fn_transition_knowledge_lifecycle', {
        p_id: body.id,
        p_cliente_id: effectiveClienteId,
        p_new_state: newState,
      });

      if (error) return jsonResponse({ ok: false, error: error.message }, 400);
      if (!data) return jsonResponse({ ok: false, error: 'Entrada não encontrada ou não pertence a este tenant.' }, 404);

      return jsonResponse({ ok: true });
    }

    return jsonResponse({ ok: false, error: `action desconhecida: "${action}". Use "list", "update", "delete" ou "transition".` }, 400);
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : 'Erro inesperado em knowledge-admin.',
    }, 500);
  }
});
