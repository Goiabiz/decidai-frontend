import { listTasks } from '../../services/tarefas';
import { listKnowledgeEntries, type KnowledgeSourceType } from '../../services/baseConhecimento';
import { listAtendimentosAdmin } from '../../services/atendimentos';
import { listAlertas } from '../../services/alertas';
import { listTenantCredentials, type ConnectorProviderCode } from '../../services/tenantCredentials';
import { listGithubInstallations } from '../../services/githubApp';
import { listAuditLogs } from '../../services/auditLog';
import { listWorkItemsUniversal } from '../../services/decisions';
import { OPERACAO_LABELS } from '../../lib/auditLabels';
import { queryWithAccessGate } from '../../lib/accessGatedQuery';
import { STATUS_CATEGORY_LABELS } from '../../lib/statusCategory';
import type { StandardReportColumn, StandardReportRow } from './StandardReportPage';

export type ReportDatasetKey = 'tarefas' | 'conhecimentos' | 'atendimentos' | 'alertas' | 'integracoes' | 'auditoria' | 'work-items';

export type ReportLoadCtx = { clienteId: string | null; isSupport: boolean };

export type ReportDataset = {
  key: ReportDatasetKey;
  label: string;
  columns: StandardReportColumn[];
  /** Colunas que viram <select> na casca -- opções derivadas do dado real, não fixas. */
  filters: { key: string; label: string }[];
  /** Presente só quando o domínio tem um campo de data confiável -- omitido esconde o seletor de período em vez de fingir um que não filtra nada. */
  dateColumnKey?: string;
  load: (ctx: ReportLoadCtx) => Promise<{ rows: StandardReportRow[]; gated?: boolean }>;
};

const tarefasColumns: StandardReportColumn[] = [
  { key: 'descricao', label: 'Descrição' },
  { key: 'origem', label: 'Origem' },
  { key: 'status', label: 'Status' },
  { key: 'prioridade', label: 'Prioridade' },
  { key: 'responsavel', label: 'Responsável' },
  { key: 'prazo', label: 'Prazo' },
];

async function loadTarefasReport({ clienteId }: ReportLoadCtx): Promise<{ rows: StandardReportRow[] }> {
  if (!clienteId) return { rows: [] };
  const { items } = await listTasks(clienteId);
  return {
    rows: items.map((task) => ({
      descricao: task.descricao,
      origem: task.origem,
      status: STATUS_CATEGORY_LABELS[task.categoria] || task.categoria,
      prioridade: task.prioridade,
      responsavel: task.responsavel || '-',
      prazo: task.prazo || '-',
    })),
  };
}

const knowledgeSourceLabel: Record<KnowledgeSourceType, string> = {
  agente_extraido: 'Extraído pelo agente',
  manual: 'Cadastro manual',
  documento: 'Documento',
};

const conhecimentosColumns: StandardReportColumn[] = [
  { key: 'title', label: 'Título' },
  { key: 'category', label: 'Categoria' },
  { key: 'sourceType', label: 'Origem' },
  { key: 'tags', label: 'Tags' },
  { key: 'createdAt', label: 'Criado em' },
];

async function loadConhecimentosReport({ clienteId }: ReportLoadCtx): Promise<{ rows: StandardReportRow[] }> {
  if (!clienteId) return { rows: [] };
  const { items } = await listKnowledgeEntries(undefined, clienteId);
  return {
    rows: items.map((entry) => ({
      title: entry.title,
      category: entry.category || 'Sem categoria',
      sourceType: knowledgeSourceLabel[entry.sourceType] || entry.sourceType,
      tags: entry.tags.join(', ') || '-',
      createdAt: entry.createdAt,
    })),
  };
}

const atendimentosColumns: StandardReportColumn[] = [
  { key: 'assunto', label: 'Assunto' },
  { key: 'canal', label: 'Canal' },
  { key: 'status', label: 'Status' },
  { key: 'prioridade', label: 'Prioridade' },
  { key: 'responsavel', label: 'Responsável' },
  { key: 'criado_em', label: 'Criado em' },
];

