import { universoSupabase } from '../lib/supabase';

// Automações v1 (frente E) -- camada declarativa "quando X acontecer, faça Y" que o cliente
// configura. Dia 1 (migration 20260830012511): schema + compilação pro Automation Scheduler já
// existente. Dia 2 (migration 20260830023637): CRUD via SECURITY DEFINER chamável por
// authenticated, mesmo padrão de fn_review_decision (migration 160).
//
// O catálogo abaixo espelha EXATAMENTE os check constraints do schema -- o banco é a régua, não
// este arquivo. Se divergirem, o banco recusa e a tela mostra o erro real dele.

export type GatilhoTipo =
  | 'mudanca_status' | 'prazo_atingido' | 'registro_criado' | 'campo_alterado'
  | 'agendado' | 'webhook_recebido' | 'gatilho_manual';

export type AcaoTipo =
  | 'criar_tarefa' | 'enviar_alerta' | 'mudar_status' | 'atribuir_responsavel'
  | 'notificar_usuario' | 'chamar_ferramenta_ia' | 'webhook_saida' | 'solicitar_aprovacao';

export type Operador = '=' | '!=' | '>' | '<' | 'contém' | 'começa com' | 'está vazio';

export type AutomationStatus = 'rascunho' | 'ativa' | 'pausada' | 'pausada_por_loop';

/** Entidades com trigger REAL ligado hoje. Ver `gatilhosProntos` pro estado por gatilho. */
export const entidadesDisponiveis = [
  { valor: 'crm_casos', rotulo: 'Caso (CRM)' },
  { valor: 'client_tasks', rotulo: 'Tarefa' },
] as const;

/**
 * Estado REAL de cada gatilho, não o catálogo aspiracional. `pronto:false` = o schema aceita a
 * regra, mas nada dispara ela ainda -- a tela avisa em vez de deixar o usuário criar algo
 * silenciosamente inerte.
 */
export const gatilhosProntos: Record<GatilhoTipo, { rotulo: string; pronto: boolean; nota?: string }> = {
  mudanca_status: { rotulo: 'um registro mudar de status', pronto: true },
  registro_criado: { rotulo: 'um registro novo for criado', pronto: true },
  gatilho_manual: { rotulo: 'eu clicar em "Executar agora"', pronto: true },
  prazo_atingido: { rotulo: 'um prazo for atingido', pronto: false, nota: 'A varredura de prazos entra no Dia 3 — a regra fica salva, mas não dispara sozinha ainda.' },
  campo_alterado: { rotulo: 'um campo específico mudar', pronto: false, nota: 'Ainda sem gatilho ligado — previsto pro Dia 3.' },
  agendado: { rotulo: 'chegar um horário agendado', pronto: false, nota: 'Reaproveita o agendador que já existe, mas a ligação entra no Dia 3.' },
  webhook_recebido: { rotulo: 'chegar um evento externo (webhook)', pronto: false, nota: 'Depende de auditar o Webhook Engine — ainda não ligado.' },
};

/** Mesma ideia pras ações: só 3 têm executor real hoje. */
export const acoesProntas: Record<AcaoTipo, { rotulo: string; pronto: boolean; nota?: string }> = {
  criar_tarefa: { rotulo: 'criar uma tarefa', pronto: true },
  enviar_alerta: { rotulo: 'enviar um alerta', pronto: true },
  notificar_usuario: { rotulo: 'notificar uma pessoa', pronto: true },
  mudar_status: { rotulo: 'mudar o status do registro', pronto: false, nota: 'Executor previsto pro Dia 3.' },
  atribuir_responsavel: { rotulo: 'trocar o responsável', pronto: false, nota: 'Executor previsto pro Dia 3.' },
  chamar_ferramenta_ia: { rotulo: 'pedir algo pra Imya (consome crédito de IA)', pronto: false, nota: 'Única ação que consome crédito de IA. Precisa escolher a ferramenta — entra depois.' },
  webhook_saida: { rotulo: 'chamar um sistema externo (webhook)', pronto: false, nota: 'Depende de auditar o Webhook Engine.' },
  solicitar_aprovacao: { rotulo: 'pedir aprovação de alguém', pronto: false, nota: 'Ligação real ao mecanismo de aprovação entra no Dia 4.' },
};

