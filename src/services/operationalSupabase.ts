import { pocSupabase } from '../lib/supabase';
import type { GeneratedRoadmapItem, OperationalHistory, OperationalPatch } from './operationalStore';

export type AuditOperation = 'insert' | 'update' | 'delete' | 'login' | 'export' | 'print' | 'external_link' | 'agent_action';

export type AuditPayload = {
  usuarioNome: string;
  usuarioEmail?: string;
  modulo: string;
  funcionalidade?: string;
  operacao: AuditOperation;
  origem: string;
  ip?: string;
  registroId?: string;
  dadosAntes?: unknown;
  dadosDepois?: unknown;
  observacao?: string;
};

const ENABLE_SUPABASE_WRITES = false;

const getClient = () => {
  if (!pocSupabase) {
    throw new Error('Supabase POC não configurado');
  }
  return pocSupabase;
};

export const isSupabaseWriteEnabled = () => ENABLE_SUPABASE_WRITES;

export async function persistRoadmapItem(item: GeneratedRoadmapItem) {
  if (!ENABLE_SUPABASE_WRITES) return { data: item, source: 'local', skipped: true };

  const { data, error } = await getClient()
    .from('roadmap_itens_operacionais')
    .insert({
      origem: item.origem,
      resumo: item.resumo,
      criticidade: item.criticidade,
      responsavel: item.responsavel,
      prazo: item.prazo,
      status: item.status,
      criado_em: item.createdAt
    })
    .select()
    .single();

  if (error) throw error;
  return { data, source: 'supabase', skipped: false };
}

export async function persistOperationalPatch(patch: OperationalPatch) {
  if (!ENABLE_SUPABASE_WRITES) return { data: patch, source: 'local', skipped: true };

  const { data, error } = await getClient()
    .from('workspace_alteracoes_operacionais')
    .insert({
      titulo: patch.title,
      status: patch.status,
      prioridade: patch.prioridade,
      responsavel: patch.responsavel,
      resumo: patch.resumo,
      descartado: patch.descartado ?? false,
      revisao: patch.revisao ?? false,
      atualizado_em: patch.updatedAt
    })
    .select()
    .single();

  if (error) throw error;
  return { data, source: 'supabase', skipped: false };
}

export async function persistOperationalHistory(history: OperationalHistory) {
  if (!ENABLE_SUPABASE_WRITES) return { data: history, source: 'local', skipped: true };

  const { data, error } = await getClient()
    .from('historico_operacional')
    .insert({
      titulo: history.title,
      acao: history.action,
      descricao: history.description,
      usuario_nome: history.user,
      criado_em: history.createdAt
    })
    .select()
    .single();

  if (error) throw error;
  return { data, source: 'supabase', skipped: false };
}

export async function persistAuditLog(payload: AuditPayload) {
  if (!ENABLE_SUPABASE_WRITES) return { data: payload, source: 'local', skipped: true };

  const { data, error } = await getClient()
    .from('auditoria_usuario')
    .insert({
      usuario_nome: payload.usuarioNome,
      usuario_email: payload.usuarioEmail,
      modulo: payload.modulo,
      funcionalidade: payload.funcionalidade,
      operacao: payload.operacao,
      origem: payload.origem,
      ip: payload.ip,
      registro_id: payload.registroId,
      dados_antes: payload.dadosAntes,
      dados_depois: payload.dadosDepois,
      observacao: payload.observacao
    })
    .select()
    .single();

  if (error) throw error;
  return { data, source: 'supabase', skipped: false };
}
