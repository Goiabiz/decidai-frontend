import { handleOptions, jsonResponse } from '../_shared/agent-cors.ts';
import { createServiceClient, readAuthUser } from '../_shared/agent-supabase.ts';

// Adaptive Application Engine, Onda G2 (parte 2/2 -- UI Schema Engine). Mesmo contrato de
// knowledge-admin: 1 função, campo `action`, resposta em camelCase, clienteId resolvido a
// partir do JWT de quem chamou (nunca confiar em clienteId vindo do corpo) via
// fn_resolve_platform_client_id_by_auth_user (migration 053) -- diferente da Intranet
// (Onda F), aqui não existe caminho "staff sem tenant": objetos dinâmicos são sempre de UM
// tenant, então usuário sem tenant associado é sempre 403, sem exceção.
//
// Só expõe o que a UI Schema Engine precisa: listar/ver objeto PUBLICADO e fazer CRUD de
// REGISTRO. Não expõe criar_objeto/adicionar_campo/publicar/mover_para_sandbox -- essas
// continuam exclusivas da Imya via Tool Gateway (definir estrutura é conversa com a IA,
// não uma tela de admin; mesma decisão de escopo já usada em knowledge-admin pra "publish").
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

    if (action === 'listObjetos') {
      const { data, error } = await supabase.rpc('fn_list_app_objeto_definicoes', { p_cliente_id: clienteId });
      if (error) return jsonResponse({ ok: false, error: error.message }, 500);

      const items = (data ?? []).map((row: Record<string, unknown>) => ({
        id: row.id,
        nome: row.nome,
        descricao: row.descricao,
        estado: row.estado,
        versaoAtual: row.versao_atual,
        objetoUniversalId: row.objeto_universal_id,
      }));

      return jsonResponse({ ok: true, items });
    }

    if (action === 'getObjeto') {
      if (!body.objetoDefinicaoId) return jsonResponse({ ok: false, error: 'objetoDefinicaoId é obrigatório.' }, 400);

      const { data, error } = await supabase.rpc('fn_get_app_objeto_definicao', {
        p_objeto_definicao_id: body.objetoDefinicaoId,
        p_cliente_id: clienteId,
      });
      if (error) return jsonResponse({ ok: false, error: error.message }, 500);

      const rows = (data ?? []) as Array<Record<string, unknown>>;
      if (rows.length === 0) return jsonResponse({ ok: false, error: 'Objeto não encontrado.' }, 404);

      const row = rows[0];
      const campos = ((row.campos ?? []) as Array<Record<string, unknown>>).map((c) => ({
        id: c.id, nome: c.nome, tipo: c.tipo, obrigatorio: c.obrigatorio, unico: c.unico, ordem: c.ordem, configExtra: c.config_extra,
      }));
      const relacoes = ((row.relacoes ?? []) as Array<Record<string, unknown>>).map((r) => ({
        id: r.id, objetoDestinoId: r.objeto_destino_id, tipoRelacao: r.tipo_relacao, nomeRelacao: r.nome_relacao,
      }));

      return jsonResponse({
        ok: true,
        objeto: {
          id: row.id, nome: row.nome, descricao: row.descricao, estado: row.estado,
          versaoAtual: row.versao_atual, objetoUniversalId: row.objeto_universal_id, campos, relacoes,
        },
      });
    }

    if (action === 'listRegistros') {
      if (!body.objetoDefinicaoId) return jsonResponse({ ok: false, error: 'objetoDefinicaoId é obrigatório.' }, 400);

      const { data, error } = await supabase.rpc('fn_list_app_objeto_registros', {
        p_objeto_definicao_id: body.objetoDefinicaoId,
        p_cliente_id: clienteId,
        p_limit: typeof body.limit === 'number' ? body.limit : 50,
        p_offset: typeof body.offset === 'number' ? body.offset : 0,
        p_incluir_teste: body.incluirTeste === true,
      });
      if (error) return jsonResponse({ ok: false, error: error.message }, 500);

      const items = (data ?? []).map((row: Record<string, unknown>) => ({
        id: row.id, dados: row.dados, ehTeste: row.eh_teste, criadoEm: row.criado_em, atualizadoEm: row.atualizado_em,
      }));

      return jsonResponse({ ok: true, items });
    }

    if (action === 'createRegistro') {
      if (!body.objetoDefinicaoId) return jsonResponse({ ok: false, error: 'objetoDefinicaoId é obrigatório.' }, 400);
      if (!body.dados || typeof body.dados !== 'object') return jsonResponse({ ok: false, error: 'dados (objeto) é obrigatório.' }, 400);

      const { data, error } = await supabase.rpc('fn_create_app_objeto_registro', {
        p_objeto_definicao_id: body.objetoDefinicaoId,
        p_cliente_id: clienteId,
        p_dados: body.dados,
        p_criado_por: user.id,
      });
      if (error) return jsonResponse({ ok: false, error: error.message }, 400);

      return jsonResponse({ ok: true, id: data });
    }

    if (action === 'updateRegistro') {
      if (!body.id) return jsonResponse({ ok: false, error: 'id é obrigatório.' }, 400);
      if (!body.dados || typeof body.dados !== 'object') return jsonResponse({ ok: false, error: 'dados (objeto) é obrigatório.' }, 400);

      const { data, error } = await supabase.rpc('fn_update_app_objeto_registro', {
        p_id: body.id,
        p_cliente_id: clienteId,
        p_dados: body.dados,
      });
      if (error) return jsonResponse({ ok: false, error: error.message }, 500);
      if (!data) return jsonResponse({ ok: false, error: 'Registro não encontrado ou não pertence a este tenant.' }, 404);

      return jsonResponse({ ok: true });
    }

    if (action === 'deleteRegistro') {
      if (!body.id) return jsonResponse({ ok: false, error: 'id é obrigatório.' }, 400);

      const { data, error } = await supabase.rpc('fn_delete_app_objeto_registro', {
        p_id: body.id,
        p_cliente_id: clienteId,
      });
      if (error) return jsonResponse({ ok: false, error: error.message }, 500);
      if (!data) return jsonResponse({ ok: false, error: 'Registro não encontrado ou não pertence a este tenant.' }, 404);

      return jsonResponse({ ok: true });
    }

    return jsonResponse({ ok: false, error: `action desconhecida: "${action}". Use "listObjetos", "getObjeto", "listRegistros", "createRegistro", "updateRegistro" ou "deleteRegistro".` }, 400);
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : 'Erro inesperado em app-objetos-admin.',
    }, 500);
  }
});