export const operadores: { valor: Operador; rotulo: string }[] = [
  { valor: '=', rotulo: 'for igual a' },
  { valor: '!=', rotulo: 'for diferente de' },
  { valor: '>', rotulo: 'for maior que' },
  { valor: '<', rotulo: 'for menor que' },
  { valor: 'contém', rotulo: 'contiver' },
  { valor: 'começa com', rotulo: 'começar com' },
  { valor: 'está vazio', rotulo: 'estiver vazio' },
];

export const statusLabels: Record<AutomationStatus, string> = {
  rascunho: 'Rascunho',
  ativa: 'Ativa',
  pausada: 'Pausada',
  pausada_por_loop: 'Pausada automaticamente',
};

export type Gatilho = { tipo: GatilhoTipo; entidade?: string; de?: string | null; para?: string | null; campo?: string; dias?: number; cron_expression?: string };
export type Condicao = { campo: string; operador: Operador; valor?: string };
export type Acao = { tipo: AcaoTipo; [param: string]: unknown };

export type AutomationRule = {
  id: string;
  cliente_id: string;
  capability_id: string | null;
  nome: string;
  descricao: string | null;
  status: AutomationStatus;
  gatilho: Gatilho;
  condicoes: Condicao[];
  acoes: Acao[];
  origem_template: string | null;
  criado_em: string;
  atualizado_em: string | null;
  ultima_execucao_em: string | null;
  contador_execucoes: number;
};

function getClient() {
  return universoSupabase;
}

export async function listAutomationRules(clienteId: string): Promise<AutomationRule[]> {
  const client = getClient();
  if (!client) return [];
  const { data, error } = await client
    .from('automation_rules')
    .select('*')
    .eq('cliente_id', clienteId)
    .is('excluido_em', null)
    .order('criado_em', { ascending: false });
  if (error) return [];
  return (data || []) as AutomationRule[];
}

/**
 * Cota mensal de execuções, lida de `platform_plans.monthly_automation_limit` (Dia 3).
 * `limite`/`restantes` null = plano sem teto (Enterprise). Política decidida pelo usuário em
 * 30/08: ao atingir o teto a automação BLOQUEIA até o próximo ciclo — não gera excedente.
 */
export type AutomationQuota = {
  limite: number | null;
  usadas: number;
  restantes: number | null;
  ilimitado: boolean;
  bloqueado: boolean;
  bloqueado_em: string | null;
};

export async function getAutomationQuota(clienteId: string): Promise<AutomationQuota | null> {
  const client = getClient();
  if (!client) return null;
  const { data, error } = await client.rpc('fn_automation_quota', { p_cliente_id: clienteId });
  if (error) return null;
  const rows = (data || []) as AutomationQuota[];
  return rows[0] ?? null;
}

export type SaveAutomationInput = {
  id?: string | null;
  nome: string;
  descricao?: string | null;
  status: Exclude<AutomationStatus, 'pausada_por_loop'>;
  gatilho: Gatilho;
  condicoes: Condicao[];
  acoes: Acao[];
  origemTemplate?: string | null;
};

