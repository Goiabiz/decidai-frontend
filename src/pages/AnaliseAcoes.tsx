import { useEffect, useMemo, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { CollapsibleKpiSection } from '../components/CollapsibleKpiSection';
import { Badge } from '../components/Badge';
import { DataSourceNotice } from '../components/DataSourceNotice';
import { InlineRowActions } from '../components/InlineRowActions';
import { SmartFilters, normalizeFilterText } from '../components/SmartFilters';
import { acoes } from '../data/mock';
import { useAsyncData } from '../hooks/useAsyncData';
import { fetchAcoes } from '../services/radarApi';
import { getGeneratedRoadmapItems, getOperationalEventName } from '../services/operationalStore';
import type { PageProps } from '../App';
import type { PanelDetail } from '../components/RightPanel';

const statusTabs = ['Todas', 'Minhas tarefas', 'Aguardando validação', 'Vencidas', 'Concluídas'];
const responsavelAtual = 'Moises Mattos';

const normalizeStatus = (status: string) => {
  const normalized = normalizeFilterText(status);
  if (normalized.includes('concl')) return 'Concluído';
  if (normalized.includes('valid')) return 'Aguardando validação';
  if (normalized.includes('andamento') || normalized.includes('monitor')) return 'Em andamento';
  if (normalized.includes('cancel')) return 'Cancelado';
  return 'Novo';
};

const getOrigem = (origem: string) => {
  const value = normalizeFilterText(origem);
  if (value.includes('atendimento')) return 'Atendimento';
  if (value.includes('alerta')) return 'Alerta';
  if (value.includes('conhecimento')) return 'Conhecimento';
  if (value.includes('agente')) return 'Agente';
  if (value.includes('integracao')) return 'Integração';
  if (value.includes('impacto')) return 'Análise';
  return origem || 'Cadastro manual';
};

const isOverdue = (prazo?: string) => {
  if (!prazo || prazo === '-') return false;
  const [day, month, year] = prazo.split('/').map(Number);
  if (!day || !month || !year) return false;
  return new Date(year, month - 1, day).getTime() < new Date().setHours(0, 0, 0, 0);
};

export function AnaliseAcoes({ onSelectDetail, onOpenDetail }: PageProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [prioridade, setPrioridade] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [tab, setTab] = useState('Todas');
  const { data, source, loading, error, connectionState } = useAsyncData(fetchAcoes, acoes);
  const [generatedItems, setGeneratedItems] = useState(() => getGeneratedRoadmapItems());

  useEffect(() => {
    const refresh = () => setGeneratedItems(getGeneratedRoadmapItems());
    window.addEventListener(getOperationalEventName(), refresh);
    window.addEventListener('focus', refresh);
    refresh();
    return () => {
      window.removeEventListener(getOperationalEventName(), refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const allItems = useMemo(() => [...generatedItems, ...data].map((item, index) => ({
    id: `TRF-${String(index + 1).padStart(4, '0')}`,
    descricao: item.resumo,
    origem: getOrigem(item.origem),
    origemRegistro: item.origem,
    prioridade: item.criticidade || 'Média',
    responsavel: item.responsavel || responsavelAtual,
    prazo: item.prazo || '-',
    status: normalizeStatus(item.status || 'Novo'),
    impacto: item.criticidade || 'Médio'
  })), [generatedItems, data]);

  const filtered = allItems.filter((item) => {
    const text = normalizeFilterText([item.id, item.origem, item.origemRegistro, item.descricao, item.prioridade, item.responsavel, item.prazo, item.status, item.impacto].join(' '));
    const matchesTab = tab === 'Todas'
      || (tab === 'Minhas tarefas' && item.responsavel === responsavelAtual)
      || (tab === 'Aguardando validação' && item.status === 'Aguardando validação')
      || (tab === 'Vencidas' && isOverdue(item.prazo) && item.status !== 'Concluído')
      || (tab === 'Concluídas' && item.status === 'Concluído');

    return matchesTab &&
      (!search || text.includes(normalizeFilterText(search))) &&
      (!status || item.status === status) &&
      (!prioridade || item.prioridade === prioridade) &&
      (!responsavel || item.responsavel === responsavel);
  });

  const abertas = allItems.filter((item) => !['Concluído', 'Cancelado'].includes(item.status)).length;
  const emAndamento = allItems.filter((item) => item.status === 'Em andamento').length;
  const aguardando = allItems.filter((item) => item.status === 'Aguardando validação').length;
  const vencidas = allItems.filter((item) => isOverdue(item.prazo) && item.status !== 'Concluído').length;
  const concluidasHoje = allItems.filter((item) => item.status === 'Concluído').length;

  const buildDetail = (tarefa: (typeof allItems)[number]): PanelDetail => ({
    title: tarefa.descricao,
    subtitle: `${tarefa.id} · ${tarefa.origem}`,
    badge: tarefa.prioridade,
    badgeTone: tarefa.prioridade,
    description: 'Tarefa selecionada para acompanhamento, execução, validação e geração de novas ações quando necessário.',
    meta: [
      { label: 'Status', value: tarefa.status },
      { label: 'Prioridade', value: tarefa.prioridade },
      { label: 'Responsável', value: tarefa.responsavel },
      { label: 'Prazo', value: tarefa.prazo },
      { label: 'Origem', value: tarefa.origem },
      { label: 'Registro de origem', value: tarefa.origemRegistro },
      { label: 'Impacto', value: tarefa.impacto }
    ],
    actions: ['Iniciar tarefa', 'Concluir tarefa', 'Gerar alerta', 'Cadastrar conhecimento', 'Acionar agente', 'Cancelar tarefa']
  });

  return (
    <>
      <PageHeader title="Tarefas" action={<button className="secondary-btn"><PlusCircle size={16} /> Criar tarefa</button>} />
      <DataSourceNotice source={source} loading={loading} error={error} connectionState={connectionState} />

      <CollapsibleKpiSection>
        <div className="kpi-grid five">
          <KpiCard label="Tarefas abertas" value={abertas} tone="blue" tooltip="Tarefas ainda não concluídas ou canceladas." />
          <KpiCard label="Em andamento" value={emAndamento} tone="cyan" tooltip="Tarefas que já estão em execução." />
          <KpiCard label="Aguardando validação" value={aguardando} tone="orange" tooltip="Tarefas executadas ou analisadas que aguardam conferência." />
          <KpiCard label="Vencidas" value={vencidas} tone="red" tooltip="Tarefas abertas com prazo vencido." />
          <KpiCard label="Concluídas" value={concluidasHoje} tone="green" tooltip="Tarefas finalizadas no período exibido." />
        </div>
      </CollapsibleKpiSection>

      <div className="tabs roadmap-tabs">
        {statusTabs.map((item) => (
          <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>

      <SmartFilters search={search} onSearch={setSearch} status={status} onStatus={setStatus} prioridade={prioridade} onPrioridade={setPrioridade} responsavel={responsavel} onResponsavel={setResponsavel} placeholder="Buscar tarefa, origem, responsável ou prazo..." />

      <div className="card">
        <div className="section-title-row roadmap-list-title">
          <h3>Tarefas registradas</h3>
          <span className="small-muted">{filtered.length} registros</span>
        </div>
        <table>
          <thead><tr><th>Descrição da tarefa</th><th>Origem</th><th>Status</th><th>Prioridade</th><th>Responsável</th><th>Prazo</th><th>Ações</th></tr></thead>
          <tbody>
            {filtered.map((tarefa) => {
              const detail = buildDetail(tarefa);
              return (
                <tr className="clickable-row" key={tarefa.id} onClick={() => onSelectDetail?.(detail)}>
                  <td><strong>{tarefa.descricao}</strong><small>{tarefa.id}</small></td>
                  <td><Badge tone="blue">{tarefa.origem}</Badge><small>{tarefa.origemRegistro}</small></td>
                  <td><Badge tone={tarefa.status === 'Concluído' ? 'green' : tarefa.status === 'Aguardando validação' ? 'orange' : 'blue'}>{tarefa.status}</Badge></td>
                  <td><Badge tone={tarefa.prioridade.toLowerCase()}>{tarefa.prioridade}</Badge></td>
                  <td>{tarefa.responsavel}</td>
                  <td>{tarefa.prazo}</td>
                  <td>
                    <InlineRowActions
                      detail={detail}
                      status={tarefa.status}
                      prioridade={tarefa.prioridade}
                      responsavel={tarefa.responsavel}
                      onOpenDetail={onOpenDetail}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