async function loadAtendimentosReport({ clienteId }: ReportLoadCtx): Promise<{ rows: StandardReportRow[] }> {
  if (!clienteId) return { rows: [] };
  const { chamados } = await listAtendimentosAdmin(clienteId);
  return {
    rows: chamados.map((item) => ({
      assunto: item.assunto,
      canal: item.canal,
      status: item.status,
      prioridade: item.prioridade,
      responsavel: item.responsavel_nome || '-',
      criado_em: item.criado_em,
    })),
  };
}

const alertasColumns: StandardReportColumn[] = [
  { key: 'descricao', label: 'Descrição' },
  { key: 'status', label: 'Status' },
  { key: 'prioridade', label: 'Prioridade' },
  { key: 'responsavel', label: 'Responsável' },
  { key: 'canais', label: 'Canais' },
  { key: 'enviados', label: 'Envios' },
];

async function loadAlertasReport({ clienteId }: ReportLoadCtx): Promise<{ rows: StandardReportRow[] }> {
  if (!clienteId) return { rows: [] };
  const { items } = await listAlertas(clienteId);
  return {
    rows: items.map((alerta) => ({
      descricao: alerta.descricao,
      status: alerta.status,
      prioridade: alerta.prioridade,
      responsavel: alerta.responsavel || '-',
      canais: alerta.canais.join(', ') || '-',
      enviados: alerta.enviados,
    })),
  };
}

const CONNECTOR_LABELS: Record<ConnectorProviderCode, string> = {
  github: 'GitHub (PAT)',
  jira: 'Jira',
  confluence: 'Confluence',
  mariadb: 'MariaDB',
  trello: 'Trello',
};

const integracoesColumns: StandardReportColumn[] = [
  { key: 'conector', label: 'Conector' },
  { key: 'detalhe', label: 'Detalhe' },
  { key: 'status', label: 'Status' },
  { key: 'atualizadoEm', label: 'Atualizado em' },
];

async function loadIntegracoesReport({ clienteId }: ReportLoadCtx): Promise<{ rows: StandardReportRow[] }> {
  if (!clienteId) return { rows: [] };
  const [credenciais, instalacoes] = await Promise.all([
    listTenantCredentials(clienteId),
    listGithubInstallations(clienteId),
  ]);

  const credenciaisRows: StandardReportRow[] = credenciais.providers.map((provider) => ({
    conector: CONNECTOR_LABELS[provider.providerCode as ConnectorProviderCode] || provider.providerCode,
    detalhe: 'Credencial manual (PAT/API)',
    status: 'Configurado',
    atualizadoEm: provider.updatedAt,
  }));

  const githubAppRows: StandardReportRow[] = instalacoes.installations.map((installation) => ({
    conector: 'GitHub App',
    detalhe: `Conta: ${installation.accountLogin}`,
    status: 'Conectado',
    atualizadoEm: installation.createdAt || '-',
  }));

  return { rows: [...credenciaisRows, ...githubAppRows] };
}

const auditoriaColumns: StandardReportColumn[] = [
  { key: 'data', label: 'Data' },
  { key: 'usuario', label: 'Usuário/Agente' },
  { key: 'modulo', label: 'Módulo' },
  { key: 'funcionalidade', label: 'Ação' },
  { key: 'operacao', label: 'Operação' },
];

/**
 * RLS de `auditoria_usuario` devolve lista vazia (não erro) pra quem não é staff -- sem o
 * gate `isSupport`, o relatório mentiria "nenhum registro" em vez de avisar que é
 * restrito. Mesma disciplina de SegurancaAuditoria.tsx.
 */
async function loadAuditoriaReport({ isSupport }: ReportLoadCtx): Promise<{ rows: StandardReportRow[]; gated?: boolean }> {
  const gated = await queryWithAccessGate(isSupport, async () => (await listAuditLogs()).items);
  if (gated.status !== 'ok') return { rows: [], gated: gated.status === 'sem_permissao' };
  return {
    rows: gated.data.map((log) => ({
      data: log.data,
      usuario: log.usuario,
      modulo: log.modulo,
      funcionalidade: log.funcionalidade !== '-' ? log.funcionalidade : log.observacao,
      operacao: OPERACAO_LABELS[log.operacao] || log.operacao,
    })),
  };
}

