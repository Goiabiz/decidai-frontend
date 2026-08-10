import { universoSupabase } from '../lib/supabase';

export type AgentRunResponse = {
  ok: boolean;
  requestId?: string;
  conversationId?: string;
  response?: {
    answer: string;
    sources?: string[];
    warning?: string;
  };
  error?: string;
};

export type AgentRunInput = {
  question: string;
  clientId: string;
  userId?: string;
  conversationId?: string;
  context?: Record<string, unknown>;
};

/**
 * Chama a Edge Function `agent-run` (pacote "Platform Agent Integration v1", preparado em
 * universo-conectasus-agent). Ainda não há função nenhuma implantada no projeto Supabase
 * nem servidor de runtime do agente rodando/alcançável -- por isso este client sempre
 * retorna `{ ok: false }` num ambiente sem essas duas peças no ar, e quem chama precisa
 * tratar isso como "IA ainda não disponível", não como bug.
 */
export async function runAgent(input: AgentRunInput): Promise<AgentRunResponse> {
  const client = universoSupabase;
  if (!client) return { ok: false, error: 'Supabase não configurado.' };

  try {
    const { data, error } = await client.functions.invoke('agent-run', {
      body: {
        role: 'chatbot-online',
        question: input.question,
        mode: 'usuario-cliente',
        context: {
          ...(input.context || {}),
          clientId: input.clientId,
          userId: input.userId,
          conversationId: input.conversationId,
          agentId: 'susi',
        },
      },
    });

    if (error) return { ok: false, error: error.message };
    return (data as AgentRunResponse) ?? { ok: false, error: 'Resposta vazia do agente.' };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Falha ao chamar o agente.' };
  }
}
