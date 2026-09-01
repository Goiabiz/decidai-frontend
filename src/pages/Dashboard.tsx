import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronRight, ClipboardList, FileText, Globe2, ListChecks } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { CollapsibleKpiSection } from '../components/CollapsibleKpiSection';
import { Badge } from '../components/Badge';
import { alertas, documentos, kpis } from '../data/mock';
import { useAsyncData, type ConnectionState } from '../hooks/useAsyncData';
import { fetchAlertas, fetchDashboard, fetchDocumentos } from '../services/radarApi';
import { useSession } from '../contexts/SessionContext';
import { listTasks, type TaskRecord } from '../services/tarefas';
import { listKnowledgeEntries, type KnowledgeEntryRecord, type KnowledgeSourceType } from '../services/baseConhecimento';
import { STATUS_CATEGORY_LABELS } from '../lib/statusCategory';
import type { PageProps } from '../App';

const knowledgeSourceLabel: Record<KnowledgeSourceType, string> = {
  agente_extraido: 'Extraído pelo agente',
  manual: 'Cadastro manual',
  documento: 'Documento',
};

const TONE_CYCLE = ['blue', 'orange', 'green', 'red', 'purple', 'cyan', 'slate'];
const toneForIndex = (index: number) => TONE_CYCLE[index % TONE_CYCLE.length];

/**
 * Níveis de drill-down são fixos aos campos básicos que já existem (pedido do usuário,
 * 17/08) -- não é configurável por tela, é sempre esta ordem.
 */
type DonutLevel<T> = { title: string; groupLabel: (item: T) => string };

function computeDrillState<T>(items: T[], levels: DonutLevel<T>[], path: string[]) {
  let filtered = items;
  for (let i = 0; i < path.length; i++) {
    const level = levels[i];
    filtered = filtered.filter((item) => level.groupLabel(item) === path[i]);
  }
  const currentLevel = levels[path.length];
  const counts = new Map<string, number>();
  if (currentLevel) {
    for (const item of filtered) {
      const label = currentLevel.groupLabel(item);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  const segments = Array.from(counts.entries()).map(([label, value], index) => ({ label, value, tone: toneForIndex(index) }));
  const total = filtered.length;
  return { segments, total, hasMoreLevels: path.length + 1 < levels.length };
}

// WP-01 (31/08/2026) -- zero legítimo permanece zero.
// A versão anterior era `parsed > 0 ? parsed : fallback`: um KPI real valendo 0 vindo do
// Supabase era trocado por um número inventado. Pior, a troca acontecia com a origem sendo
// 'supabase', então o aviso de dado demonstrativo NÃO aparecia -- o usuário via um número
// fabricado sem nenhuma indicação de que não era real.
// Agora 0 é valor válido; ausência de verdade devolve null, e a tela mostra "—".
const METRIC_UNAVAILABLE = '—';

const parseMetric = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const digits = String(value).replace(/\D/g, '');
  if (digits === '') return null;
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : null;
};

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

type DrillSegment = { label: string; value: number; tone: string };

/**
 * Anel clicável de verdade (cada segmento é um <circle> SVG separado, não um único
 * background de conic-gradient) -- pedido explícito: "clicar numa fatia desce um nível".
 * Legenda também clicável, pelo mesmo motivo de acessibilidade (fatia fina é difícil de
 * acertar no mouse).
 */
function DrillDonutChart({
  segments,
  total,
  centerLabel,
  canDrill,
  onSelect,
}: {
  segments: DrillSegment[];
  total: number;
  centerLabel: string;
  canDrill: boolean;
  onSelect: (label: string) => void;
}) {
  const size = 190;
  const center = size / 2;
  const radius = 77;
  const strokeWidth = 36;
  const circumference = 2 * Math.PI * radius;

  const arcs: Array<{ segment: DrillSegment; dashLength: number; dashOffset: number }> = [];
  let cursor = 0;
  for (const segment of segments) {
    const fraction = total ? segment.value / total : 0;
    const dashLength = fraction * circumference;
    arcs.push({ segment, dashLength, dashOffset: -cursor * circumference });
    cursor += fraction;
  }

  return (
    <div className="executive-donut">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="executive-donut-svg">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--slate-100)" strokeWidth={strokeWidth} />
        {arcs.map(({ segment, dashLength, dashOffset }) => (
          <circle
            key={segment.label}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={toneColor(segment.tone)}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashLength} ${circumference - dashLength}`}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${center} ${center})`}
            className={canDrill ? 'donut-segment clickable' : 'donut-segment'}
            onClick={canDrill ? () => onSelect(segment.label) : undefined}
          >
            <title>{segment.label}: {segment.value} ({total ? Math.round((segment.value / total) * 100) : 0}%)</title>
          </circle>
        ))}
      </svg>
      <div><strong>{total}</strong><span>{centerLabel}</span></div>
    </div>
  );
}