const workItemsColumns: StandardReportColumn[] = [
  { key: 'tipo', label: 'Tipo' },
  { key: 'titulo', label: 'Título' },
  { key: 'status', label: 'Status' },
  { key: 'prioridade', label: 'Prioridade' },
  { key: 'responsavel', label: 'Responsável' },
  { key: 'criado_em', label: 'Criado em' },
];

/** Work Item Universal (§9 do Plano Mestre v4) -- vw_work_items_universal (migration 160), une tarefa/atendimento/alerta/decisão numa régua só. */
async function loadWorkItemsReport({ clienteId }: ReportLoadCtx): Promise<{ rows: StandardReportRow[] }> {
  if (!clienteId) return { rows: [] };
  const items = await listWorkItemsUniversal(clienteId);
  return {
    rows: items.map((item) => ({
      tipo: item.tipo,
      titulo: item.titulo,
      status: STATUS_CATEGORY_LABELS[item.categoria_status] || item.status_bruto,
      prioridade: item.prioridade || '-',
      responsavel: item.responsavel || '-',
      criado_em: item.criado_em,
    })),
  };
}

export const REPORT_DATASETS: ReportDataset[] = [
  {
    key: 'tarefas',
    label: 'Tarefas',
    columns: tarefasColumns,
    filters: [
      { key: 'status', label: 'Status' },
      { key: 'prioridade', label: 'Prioridade' },
      { key: 'origem', label: 'Origem' },
      { key: 'responsavel', label: 'Responsável' },
    ],
    load: loadTarefasReport,
  },
  {
    key: 'conhecimentos',
    label: 'Conhecimentos',
    columns: conhecimentosColumns,
    filters: [
      { key: 'category', label: 'Categoria' },
      { key: 'sourceType', label: 'Origem' },
    ],
    dateColumnKey: 'createdAt',
    load: loadConhecimentosReport,
  },
  {
    key: 'atendimentos',
    label: 'Atendimentos',
    columns: atendimentosColumns,
    filters: [
      { key: 'status', label: 'Status' },
      { key: 'prioridade', label: 'Prioridade' },
      { key: 'canal', label: 'Canal' },
      { key: 'responsavel', label: 'Responsável' },
    ],
    dateColumnKey: 'criado_em',
    load: loadAtendimentosReport,
  },
  {
    key: 'alertas',
    label: 'Alertas',
    columns: alertasColumns,
    filters: [
      { key: 'status', label: 'Status' },
      { key: 'prioridade', label: 'Prioridade' },
      { key: 'responsavel', label: 'Responsável' },
    ],
    load: loadAlertasReport,
  },
  {
    key: 'integracoes',
    label: 'Integrações',
    columns: integracoesColumns,
    filters: [
      { key: 'conector', label: 'Conector' },
      { key: 'status', label: 'Status' },
    ],
    dateColumnKey: 'atualizadoEm',
    load: loadIntegracoesReport,
  },
  {
    key: 'auditoria',
    label: 'Auditoria',
    columns: auditoriaColumns,
    filters: [
      { key: 'operacao', label: 'Operação' },
      { key: 'modulo', label: 'Módulo' },
    ],
    dateColumnKey: 'data',
    load: loadAuditoriaReport,
  },
  {
    key: 'work-items',
    label: 'Trabalho (Work Item Universal)',
    columns: workItemsColumns,
    filters: [
      { key: 'tipo', label: 'Tipo' },
      { key: 'status', label: 'Status' },
      { key: 'prioridade', label: 'Prioridade' },
    ],
    dateColumnKey: 'criado_em',
    load: loadWorkItemsReport,
  },
];

export function getReportDataset(key: ReportDatasetKey): ReportDataset | undefined {
  return REPORT_DATASETS.find((dataset) => dataset.key === key);
}
