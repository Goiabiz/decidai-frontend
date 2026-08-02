import { AlertTriangle, ClipboardList, FileText, Globe2, ListChecks } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { Badge } from '../components/Badge';
import { DataSourceNotice } from '../components/DataSourceNotice';
import { alertas, documentos, kpis } from '../data/mock';
import { useAsyncData } from '../hooks/useAsyncData';
import { fetchAlertas, fetchDashboard, fetchDocumentos } from '../services/radarApi';
import type { PageProps } from '../App';

const getCombinedSource = (sources: string[]) => sources.every((source) => source === 'supabase') ? 'supabase' : 'mock';

const normalizeNumber = (value: unknown, fallback: number) => {
  const parsed = Number(String(value ?? '').replace(/\D/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const statusResumo = [
  { label: 'Novo', value: 4, tone: 'blue' },
  { label: 'Em análise', value: 6, tone: 'orange' },
  { label: 'Em andamento', value: 5, tone: 'cyan' },
  { label: 'Aguardando validação', value: 3, tone: 'purple' },
  { label: 'Concluído', value: 7, tone: 'green' },
  { label: 'Cancelado', value: 1, tone: 'red' }
];

const tarefasRecentes = [
  { origem: 'Alerta', titulo: 'Validar alteração da tabela SIGTAP', status: 'Novo', responsavel: 'Moises Mattos' },
  { origem: 'Conhecimento', titulo: 'Classificar nova fonte de financiamento APS', status: 'Em análise', responsavel: 'Bruno Oliveira' },
  { origem: 'Atendimento', titulo: 'Revisar impacto do BPA-I no fluxo operacional', status: 'Em andamento', responsavel: 'Mariana Lima' },
  { origem: 'Regra', titulo: 'Preparar orientação interna para clientes', status: 'Aguardando validação', responsavel: 'Juliana Costa' },
  { origem: 'Fonte', titulo: 'Conferir nova publicação cadastrada na base', status: 'Novo', responsavel: 'Rafael Mendes' }
];

const toneColor = (tone: string) => {
  const map: Record<string, string> = {
    green: 'var(--green-700)',
    blue: 'var(--blue-700)',
    orange: 'var(--orange-500)',
    red: 'var(--red-500)',
    purple: 'var(--purple-500)',
    cyan: 'var(--cyan-500)',
    slate: '#334155'
  };
  return map[tone] ?? map.blue;
};

const getDonutGradient = (items: Array<{ value: number; tone: string }>) => {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  let cursor = 0;

  return `conic-gradient(${items.map((item) => {
    const start = cursor;
    const end = cursor + (item.value / total) * 100;
    cursor = end;
    return `${toneColor(item.tone)} ${start}% ${end}%`;
  }).join(', ')})`;
};

const getOriginCategory = (tipo: string) => {
  const normalized = tipo.toLowerCase();
  if (normalized.includes('youtube') || normalized.includes('vídeo') || normalized.includes('video')) return { label: 'Canal de vídeo', tone: 'red' };
  if (normalized.includes('instagram') || normalized.includes('facebook') || normalized.includes('tiktok') || normalized.includes('linkedin') || normalized.includes('rede social')) return { label: 'Rede social', tone: 'purple' };
  if (normalized.includes('site') || normalized.includes('wiki') || normalized.includes('guia') || normalized.includes('página')) return { label: 'Página/Site', tone: 'cyan' };
  if (normalized.includes('api') || normalized.includes('integração') || normalized.includes('integracao')) return { label: 'API/Integração', tone: 'green' };
  if (normalized.includes('planilha')) return { label: 'Planilha/Base', tone: 'green' };
  if (normalized.includes('portaria') || normalized.includes('nota técnica') || normalized.includes('norma')) return { label: 'Norma/Regra', tone: 'blue' };
  return { label: 'Documento/Arquivo', tone: 'slate' };
};

export function Dashboard({ onOpenDetail }: PageProps) {
  const dashboard = useAsyncData(fetchDashboard, kpis);
  const alertasData = useAsyncData(fetchAlertas, alertas);
  const documentosData = useAsyncData(fetchDocumentos, documentos);

  const source = getCombinedSource([dashboard.source, alertasData.source, documentosData.source]);
  const loading = dashboard.loading || alertasData.loading || documentosData.loading;
  const error = dashboard.error || alertasData.error || documentosData.error;

  const metricValue = (labelIncludes: string[], fallback: number) => {
    const item = dashboard.data.find((kpi) => labelIncludes.some((label) => kpi.label.toLowerCase().includes(label)));
    return normalizeNumber(item?.value, fallback);
  };

  const cards = [
    {
      label: 'Conhecimentos ativos',
      value: metricValue(['document', 'conhecimento'], documentosData.data.length || 9),
      tone: 'green',
      title: 'Conhecimentos disponíveis para consulta, análise, alertas, orientações e tarefas.',
      icon: <FileText size={20} />
    },
    {
      label: 'Alertas',
      value: alertasData.data.length || metricValue(['alerta'], 4),
      tone: 'red',
      title: 'Sinais gerados a partir de fontes, regras, mudanças ou monitoramentos que exigem atenção.',
      icon: <AlertTriangle size={20} />
    },
    {
      label: 'Ações pendentes',
      value: metricValue(['ação', 'ações', 'acao', 'acoes'], 1),
      tone: 'orange',
      title: 'Ações aguardando análise, decisão, validação ou encaminhamento.',
      icon: <ClipboardList size={20} />
    },
    {
      label: 'Novas tarefas',
      value: tarefasRecentes.length,
      tone: 'blue',
      title: 'Tarefas criadas recentemente a partir de alertas, análises, orientações ou decisões.',
      icon: <ListChecks size={20} />
    },
    {
      label: 'Fontes monitoradas',
      value: new Set(documentosData.data.map((item) => item.fonte)).size || 4,
      tone: 'cyan',
      title: 'Fontes cadastradas para acompanhamento, captura ou consulta de conhecimento.',
      icon: <Globe2 size={20} />
    }
  ];

  const latestAlertas = alertasData.data.slice(0, 5);
  const statusTotal = statusResumo.reduce((sum, item) => sum + item.value, 0);
  const statusGradient = getDonutGradient(statusResumo);

  const originMap = documentosData.data.reduce<Record<string, { label: string; value: number; tone: string }>>((acc, item) => {
    const category = getOriginCategory(item.tipo);
    acc[category.label] = acc[category.label] ?? { ...category, value: 0 };
    acc[category.label].value += 1;
    return acc;
  }, {});

  const origemResumo = Object.values(originMap);
  const origemFinal = origemResumo.length ? origemResumo : [
    { label: 'Norma/Regra', value: 2, tone: 'blue' },
    { label: 'Documento/Arquivo', value: 1, tone: 'slate' },
    { label: 'Planilha/Base', value: 1, tone: 'green' }
  ];
  const origemTotal = origemFinal.reduce((sum, item) => sum + item.value, 0);
  const origemGradient = getDonutGradient(origemFinal);

  const openAlertModal = (alerta: (typeof latestAlertas)[number]) => {
    onOpenDetail?.({
      title: alerta.titulo,
      subtitle: alerta.fonte,
      badge: alerta.criticidade,
      badgeTone: alerta.criticidade,
      description: 'Alerta selecionado a partir da Área de Trabalho. Para movimentar o fluxo, acesse a Central de Alertas ou use as ações do detalhe.',
      meta: [
        { label: 'Fonte', value: alerta.fonte },
        { label: 'Data/Hora', value: alerta.data },
        { label: 'Módulo', value: alerta.modulo },
        { label: 'Funcionalidade', value: alerta.funcionalidade },
        { label: 'Status', value: alerta.status }
      ],
      actions: ['Gerar ação', 'Ver conhecimento', 'Descartar']
    });
  };

  const openTaskModal = (tarefa: (typeof tarefasRecentes)[number]) => {
    onOpenDetail?.({
      title: tarefa.titulo,
      subtitle: tarefa.origem,
      badge: tarefa.status,
      badgeTone: tarefa.status,
      description: 'Tarefa recente exibida na Área de Trabalho para acompanhamento executivo.',
      meta: [
        { label: 'Origem', value: tarefa.origem },
        { label: 'Status', value: tarefa.status },
        { label: 'Responsável', value: tarefa.responsavel }
      ],
      actions: ['Abrir tarefa', 'Ver origem', 'Concluir']
    });
  };

  return (
    <>
      <PageHeader title="Área de Trabalho" />
      <DataSourceNotice source={source} loading={loading} error={error} connectionState={source === 'supabase' ? 'connected' : loading ? 'connecting' : error ? 'error' : (dashboard.connectionState === 'slow' || alertasData.connectionState === 'slow' || documentosData.connectionState === 'slow') ? 'slow' : 'demo'} />

            <div className="kpi-grid five dashboard-kpis">
        {cards.map((card) => (
          <KpiCard
            key={card.label}
            label={card.label}
            value={card.value}
            tone={card.tone}
            tooltip={card.title}
            icon={card.icon}
          />
        ))}
      </div>

      <div className="dashboard-executive-grid">
        <section className="card dashboard-donut-card">
          <div className="section-title-row">
            <div>
              <h3>Tarefas por status</h3>
              <p className="muted">Percentual de gargalo operacional por situação.</p>
            </div>
          </div>

          <div className="donut-summary-layout">
            <div className="executive-donut" style={{ background: statusGradient }}>
              <div><strong>{statusTotal}</strong><span>tarefas</span></div>
            </div>
            <div className="donut-legend-list">
              {statusResumo.map((item) => (
                <div key={item.label}>
                  <i className={`tone-${item.tone}`} />
                  <span>{item.label}</span>
                  <strong>{Math.round((item.value / statusTotal) * 100)}%</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card dashboard-donut-card">
          <div className="section-title-row">
            <div>
              <h3>Atualizações da Base de Conhecimento</h3>
              <p className="muted">Distribuição dos conhecimentos pela origem da fonte.</p>
            </div>
          </div>

          <div className="donut-summary-layout">
            <div className="executive-donut origin-donut" style={{ background: origemGradient }}>
              <div><strong>{origemTotal}</strong><span>entradas</span></div>
            </div>
            <div className="donut-legend-list">
              {origemFinal.map((item) => (
                <div key={item.label}>
                  <i className={`tone-${item.tone}`} />
                  <span>{item.label}</span>
                  <strong>{Math.round((item.value / origemTotal) * 100)}%</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="card dashboard-wide-list">
        <div className="section-title-row">
          <h3>Tarefas recentes</h3>
        </div>

        <div className="executive-list">
          {tarefasRecentes.map((tarefa) => (
            <button className="executive-list-row" key={`${tarefa.origem}-${tarefa.titulo}`} onClick={() => openTaskModal(tarefa)}>
              <Badge tone="blue">{tarefa.origem}</Badge>
              <strong>{tarefa.titulo}</strong>
              <span>{tarefa.responsavel}</span>
              <small>{tarefa.status}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="card dashboard-wide-list">
        <div className="section-title-row">
          <h3>Alertas recentes</h3>
        </div>

        <div className="executive-list">
          {latestAlertas.map((alerta) => (
            <button className="executive-list-row" key={`${alerta.titulo}-${alerta.data}`} onClick={() => openAlertModal(alerta)}>
              <Badge tone={alerta.criticidade.toLowerCase()}>{alerta.criticidade}</Badge>
              <strong>{alerta.titulo}</strong>
              <span>{alerta.fonte}</span>
              <small>{alerta.status}</small>
            </button>
          ))}
        </div>

        {latestAlertas.length === 0 && <p className="empty-note">Nenhum alerta encontrado na base.</p>}
      </section>
    </>
  );
}
