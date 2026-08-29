import { universoSupabase } from '../lib/supabase';

export type AgentRole =
  | 'conhecedor-mapeador'
  | 'po-produto'
  | 'suporte-atendimento'
  | 'radar-monitoramento'
  | 'chatbot-online'
  | 'construtor-configurador';

export type AgentMode = 'usuario-cliente' | 'administrador-cliente' | 'equipe-interna-produto' | 'desenvolvimento-interno';

export type AgentToolCall = {
  name: string;
  args: Record<string, unknown>;
  ok: boolean;
  result?: unknown;
};

export type AgentRunResponse = {
  ok: boolean;
  requestId?: string;
  conversationId?: string;
  clienteId?: string;
  response?: {
    ok: boolean;
    provider: string;
    model: string;
    status: string;
    fallbackUsed: boolean;
    answer: string;
    toolCalls?: AgentToolCall[];
    usage?: { inputTokens: number; outputTokens: number };
    memorySnippetsUsed?: number;
    memoryPersisted?: boolean;
    /** Onda L (frente G, voz): texto reconhecido a partir do áudio, quando a pergunta veio por voz. */
    transcript?: string;
    /** Onda L (frente G, voz): resposta falada (base64), quando pedida ou quando a pergunta veio por voz. */
    answerAudioBase64?: string;
    answerAudioMimeType?: string;
  };
  error?: string;
};

export type AgentRunInput = {
  question: string;
  clienteId: string;
  role?: AgentRole;
  mode?: AgentMode;
  userId?: string;
  conversationId?: string;
  context?: Record<string, unknown>;
};

export type AgentRunVoiceInput = {
  audioBase64: string;
  audioMimeType: string;
  clienteId: string;
  role?: AgentRole;
  mode?: AgentMode;
  userId?: string;
  conversationId?: string;
  context?: Record<string, unknown>;
};

/**
 * Chama a Edge Function real `agent-run` (deployada em 10/08/2026 no projeto Supabase,
 * runtime hospedado no Railway) -- contrato documentado em
 * universo-conectasus-db/database/00_controle/brief-conectar-widget-agente-real.md
 * (11/08/2026). `clienteId` precisa ser um uuid real de platform_clients.id -- garante
 * BYOK e isolamento de memória/conhecimento por tenant.
 */
export async function runAgent(input: AgentRunInput): Promise<AgentRunResponse> {
  const client = universoSupabase;
  if (!client) return { ok: false, error: 'Supabase não configurado.' };

  try {
    const { data, error } = await client.functions.invoke('agent-run', {
      body: {
        role: input.role ?? 'chatbot-online',
        question: input.question,
        mode: input.mode ?? 'usuario-cliente',
        clienteId: input.clienteId,
        context: {
          ...(input.context || {}),
          userId: input.userId,
          conversationId: input.conversationId,
        },
      },
    });

    if (error) return { ok: false, error: error.message };
    return (data as AgentRunResponse) ?? { ok: false, error: 'Resposta vazia do agente.' };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Falha ao chamar o agente.' };
  }
}

const universoUrl = import.meta.env.VITE_SUPABASE_UNIVERSO_URL as string | undefined;
const universoAnonKey = import.meta.env.VITE_SUPABASE_UNIVERSO_ANON_KEY as string | undefined;

/**
 * Streaming real (SSE) do chat por texto -- relay `agent-run-stream` (Edge Function nova,
 * 28/08/2026) -> `/agent/v2/run/stream` (frente H). `supabase.functions.invoke()` não serve
 * aqui: ele espera o corpo inteiro antes de devolver, o que anula o streaming -- por isso esta
 * função usa `fetch` cru direto na Edge Function, igual a qualquer outro consumidor HTTP de
 * SSE, lendo o corpo aos poucos via `ReadableStream`.
 *
 * `onDelta` é chamado a cada pedaço de texto que chega (pra atualizar a bolha de resposta na
 * tela em tempo real). O retorno final tem o mesmo formato de `AgentRunResponse` de sempre,
 * pra quem consome não precisar tratar dois contratos diferentes.
 *
 * Limitação herdada do v1 do runtime (ver agent-http-server.ts): só texto, sem áudio, sem
 * tool-calling -- voz continua em `runAgentVoice` (não-streaming), sem mudança nenhuma.
 */
