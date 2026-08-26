import { handleOptions, jsonResponse } from '../_shared/agent-cors.ts';
import { createServiceClient, isUuid, newId, readAuthUser } from '../_shared/agent-supabase.ts';

// Chama /agent/v2/run (executeWithModelRouter -- IA real, Tool Gateway, memória pessoal,
// Knowledge Layer, usage tracking), não mais /agent/run (agent-dispatcher.ts, caminho
// antigo e mais simples) -- achado real em 10-11/08/2026 ao preparar a hospedagem do
// runtime. /agent/v2/run já persiste memória pessoal e evento de uso sozinho
// (provider-fallback-executor.ts) -- por isso esta function NÃO chama persistAgentExchange
// de novo aqui, senão duplicaria conversa/mensagem/auditoria.
Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Método não permitido.' }, 405);
  }

  try {
    const runtimeUrl = Deno.env.get('AGENT_RUNTIME_URL');
    const internalToken = Deno.env.get('AGENT_INTERNAL_TOKEN');

    if (!runtimeUrl) {
      return jsonResponse({ ok: false, error: 'AGENT_RUNTIME_URL não configurado.' }, 500);
    }

    const body = await request.json();
    const user = await readAuthUser(request);
    if (!user) {
      return jsonResponse({ ok: false, error: 'Não autenticado.' }, 401);
    }

    const requestId = body.requestId || newId('req');
    const context = body.context || {};
    // clienteId (não clientId) -- mesma convenção usada em todo o resto do runtime real
    // (provider-fallback-executor.ts lê context.clienteId).
    const requestedClienteId = context.clienteId || context.clientId || body.clienteId || body.clientId || null;

    // Achado em auditoria de segurança em 19/08/2026 (radar-sus-frontend): até aqui, clienteId
    // vinha direto do body/context sem checagem nenhuma -- readAuthUser confirma QUEM está
    // chamando (JWT verificado de verdade), mas nada confirmava que esse usuário tinha
    // qualquer relação com o clienteId que ele mandou. Qualquer usuário autenticado de
    // QUALQUER tenant conseguia fazer o agente agir em nome de outro tenant (GitHub App,
    // MariaDB, Jira/Confluence, WhatsApp, envio de mensagem -- tudo real). Mesma disciplina já
    // aplicada em tenant-connector-credentials/knowledge-admin/github-app-link (migration
    // 053): resolve o tenant server-side via fn_resolve_platform_client_id_by_auth_user, que
    // só honra um clienteId "pedido" depois de confirmar que quem chamou é staff de verdade --
    // usuário comum de tenant sempre recebe o próprio platform_client_id de volta, nunca o
    // que ele mandou.
    const supabase = createServiceClient();
    const { data: clienteId, error: resolveError } = await supabase.rpc(
      'fn_resolve_platform_client_id_by_auth_user',
      { p_auth_user_id: user.id, p_requested_cliente_id: requestedClienteId },
    );

    if (resolveError) {
      return jsonResponse({ ok: false, error: resolveError.message }, 500);
    }

    const conversationId = context.conversationId || body.conversationId || crypto.randomUUID();
    const userId = context.userId || body.userId || user.id;

    if (!isUuid(clienteId)) {
      return jsonResponse({ ok: false, error: 'Usuário sem tenant associado (platform_client_id).' }, 403);
    }

    // Voz (Onda L, §55-56 emenda "Imya", frente G): question OU audioBase64 -- o runtime
    // (/agent/v2/run) transcreve o áudio antes de validar question quando question vier
    // vazio. Esta function só repassa os campos, sem decodificar/inspecionar o áudio aqui.
    if (!body.question && !body.audioBase64) {
      return jsonResponse({ ok: false, error: 'question ou audioBase64 é obrigatório.' }, 400);
    }

    const agentRequest = {
      role: body.role || 'chatbot-online',
      question: body.question || undefined,
      audioBase64: body.audioBase64 || undefined,
      audioMimeType: body.audioMimeType || undefined,
      wantsAudioResponse: body.wantsAudioResponse === true,
      mode: body.mode || 'usuario-cliente',
      context: {
        ...context,
        requestId,
        clienteId,
        userId,
        conversationId,
      },
    };

    const response = await fetch(`${runtimeUrl.replace(/\/$/, '')}/agent/v2/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(internalToken ? { Authorization: `Bearer ${internalToken}` } : {}),
        'X-Request-Id': requestId,
      },
      body: JSON.stringify(agentRequest),
    });

    const agentResponse = await response.json().catch(() => undefined);

    if (!response.ok || !agentResponse) {
      return jsonResponse({
        ok: false,
        requestId,
        error: `Agent runtime retornou HTTP ${response.status}.`,
        raw: agentResponse,
      }, 502);
    }

    return jsonResponse({
      ok: true,
      requestId,
      conversationId: agentResponse.conversationId ?? conversationId,
      clienteId,
      response: agentResponse,
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : 'Erro inesperado em agent-run.',
    }, 500);
  }
});
