import { universoSupabase } from '../lib/supabase';

export type AuditOperacao =
  | 'insert' | 'update' | 'delete' | 'login' | 'export' | 'print'
  | 'external_link' | 'susi_action' | 'acesso_suporte_iniciado' | 'acesso_suporte_encerrado';

export type LogAuditInput = {
  usuarioNome: string;
  usuarioEmail: string;
  modulo: string;
  funcionalidade?: string;
  operacao: AuditOperacao;
  registroId?: string;
  dadosAntes?: unknown;
  dadosDepois?: unknown;
  observacao?: string;
};

/**
 * Grava em auditoria_usuario (migration 016). Toda ação destrutiva (e por extensão toda
 * ação relevante) deve chamar isto -- regra fixada pelo usuário como obrigatória em todo
 * o produto. Nunca deve travar a ação do usuário: falha aqui é silenciosa (mesmo padrão de
 * "nunca bloquear por causa do log" já usado em logSupportAccess, services/auth.ts).
 * IP não é setado a partir do frontend (o browser não expõe o IP real do cliente) -- mesma
 * limitação já aceita em logSupportAccess.
 */
export type AuditLogRecord = {
  id: string;
  data: string;
  usuario: string;
  modulo: string;
  funcionalidade: string;
  operacao: AuditOperacao;
  observacao: string;
};

/**
 * Lê auditoria_usuario de verdade -- só suporte/admin_operadora (RLS `auditoria_usuario_read_staff`,
 * platform_client_id is null) enxerga qualquer linha; para outros papéis o Supabase devolve lista
 * vazia (RLS silenciosa), não erro. A tela que chama isto precisa checar `isSupport` antes de tratar
 * uma lista vazia como "nenhum evento aconteceu".
 */
export async function listAuditLogs(limit = 200): Promise<{ items: AuditLogRecord[]; source: 'supabase' | 'local' }> {
  const client = universoSupabase;
  if (!client) return { items: [], source: 'local' };

  const { data, error } = await client
    .from('auditoria_usuario')
    .select('id, usuario_nome, modulo, funcionalidade, operacao, observacao, criado_em')
    .order('criado_em', { ascending: false })
    .limit(limit);

  if (error || !data) return { items: [], source: 'local' };

  return {
    items: data.map((row) => ({
      id: row.id,
      data: row.criado_em,
      usuario: row.usuario_nome,
      modulo: row.modulo,
      funcionalidade: row.funcionalidade || '-',
      operacao: row.operacao as AuditOperacao,
      observacao: row.observacao || '-',
    })),
    source: 'supabase',
  };
}

export async function logAudit(input: LogAuditInput): Promise<void> {
  const client = universoSupabase;
  if (!client) return;

  try {
    await client.from('auditoria_usuario').insert({
      usuario_nome: input.usuarioNome,
      usuario_email: input.usuarioEmail,
      modulo: input.modulo,
      funcionalidade: input.funcionalidade ?? null,
      operacao: input.operacao,
      origem: 'frontend',
      registro_id: input.registroId ?? null,
      dados_antes: input.dadosAntes ?? null,
      dados_depois: input.dadosDepois ?? null,
      observacao: input.observacao ?? null,
    });
  } catch {
    // Log de auditoria nunca deve impedir a ação do usuário.
  }
}
