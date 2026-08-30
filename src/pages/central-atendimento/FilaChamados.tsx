import { useMemo, useState, useEffect } from 'react';
import { LayoutGrid, List, Search } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '../../components/Badge';
import { PageHeader } from '../../components/PageHeader';
import { KanbanBoard } from '../../components/KanbanBoard';
import { useSession } from '../../contexts/SessionContext';
import { listAtendimentosAdmin, updateAtendimentoStatus, type Atendimento, type AtendimentoStatus, type AtendimentosLoadState } from '../../services/atendimentos';
import { categorizeStatusLabel, STATUS_CATEGORY_TONE } from '../../lib/statusCategory';
import { formatDateTime } from '../../lib/formatDate';

const statusFiltros: AtendimentoStatus[] = ['Novo', 'Em andamento', 'Aguardando resposta', 'Concluído', 'Cancelado'];
const filaColumns = statusFiltros.map((status) => ({ id: status, label: status, tone: STATUS_CATEGORY_TONE[categorizeStatusLabel(status)] }));

type ViewMode = 'lista' | 'kanban';
const VIEW_PREF_KEY = 'radar-sus-view-fila-chamados';

function formatDuracao(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  if (totalMin < 60) return `${totalMin} min`;
  const totalHoras = Math.floor(totalMin / 60);
  if (totalHoras < 24) return `${totalHoras}h ${totalMin % 60}min`;
  const dias = Math.floor(totalHoras / 24);
  return `${dias}d ${totalHoras % 24}h`;
}

function tempoAberto(chamado: Atendimento): string {
  const inicio = new Date(chamado.criado_em).getTime();
  const fechado = chamado.status === 'Concluído' || chamado.status === 'Cancelado';
  const fim = fechado ? new Date(chamado.atualizado_em).getTime() : Date.now();
  return formatDuracao(fim - inicio);
}

type FilaChamadosData = { chamados: Atendimento[]; source: AtendimentosLoadState };

