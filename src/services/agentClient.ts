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