export async function saveAutomationRule(clienteId: string, input: SaveAutomationInput): Promise<{ ok: boolean; error?: string; rule?: AutomationRule }> {
  const client = getClient();
  if (!client) return { ok: false, error: 'Supabase não configurado.' };
  const { data, error } = await client.rpc('fn_save_automation_rule', {
    p_cliente_id: clienteId,
    p_nome: input.nome,
    p_gatilho: input.gatilho,
    p_acoes: input.acoes,
    p_condicoes: input.condicoes,
    p_descricao: input.descricao || null,
    p_status: input.status,
    p_id: input.id || null,
    p_capability_id: null,
    p_origem_template: input.origemTemplate || null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, rule: data as AutomationRule };
}

export async function setAutomationRuleStatus(clienteId: string, id: string, status: Exclude<AutomationStatus, 'pausada_por_loop'>): Promise<{ ok: boolean; error?: string }> {
  const client = getClient();
  if (!client) return { ok: false, error: 'Supabase não configurado.' };
  const { error } = await client.rpc('fn_set_automation_rule_status', { p_id: id, p_cliente_id: clienteId, p_status: status });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteAutomationRule(clienteId: string, id: string): Promise<{ ok: boolean; error?: string }> {
  const client = getClient();
  if (!client) return { ok: false, error: 'Supabase não configurado.' };
  const { error } = await client.rpc('fn_delete_automation_rule', { p_id: id, p_cliente_id: clienteId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function runAutomationNow(clienteId: string, id: string): Promise<{ ok: boolean; error?: string; resultado?: Record<string, unknown> }> {
  const client = getClient();
  if (!client) return { ok: false, error: 'Supabase não configurado.' };
  const { data, error } = await client.rpc('fn_run_automation_now', { p_id: id, p_cliente_id: clienteId });
  if (error) return { ok: false, error: error.message };
  const resultado = (data || {}) as Record<string, unknown>;
  if (resultado.ok === false) return { ok: false, error: String(resultado.motivo ?? 'A automação não disparou.'), resultado };
  return { ok: true, resultado };
}

/**
 * Biblioteca de templates -- PROPOSTA local, ainda não lida do `capabilities.manifest`.
 *
 * Estado real (verificado no banco vivo em 31/08): `manifest.automacoes_padrao` não existe em
 * nenhuma das 4 Capacidades, então não há contrato pra ler ainda. Proposta de formato enviada
 * pra frente H (dona do Capability Engine) em
 * `database/00_controle/proposta-frente-e-para-h-manifest-automacoes-padrao.md` -- deliberadamente
 * NÃO escrevi no manifest dela pra não haver escrita concorrente no mesmo jsonb.
 *
 * Quando o contrato for confirmado, isto vira leitura do manifest e some daqui: os campos abaixo
 * são exatamente `gatilho`/`condicoes`/`acoes` da tabela, então a troca é de origem do dado, não
 * de formato. Só templates que usam gatilho+ação REALMENTE ligados hoje -- não adianta oferecer
 * 1 clique pra algo que nasce inerte.
 */
export type AutomationTemplate = {
  codigo: string;
  nome: string;
  descricao: string;
  capacidade: string;
  gatilho: Gatilho;
  condicoes: Condicao[];
  acoes: Acao[];
};

export const templatesPropostos: AutomationTemplate[] = [
  {
    codigo: 'caso_ganho_cria_onboarding',
    nome: 'Caso ganho → criar tarefa de onboarding',
    descricao: 'Quando um caso do CRM for marcado como ganho, cria automaticamente a tarefa de onboarding do cliente novo.',
    capacidade: 'Receita & Crescimento',
    gatilho: { tipo: 'mudanca_status', entidade: 'crm_casos', para: 'ganho' },
    condicoes: [],
    acoes: [{ tipo: 'criar_tarefa', descricao: 'Onboarding do cliente novo', prioridade: 'Alta', origem: 'Automação' }],
  },
  {
    codigo: 'caso_alto_valor_alerta',
    nome: 'Caso de alto valor ganho → alertar a equipe',
    descricao: 'Avisa a equipe quando um caso acima de R$ 5.000 é fechado como ganho.',
    capacidade: 'Receita & Crescimento',
    gatilho: { tipo: 'mudanca_status', entidade: 'crm_casos', para: 'ganho' },
    condicoes: [{ campo: 'valor', operador: '>', valor: '5000' }],
    acoes: [{ tipo: 'enviar_alerta', descricao: 'Caso de alto valor fechado', mensagem: 'Um caso acima de R$ 5.000 foi fechado como ganho.', prioridade: 'Alta' }],
  },
  {
    codigo: 'caso_perdido_notifica',
    nome: 'Caso perdido → notificar o responsável',
    descricao: 'Notifica quando um caso é marcado como perdido, pra registrar o motivo enquanto está fresco.',
    capacidade: 'Receita & Crescimento',
    gatilho: { tipo: 'mudanca_status', entidade: 'crm_casos', para: 'perdido' },
    condicoes: [],
    acoes: [{ tipo: 'notificar_usuario', responsavel: 'Equipe Comercial', mensagem: 'Um caso foi marcado como perdido. Registre o motivo enquanto está fresco.' }],
  },
];