export function FilaChamados() {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;
  const queryClient = useQueryClient();

  const filaQuery = useQuery({
    queryKey: ['fila-chamados', clienteId],
    queryFn: () => listAtendimentosAdmin(clienteId as string),
    enabled: !!clienteId,
  });
  const chamados = filaQuery.data?.chamados ?? [];
  const loading = filaQuery.isLoading;
  const source = filaQuery.data?.source ?? 'local';

  const [search, setSearch] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [, forceTick] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>(() => (window.localStorage.getItem(VIEW_PREF_KEY) as ViewMode) || 'lista');

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    window.localStorage.setItem(VIEW_PREF_KEY, mode);
  };

  // Drag-and-drop no Kanban precisa do card se mover na hora, sem esperar o round-trip de rede
  // -- por isso usa o padrão de mutação otimista do React Query (onMutate/onError/onSettled)
  // em vez do onSuccess+invalidateQueries simples do resto da conversão: aplica a mudança no
  // cache antes da resposta do servidor, desfaz se a chamada falhar, revalida no final pra
  // garantir consistência real (nunca fica com dado só otimista, sem confirmação do banco).
  const moveChamadoMutation = useMutation({
    mutationFn: ({ chamadoId, statusAnterior, novoStatus }: { chamadoId: string; statusAnterior: AtendimentoStatus; novoStatus: AtendimentoStatus }) =>
      updateAtendimentoStatus(chamadoId, statusAnterior, novoStatus),
    onMutate: async ({ chamadoId, novoStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['fila-chamados', clienteId] });
      const previous = queryClient.getQueryData<FilaChamadosData>(['fila-chamados', clienteId]);
      if (previous) {
        queryClient.setQueryData<FilaChamadosData>(['fila-chamados', clienteId], {
          ...previous,
          chamados: previous.chamados.map((item) => (item.id === chamadoId ? { ...item, status: novoStatus } : item)),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(['fila-chamados', clienteId], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['fila-chamados', clienteId] });
    },
  });

  const moveChamado = (chamadoId: string, novoStatus: string) => {
    const chamado = chamados.find((item) => item.id === chamadoId);
    if (!chamado || chamado.status === novoStatus) return;
    moveChamadoMutation.mutate({ chamadoId, statusAnterior: chamado.status, novoStatus: novoStatus as AtendimentoStatus });
  };

  // Recalcula "tempo aberto" a cada minuto para os chamados ainda abertos.
  useEffect(() => {
    const interval = window.setInterval(() => forceTick((tick) => tick + 1), 60000);
    return () => window.clearInterval(interval);
  }, []);

  const filtrados = useMemo(() => {
    const query = search.trim().toLowerCase();
    return chamados.filter((chamado) => {
      const matchStatus = !statusFiltro || chamado.status === statusFiltro;
      const matchQuery = !query || `${chamado.assunto} ${chamado.solicitante_nome ?? ''} ${chamado.canal}`.toLowerCase().includes(query);
      return matchStatus && matchQuery;
    });
  }, [chamados, search, statusFiltro]);

  if (!clienteId) {
    return (
      <div className="v3464-page">
        <PageHeader title="Fila de Chamados" subtitle="Visão consolidada de todos os atendimentos, com SLA e responsáveis." />
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>
          Acesse o contexto de um cliente para ver a fila de chamados dele.
        </div>
      </div>
    );
  }

  return (
    <div className="v3464-page">
      <PageHeader
        title="Fila de Chamados"
        subtitle={`Visão consolidada de todos os atendimentos, com SLA e responsáveis.${source === 'local' ? ' (dados locais de demonstração)' : ''}`}
      />

      <section className="card">
        <div className="smart-filter-bar">
          <div className="smart-search">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por assunto, solicitante ou canal..." />
          </div>
          <select value={statusFiltro} onChange={(event) => setStatusFiltro(event.target.value)}>
            <option value="">Todos os status</option>
            {statusFiltros.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <div className="view-toggle">
            <button className={viewMode === 'lista' ? 'active' : ''} onClick={() => changeViewMode('lista')}><List size={14} /> Lista</button>
            <button className={viewMode === 'kanban' ? 'active' : ''} onClick={() => changeViewMode('kanban')}><LayoutGrid size={14} /> Kanban</button>
          </div>
        </div>

        {loading && <p style={{ textAlign: 'center', color: 'var(--slate-500)', padding: 20 }}>Carregando...</p>}

        {!loading && viewMode === 'kanban' && (
          <KanbanBoard
            columns={filaColumns}
            items={filtrados.map((chamado) => ({ ...chamado, columnId: chamado.status }))}
            onMove={(itemId, columnId) => moveChamado(itemId, columnId)}
            renderCard={(chamado) => (
              <>
                <strong>{chamado.assunto}</strong>
                <p>nº {chamado.numero_sequencial} • {chamado.canal}</p>
                <div className="kanban-card-meta">
                  <span>{chamado.solicitante_nome || 'Sem solicitante'}</span>
                  <span>{chamado.responsavel_nome || 'Não atribuído'}</span>
                  <span>{tempoAberto(chamado)}</span>
                </div>
              </>
            )}
          />
        )}

        {!loading && viewMode === 'lista' && (
          <div className="users-table-wrap">
            <div className="users-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Assunto</th>
                    <th>Canal</th>
                    <th>Aberto por</th>
                    <th>Atendendo</th>
                    <th>Abertura</th>
                    <th>Atualização</th>
                    <th>Tempo aberto</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--slate-500)' }}>Nenhum chamado encontrado.</td></tr>
                  )}
                  {filtrados.map((chamado) => {
                    const categoria = categorizeStatusLabel(chamado.status);
                    return (
                      <tr key={chamado.id}>
                        <td><Badge tone={STATUS_CATEGORY_TONE[categoria]}>{chamado.status}</Badge></td>
                        <td><strong>{chamado.assunto}</strong><div className="table-subtitle">nº {chamado.numero_sequencial}</div></td>
                        <td>{chamado.canal}</td>
                        <td>{chamado.solicitante_nome || '-'}</td>
                        <td>{chamado.responsavel_nome || 'Não atribuído'}</td>
                        <td>{formatDateTime(chamado.criado_em)}</td>
                        <td>{formatDateTime(chamado.atualizado_em)}</td>
                        <td>{tempoAberto(chamado)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default FilaChamados;