export async function runAgentStream(
  input: AgentRunInput,
  onDelta: (deltaText: string) => void,
): Promise<AgentRunResponse> {
  if (!universoUrl || !universoAnonKey) return { ok: false, error: 'Supabase não configurado.' };

  const { data: sessionData } = await (universoSupabase?.auth.getSession() ?? Promise.resolve({ data: { session: null } }));
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) return { ok: false, error: 'Sessão expirada.' };

  let response: Response;
  try {
    response = await fetch(`${universoUrl.replace(/\/$/, '')}/functions/v1/agent-run-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey: universoAnonKey,
      },
      body: JSON.stringify({
        role: input.role ?? 'chatbot-online',
        question: input.question,
        mode: input.mode ?? 'usuario-cliente',
        clienteId: input.clienteId,
        context: {
          ...(input.context || {}),
          userId: input.userId,
          conversationId: input.conversationId,
        },
      }),
    });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Falha ao chamar o agente (stream).' };
  }

  const contentType = response.headers.get('content-type') || '';
  if (!response.ok || !contentType.includes('text/event-stream') || !response.body) {
    const raw = await response.json().catch(() => undefined);
    return (raw as AgentRunResponse) ?? { ok: false, error: `Agent runtime retornou HTTP ${response.status}.` };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullAnswer = '';
  let finalPayload: Record<string, unknown> | null = null;
  let streamError: string | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Eventos SSE são separados por linha em branco (`\n\n`); cada evento tem 1+ linhas
    // `data: {...}` -- o runtime só usa 1 linha `data:` por evento, mas processa em loop por
    // segurança caso isso mude no futuro.
    let separatorIndex = buffer.indexOf('\n\n');
    while (separatorIndex !== -1) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);

      for (const line of rawEvent.split('\n')) {
        if (!line.startsWith('data:')) continue;
        const jsonText = line.slice(5).trim();
        if (!jsonText) continue;

        try {
          const event = JSON.parse(jsonText) as Record<string, unknown>;
          if (typeof event.delta === 'string') {
            fullAnswer += event.delta;
            onDelta(event.delta);
          } else if (event.done === true) {
            finalPayload = event;
          } else if (typeof event.error === 'string') {
            streamError = event.error;
          }
        } catch {
          // Evento malformado isolado não derruba o stream inteiro -- ignora e segue.
        }
      }

      separatorIndex = buffer.indexOf('\n\n');
    }
  }

  if (streamError) return { ok: false, error: streamError };
  if (!finalPayload) return { ok: false, error: 'Stream encerrado sem evento final.' };

  return {
    ok: true,
    requestId: finalPayload.requestId as string | undefined,
    conversationId: finalPayload.conversationId as string | undefined,
    response: {
      ok: true,
      provider: (finalPayload.provider as string) || '',
      model: (finalPayload.model as string) || '',
      status: 'ok',
      fallbackUsed: false,
      answer: (finalPayload.answer as string) ?? fullAnswer,
      usage: finalPayload.usage as { inputTokens: number; outputTokens: number } | undefined,
    },
  };
}

/**
 * Onda L (§55-56 emenda "Imya", frente G — Voz & Presença), v1 push-to-talk. Mesma Edge
 * Function `agent-run` do chat de texto (estendida pra aceitar audioBase64 no lugar de
 * question) -- mesmo tenant/auth/memória/Tool Gateway, só a entrada muda de texto pra áudio.
 * O runtime transcreve (Whisper) antes de rodar o agente e devolve a resposta também em
 * áudio (TTS) quando `wantsAudioResponse` é pedido.
 */
export async function runAgentVoice(input: AgentRunVoiceInput): Promise<AgentRunResponse> {
  const client = universoSupabase;
  if (!client) return { ok: false, error: 'Supabase não configurado.' };

  try {
    const { data, error } = await client.functions.invoke('agent-run', {
      body: {
        role: input.role ?? 'chatbot-online',
        audioBase64: input.audioBase64,
        audioMimeType: input.audioMimeType,
        wantsAudioResponse: true,
        mode: input.mode ?? 'usuario-cliente',
        clienteId: input.clienteId,
        context: {
          ...(input.context || {}),
          userId: input.userId,
          conversationId: input.conversationId,
        },
      },
    });

    if (error) return { ok: false, error: error.message };
    return (data as AgentRunResponse) ?? { ok: false, error: 'Resposta vazia do agente.' };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Falha ao chamar o agente por voz.' };
  }
}