function DonutBreadcrumb({ path, onJump }: { path: string[]; onJump: (depth: number) => void }) {
  if (path.length === 0) return null;
  return (
    <div className="donut-breadcrumb">
      <button onClick={() => onJump(0)}>Todos</button>
      {path.map((label, index) => (
        <span key={index}>
          <ChevronRight size={12} />
          {index === path.length - 1 ? <strong>{label}</strong> : <button onClick={() => onJump(index + 1)}>{label}</button>}
        </span>
      ))}
    </div>
  );
}

export function Dashboard({ onOpenDetail, onNavigate }: PageProps) {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;

  const dashboard = useAsyncData(fetchDashboard, kpis);
  const alertasData = useAsyncData(fetchAlertas, alertas);
  const documentosData = useAsyncData(fetchDocumentos, documentos);
  // WP-01 -- quatro situações distintas que antes se misturavam numa mensagem só: carregando,
  // conexão lenta, falha real e demonstração. O aviso original dizia "não foi possível carregar"
  // já durante o carregamento normal, porque `useAsyncData` começa com source='mock'.
  // A leitura passou a ser por `connectionState`, que distingue as quatro sem inferência.
  const fontes = [dashboard, alertasData, documentosData];
  const estados = fontes.map((fonte) => fonte.connectionState);
  const hasBackendError = estados.some((estado) => estado === 'error');
  const isLento = estados.some((estado) => estado === 'slow');
  const isCarregando = estados.some((estado) => estado === 'connecting');
  const isDemoData = !hasBackendError && !isLento && !isCarregando && estados.some((estado) => estado === 'demo');

  // Ordem: erro primeiro (mais grave), depois lenta, depois carregando, depois demo.
  // "Lenta" ganhou mensagem própria porque agora produz "—" nos cards -- sem explicação,
  // o usuário veria indicadores vazios sem saber por quê.
  const dataNotice = hasBackendError
    ? 'Não foi possível carregar os indicadores do servidor. Os indicadores abaixo estão indisponíveis.'
    : isLento
      ? 'A conexão está lenta — os indicadores ainda não foram carregados.'
      : isCarregando
        ? 'Carregando indicadores…'
        : isDemoData
          ? 'Alguns indicadores estão exibindo dados locais de demonstração — não vieram do servidor.'
          : undefined;

  // FIND-ARCH-NEW-015, opção A (31/08/2026) -- falha de backend NÃO promove mock a indicador.
  //
  // `useAsyncData` restaura o mock como dado no `catch`. Antes, 4 dos 5 cards passavam a exibir
  // números de `data/mock.ts` com o mesmo estilo de dado real, protegidos só pelo subtítulo --
  // e a lista de alertas chegava a renderizar 4 alertas fabricados com títulos verossímeis.
  //
  // Só há duas origens aceitáveis para um número aqui: veio do servidor, ou é modo demonstração
  // explicitamente rotulado (loader devolveu mock SEM erro). Erro e carregamento não produzem
  // número -- produzem "—".
  // NOVO-2 (31/08/2026) -- o gate passou a olhar `connectionState`, não `loading || error`.
  //
  // Achado do QA-WHITE (frente H): o timer SLOW_CONNECTION_MS (3,5 s) do `useAsyncData` executa
  // `setLoading(false)` SEM que o loader tenha respondido, e sem tocar em `error` nem em `data`.
  // O gate anterior avaliava falsy nesse estado e liberava o mock inicial como indicador --
  // rotulado como "demonstração", que é falso: conexão lenta não é modo de demonstração.
  //
  // `connectionState` é exaustivo e não depende de inferência: só 'connected' (veio do servidor)
  // e 'demo' (mock deliberado, sem erro) produzem número. 'connecting', 'slow' e 'error' -> "—".
  const indicadorUtilizavel = <T,>(fonte: { data: T; connectionState: ConnectionState }): T | null =>
    fonte.connectionState === 'connected' || fonte.connectionState === 'demo' ? fonte.data : null;

  const kpisUtil = indicadorUtilizavel(dashboard);
  const alertasUtil = indicadorUtilizavel(alertasData);
  const documentosUtil = indicadorUtilizavel(documentosData);

  // FIND-QA-BLACK-01/02/03 (31/08/2026) -- `null` significa FONTE INDISPONÍVEL, distinto de
  // `[]`, que significa "consulta funcionou e não há nada". Antes ambos eram `[]`, e a tela
  // afirmava "nenhum conhecimento publicado ainda" com a base cheia e a consulta fora do ar.
  //
  // Os dois services já entregavam o sinal -- `listKnowledgeEntries` devolve `error`,
  // `listTasks` devolve `source` -- e o Dashboard descartava os dois, consumindo só `.items`.
  // A correção é aqui, no consumidor; nenhum service foi alterado.
  const [tasks, setTasks] = useState<TaskRecord[] | null>(null);
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntryRecord[] | null>(null);
  const [taskDrillPath, setTaskDrillPath] = useState<string[]>([]);
  const [knowledgeDrillPath, setKnowledgeDrillPath] = useState<string[]>([]);

  useEffect(() => {
    if (!clienteId) { setTasks(null); return; }
    let active = true;
    listTasks(clienteId)
      // `source: 'local'` é fallback de `localStorage` -- dado do navegador, não do servidor.
      // Exibi-lo como operacional é o que o critério absoluto proíbe.
      .then((result) => { if (active) setTasks(result.source === 'supabase' ? result.items : null); })
      .catch(() => { if (active) setTasks(null); });
    return () => { active = false; };
  }, [clienteId]);

  useEffect(() => {
    if (!clienteId) { setKnowledgeEntries(null); return; }
    let active = true;
    listKnowledgeEntries(undefined, clienteId)
      .then((result) => { if (active) setKnowledgeEntries(result.error ? null : result.items); })
      .catch(() => { if (active) setKnowledgeEntries(null); });
    return () => { active = false; };
  }, [clienteId]);

  // Níveis imutáveis (não configuráveis por usuário) -- decisão de 17/08.
  const taskDonutLevels = useMemo<DonutLevel<TaskRecord>[]>(() => [
    { title: 'status', groupLabel: (task) => STATUS_CATEGORY_LABELS[task.categoria] },
    { title: 'origem', groupLabel: (task) => task.origem || 'Sem origem' },
    { title: 'responsável', groupLabel: (task) => task.responsavel || 'Sem responsável' },
  ], []);

  const knowledgeDonutLevels = useMemo<DonutLevel<KnowledgeEntryRecord>[]>(() => [
    { title: 'categoria', groupLabel: (entry) => entry.category || 'Sem categoria' },
    { title: 'origem', groupLabel: (entry) => knowledgeSourceLabel[entry.sourceType] || entry.sourceType },
  ], []);

  const taskDrill = useMemo(
    () => computeDrillState(tasks ?? [], taskDonutLevels, taskDrillPath),
    [tasks, taskDonutLevels, taskDrillPath],
  );
  const knowledgeDrill = useMemo(
    () => computeDrillState(knowledgeEntries ?? [], knowledgeDonutLevels, knowledgeDrillPath),
    [knowledgeEntries, knowledgeDonutLevels, knowledgeDrillPath],
  );

  const drillTaskInto = (label: string) => setTaskDrillPath((current) => [...current, label]);
  const drillKnowledgeInto = (label: string) => setKnowledgeDrillPath((current) => [...current, label]);

  const metricValue = (labelIncludes: string[]): number | null => {
    if (!kpisUtil) return null;
    const item = kpisUtil.find((kpi) => labelIncludes.some((label) => kpi.label.toLowerCase().includes(label)));
    return parseMetric(item?.value);
  };

  const cards = [
    {
      label: 'Conhecimentos ativos',
      // KPI real quando existe; senão a contagem real da lista -- que pode ser 0 de verdade.
      // `??` e não `||`: uma lista legitimamente vazia vale 0, não "indisponível".
      value: metricValue(['document', 'conhecimento']) ?? documentosUtil?.length ?? METRIC_UNAVAILABLE,
      tone: 'green',
      title: 'Conhecimentos disponíveis para consulta, análise, alertas, orientações e tarefas.',
      icon: <FileText size={20} />,
      page: 'base' as const,
    },
    {
      label: 'Alertas',
      // Contagem real da lista. Zero alertas é uma resposta legítima -- e boa.
      value: alertasUtil?.length ?? METRIC_UNAVAILABLE,
      tone: 'red',
      title: 'Sinais gerados a partir de fontes, regras, mudanças ou monitoramentos que exigem atenção.',
      icon: <AlertTriangle size={20} />,
      page: 'alertas' as const,
    },
    {
      label: 'Ações pendentes',
      // Não há lista local que sustente este número: se o KPI não veio, não sabemos.
      // Mostrar "—" é honesto; mostrar 1 era invenção.
      value: metricValue(['ação', 'ações', 'acao', 'acoes']) ?? METRIC_UNAVAILABLE,
      tone: 'orange',
      title: 'Ações aguardando análise, decisão, validação ou encaminhamento.',
      icon: <ClipboardList size={20} />,
      page: 'atendimento-fila' as const,
    },
    {
      label: 'Novas tarefas',
      // Antes: `tasks.filter(...).length`, que sob falha exibia 0 ao lado de quatro "—" --
      // lendo-se como "esse eu consegui carregar". Era o pior dos cinco no caminho de falha.
      value: tasks ? tasks.filter((task) => task.categoria === 'novo').length : METRIC_UNAVAILABLE,
      tone: 'blue',
      title: 'Tarefas criadas recentemente a partir de alertas, análises, orientações ou decisões.',
      icon: <ListChecks size={20} />,
      page: 'analise' as const,
    },
    {
      label: 'Fontes monitoradas',
      // Contagem real de fontes distintas. Nenhuma fonte cadastrada é 0, não 4.
      value: documentosUtil ? new Set(documentosUtil.map((item) => item.fonte)).size : METRIC_UNAVAILABLE,
      tone: 'cyan',
      title: 'Fontes cadastradas para acompanhamento, captura ou consulta de conhecimento.',
      icon: <Globe2 size={20} />,
      page: 'base' as const,
    }
  ];

  // Mesma regra dos cards: sob falha a lista fica vazia em vez de renderizar os alertas
  // fabricados do mock -- que têm título verossímil e são mais enganosos que um número errado.
  const latestAlertas = (alertasUtil ?? []).slice(0, 5);
  const latestTasks = (tasks ?? []).slice(0, 5);

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

  const openTaskModal = (tarefa: TaskRecord) => {
    const statusLabel = STATUS_CATEGORY_LABELS[tarefa.categoria];
    onOpenDetail?.({
      title: tarefa.descricao,
      subtitle: tarefa.origem,
      badge: statusLabel,
      badgeTone: statusLabel,
      description: 'Tarefa recente exibida na Área de Trabalho para acompanhamento executivo.',
      meta: [
        { label: 'Origem', value: tarefa.origem },
        { label: 'Status', value: statusLabel },
        { label: 'Responsável', value: tarefa.responsavel || '-' }
      ],
      actions: ['Abrir tarefa', 'Ver origem', 'Concluir']
    });
  };

  return (
    <>
      <PageHeader title="Área de Trabalho" subtitle={dataNotice} />

      <CollapsibleKpiSection>
        <div className="kpi-grid five dashboard-kpis">
          {cards.map((card) => (
            <KpiCard
              key={card.label}
              label={card.label}
              value={card.value}
              tone={card.tone}
              tooltip={card.title}
              icon={card.icon}
              onClick={onNavigate ? () => onNavigate(card.page) : undefined}
            />
          ))}
        </div>
      </CollapsibleKpiSection>

      <div className="dashboard-executive-grid">
        <section className="card dashboard-donut-card">
          <div className="section-title-row">
            <div>
              <h3>Tarefas por status</h3>
              <p className="muted">
                {taskDrillPath.length === 0 ? 'Percentual de gargalo operacional por situação.' : `Nível ${taskDrillPath.length + 1}: por ${taskDonutLevels[taskDrillPath.length]?.title ?? ''}.`}
              </p>
            </div>
          </div>

          <DonutBreadcrumb path={taskDrillPath} onJump={(depth) => setTaskDrillPath((current) => current.slice(0, depth))} />

          <div className="donut-summary-layout">
            <DrillDonutChart
              segments={taskDrill.segments}
              total={taskDrill.total}
              centerLabel="tarefas"
              canDrill={taskDrill.hasMoreLevels}
              onSelect={drillTaskInto}
            />
            <div className="donut-legend-list">
              {taskDrill.segments.map((item) => (
                <div
                  key={item.label}
                  className={taskDrill.hasMoreLevels ? 'clickable' : undefined}
                  onClick={taskDrill.hasMoreLevels ? () => drillTaskInto(item.label) : undefined}
                >
                  <i className={`tone-${item.tone}`} />
                  <span>{item.label}</span>
                  <strong>{taskDrill.total ? Math.round((item.value / taskDrill.total) * 100) : 0}%</strong>
                </div>
              ))}
            </div>
          </div>
          {taskDrill.total === 0 && (
            <p className="empty-note">
              {tasks === null
                ? 'Tarefas indisponíveis — não foi possível carregar do servidor.'
                : 'Nenhuma tarefa registrada ainda.'}
            </p>
          )}
        </section>

        <section className="card dashboard-donut-card">
          <div className="section-title-row">
            <div>
              <h3>Atualizações da Base de Conhecimento</h3>
              <p className="muted">
                {knowledgeDrillPath.length === 0 ? 'Distribuição dos conhecimentos por categoria.' : `Nível ${knowledgeDrillPath.length + 1}: por ${knowledgeDonutLevels[knowledgeDrillPath.length]?.title ?? ''}.`}
              </p>
            </div>
          </div>

          <DonutBreadcrumb path={knowledgeDrillPath} onJump={(depth) => setKnowledgeDrillPath((current) => current.slice(0, depth))} />

          <div className="donut-summary-layout">
            <DrillDonutChart
              segments={knowledgeDrill.segments}
              total={knowledgeDrill.total}
              centerLabel="entradas"
              canDrill={knowledgeDrill.hasMoreLevels}
              onSelect={drillKnowledgeInto}
            />
            <div className="donut-legend-list">
              {knowledgeDrill.segments.map((item) => (
                <div
                  key={item.label}
                  className={knowledgeDrill.hasMoreLevels ? 'clickable' : undefined}
                  onClick={knowledgeDrill.hasMoreLevels ? () => drillKnowledgeInto(item.label) : undefined}
                >
                  <i className={`tone-${item.tone}`} />
                  <span>{item.label}</span>
                  <strong>{knowledgeDrill.total ? Math.round((item.value / knowledgeDrill.total) * 100) : 0}%</strong>
                </div>
              ))}
            </div>
          </div>
          {knowledgeDrill.total === 0 && (
            <p className="empty-note">
              {knowledgeEntries === null
                ? 'Conhecimentos indisponíveis — não foi possível carregar do servidor.'
                : 'Nenhum conhecimento publicado ainda.'}
            </p>
          )}
        </section>
      </div>

      <section className="card dashboard-wide-list">
        <div className="section-title-row">
          <h3>Tarefas recentes</h3>
        </div>

        <div className="executive-list">
          {latestTasks.map((tarefa) => (
            <button className="executive-list-row" key={tarefa.id} onClick={() => openTaskModal(tarefa)}>
              <Badge tone="blue">{tarefa.origem}</Badge>
              <strong>{tarefa.descricao}</strong>
              <span>{tarefa.responsavel || 'Sem responsável'}</span>
              <small>{STATUS_CATEGORY_LABELS[tarefa.categoria]}</small>
            </button>
          ))}
        </div>

        {latestTasks.length === 0 && (
          <p className="empty-note">
            {tasks === null
              ? 'Tarefas indisponíveis — não foi possível carregar do servidor.'
              : 'Nenhuma tarefa registrada ainda.'}
          </p>
        )}
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

        {latestAlertas.length === 0 && (
          <p className="empty-note">
            {alertasUtil === null
              ? 'Alertas indisponíveis — não foi possível carregar do servidor.'
              : 'Nenhum alerta encontrado na base.'}
          </p>
        )}
      </section>
    </>
  );
}
