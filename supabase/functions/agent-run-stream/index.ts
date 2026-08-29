import { buildCorsHeaders, handleOptions, jsonResponse } from '../_shared/agent-cors.ts';
import { createServiceClient, isUuid, newId, readAuthUser } from '../_shared/agent-supabase.ts';

// Relay pra /agent/v2/run/stream (SSE real, frente H, missão "otimizar latência real do
// agente", 28/08/2026) -- rota NOVA em vez de estender agent-run/index.ts, mesmo critério que
// a H usou no runtime: quem já chama agent-run continua recebendo exatamente o mesmo contrato
// de sempre, sem streaming, zero risco de quebrar nada em produção.
//
// Mesma disciplina de segurança do agent-run (tenant resolvido server-side via
// fn_resolve_platform_client_id_by_auth_user, nunca confia no clienteId que o body manda).
//
// Limitação herdada do v1 da rota do runtime: só texto (question), sem áudio, sem
// tool-calling -- ver comentário em agent-http-server.ts. Quem precisar de voz continua
// usando agent-run (não-streaming) normalmente.
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

    if (typeof body.question !== 'string' || !body.question.trim()) {
      return jsonResponse({ ok: false, error: 'question é obrigatório (streaming não suporta áudio ainda).' }, 400);
    }

    const requestId = body.requestId || newId('req');
    const context = body.context || {};
    const requestedClienteId = context.clienteId || context.clientId || body.clienteId || body.clientId || null;

    const supabase = createServiceClient();
    const { data: clienteId, error: resolveError } = await supabase.rpc(
      'fn_resolve_platform_client_id_by_auth_user',
      { p_auth_user_id: user.id, p_requested_cliente_id: requestedClienteId },
    );

    if (resolveError) {
      return jsonResponse({ ok: false, error: resolveError.message }, 500);
    }

    if (!isUuid(clienteId)) {
      return jsonResponse({ ok: false, error: 'Usuário sem tenant associado (platform_client_id).' }, 403);
    }

    const conversationId = context.conversationId || body.conversationId || crypto.randomUUID();
    const userId = context.userId || body.userId || user.id;

    const agentRequest = {
      role: body.role || 'chatbot-online',
      question: body.question,
      mode: body.mode || 'usuario-cliente',
      context: {
        ...context,
        requestId,
        clienteId,
        userId,
        conversationId,
        latencySensitive: context.latencySensitive === true,
      },
    };

    const runtimeResponse = await fetch(`${runtimeUrl.replace(/\/$/, '')}/agent/v2/run/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(internalToken ? { Authorization: `Bearer ${internalToken}` } : {}),
        'X-Request-Id': requestId,
      },
      body: JSON.stringify(agentRequest),
    });

    const contentType = runtimeResponse.headers.get('content-type') || '';

    // Falha antes de o streaming começar (rate limit, token interno, validação) -- o runtime
    // responde JSON normal nesses casos, não SSE (ver agent-http-server.ts). Repassa como erro
    // JSON de sempre, mesmo shape do agent-run não-streaming.
    if (!runtimeResponse.ok || !contentType.includes('text/event-stream')) {
      const raw = await runtimeResponse.json().catch(() => undefined);
      return jsonResponse({
        ok: false,
        requestId,
        error: `Agent runtime retornou HTTP ${runtimeResponse.status}.`,
        raw,
      }, runtimeResponse.status || 502);
    }

    // Relay puro do corpo SSE -- o runtime já formata `data: {...}\n\n` (delta a delta, evento
    // final `done:true` com a resposta completa). Não reprocessa nada aqui, só repassa.
    return new Response(runtimeResponse.body, {
      status: 200,
      headers: {
        ...buildCorsHeaders(),
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Request-Id': requestId,
      },
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : 'Erro inesperado em agent-run-stream.',
    }, 500);
  }
});
