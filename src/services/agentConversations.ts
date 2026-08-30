import { universoSupabase } from '../lib/supabase';

// Histórico de conversa da tela de chat de página inteira (design-chat-tela-cheia-v1.md,
// frente I, 30/08/2026). Achado que viabilizou a V1 sem migration nenhuma: o histórico JÁ é
// persistido desde a migration 038 -- `fn_persist_agent_exchange` grava cada turno em
// `agent_conversation_messages` e mantém `agent_conversations` (com `title` gerado dos 80
// primeiros caracteres da primeira pergunta). Nunca tinha sido lido por nenhuma tela.
//
// Escopo decidido pelo usuário na revisão do design: cada pessoa vê só as PRÓPRIAS conversas.
// Isso já é garantido no banco pelas policies `*_tenant_select` -- os filtros por cliente_id
// abaixo são defesa em profundidade e clareza de intenção, não a fronteira de segurança real.

export type AgentConversationSummary = {
  id: string;
  title: string;
  lastMessageAt: string;
};

export type AgentConversationMessage = {
  id: string;
  role: 'user' | 'agent';
  content: string;
  createdAt: string;
};

export async function listConversations(clienteId: string, userId: string): Promise<AgentConversationSummary[]> {
  const client = universoSupabase;
  if (!client) return [];

  const { data, error } = await client
    .from('agent_conversations')
    .select('id, title, last_message_at')
    .eq('cliente_id', clienteId)
    .eq('user_id', userId)
    .order('last_message_at', { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    // `title` vem de `left(primeira_pergunta, 80)` -- pode vir vazio se a primeira mensagem era
    // só áudio sem transcrição. Rótulo neutro em vez de item em branco na lista.
    title: (row.title as string | null)?.trim() || 'Conversa sem título',
    lastMessageAt: row.last_message_at as string,
  }));
}

/** Renomear conversa. O `title` nasce de `left(primeira_pergunta, 80)` na
 * `fn_persist_agent_exchange` e nunca mais muda -- com 60+ conversas, achar a certa por uma
 * frase truncada do começo é ruim. `authenticated` já tem UPDATE + policy de tenant nesta
 * tabela (confirmado com `has_table_privilege`, não por listagem de grants), então isto não
 * precisou de migration.
 *
 * Devolve o título efetivamente salvo, pra tela não ficar mostrando algo que o banco recusou. */
export async function renameConversation(conversationId: string, clienteId: string, title: string): Promise<string | null> {
  const client = universoSupabase;
  if (!client) return null;

  const limpo = title.trim().slice(0, 120);
  if (!limpo) return null;

  const { data, error } = await client
    .from('agent_conversations')
    .update({ title: limpo })
    .eq('id', conversationId)
    .eq('cliente_id', clienteId)
    .select('title')
    .maybeSingle();

  if (error || !data) return null;
  return data.title as string;
}

/** Excluir conversa. Exclusão de verdade (não lógica): a conversa é conteúdo do próprio
 * usuário, e ele pediu pra sumir -- diferente do agente, onde a exclusão é lógica pra
 * preservar atribuição de auditoria e cobrança.
 *
 * As mensagens saem junto por CASCADE, e um eventual procedimento aprendido (Learn Mode) na
 * conversa sobrevive com o vínculo nulo -- decisão do usuário: apagar um chat não deve fazer
 * o agente esquecer o que aprendeu. GRANT/policy de DELETE e a regra da FK entraram na
 * migration `20260830170000_excluir_conversa_do_chat.sql`. */
export async function deleteConversation(conversationId: string, clienteId: string): Promise<boolean> {
  const client = universoSupabase;
  if (!client) return false;

  const { error } = await client
    .from('agent_conversations')
    .delete()
    .eq('id', conversationId)
    .eq('cliente_id', clienteId);

  return !error;
}

export async function loadConversationMessages(conversationId: string, clienteId: string): Promise<AgentConversationMessage[]> {
  const client = universoSupabase;
  if (!client) return [];

  const { data, error } = await client
    .from('agent_conversation_messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    // A função de persistência só grava 'user' e 'agent'; qualquer outro valor vira 'agent'
    // pra não quebrar a renderização se algum dia entrar um papel novo (ex.: 'system').
    role: row.role === 'user' ? 'user' : 'agent',
    content: (row.content as string) ?? '',
    createdAt: row.created_at as string,
  }));
}
