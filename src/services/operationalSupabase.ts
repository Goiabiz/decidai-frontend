import { pocSupabase } from '../lib/supabase';
import type { GeneratedRoadmapItem, OperationalHistory, OperationalPatch } from './operationalStore';

// O projeto Supabase "POC" (VITE_SUPABASE_POC_URL) que este arquivo mira não resolve mais em
// DNS -- verificado em 28/08/2026 (curl/Invoke-WebRequest falham com "nome remoto não pôde ser
// resolvido"). Não é mais um caso de "flag desligada por engano": o banco-alvo não existe.
// Ligar ENABLE_SUPABASE_WRITES hoje só trocaria "sempre local" por "sempre falha de rede
// silenciosa" -- os 3 chamadores já engolem o erro (.catch(() => undefined)), então o
// resultado prático seria o mesmo. Persistência real destes 3 registros (patch/histórico/
// roadmap gerado) exige desenhar schema novo em universo-conectasus-db no projeto principal
// (universoSupabase) -- decisão de produto/schema em aberto, não uma correção mecânica.
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

// Auditoria real de ações do workspace passou a usar services/auditLog.ts (auditoria_usuario
// no projeto principal, migration 016) em vez de repetir esse mesmo destino aqui apontado pro
// projeto POC morto -- ver operationalStore.ts.
