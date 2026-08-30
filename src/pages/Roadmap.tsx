import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, LayoutGrid, List, ListTodo, Pencil, Plus, Search, Trash2, TimerReset } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '../components/Badge';
import { KanbanBoard } from '../components/KanbanBoard';
import { showAppToast } from '../lib/appToast';
import { showAppConfirm } from '../lib/appConfirm';
import { formatDate } from '../lib/formatDate';
import { STATUS_CATEGORY_LABELS, STATUS_CATEGORY_ORDER, STATUS_CATEGORY_TONE, type StatusCategory } from '../lib/statusCategory';
import { useSession } from '../contexts/SessionContext';
import { logAudit } from '../services/auditLog';
import { createTask, deleteTask as deleteTaskReal, listTasks, updateTask, updateTaskCategoria, type TaskRecord } from '../services/tarefas';

export type RoadmapProps = { onSelectDetail?: (detail: any) => void; onOpenDetail?: (detail: any) => void };

const emptyTask = { descricao: '', origem: 'Atendimento', responsavel: '', prazo: '' };

type ViewMode = 'lista' | 'kanban';
const VIEW_PREF_KEY = 'radar-sus-view-tarefas';
const taskColumns = STATUS_CATEGORY_ORDER.map((categoria) => ({ id: categoria, label: STATUS_CATEGORY_LABELS[categoria], tone: STATUS_CATEGORY_TONE[categoria] }));

export function Roadmap(_props: RoadmapProps) {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;

  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyTask);
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => (window.localStorage.getItem(VIEW_PREF_KEY) as ViewMode) || 'lista');

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    window.localStorage.setItem(VIEW_PREF_KEY, mode);
  };

  useEffect(() => {
    if (!statusMenuId) return;
    const closeMenu = () => setStatusMenuId(null);
    window.addEventListener('mousedown', closeMenu);
    return () => window.removeEventListener('mousedown', closeMenu);
  }, [statusMenuId]);

  const tasksQuery = useQuery({
    queryKey: ['tarefas', clienteId],
    queryFn: () => listTasks(clienteId as string),
    enabled: !!clienteId,
  });
  const tasks = tasksQuery.data?.items ?? [];
  const loading = tasksQuery.isLoading;
  const invalidarTarefas = () => queryClient.invalidateQueries({ queryKey: ['tarefas', clienteId] });

  const saveMutation = useMutation({
    mutationFn: (input: typeof emptyTask) => (editingId
      ? updateTask(clienteId as string, editingId, input).then(() => undefined)
      : createTask(clienteId as string, input).then(() => undefined)),
    onSuccess: () => {
      invalidarTarefas();
      const editou = Boolean(editingId);
      closeModal();
      showAppToast(editou ? 'Tarefa atualizada.' : 'Tarefa criada.', 'success');
    },
    onError: (error) => showAppToast(error instanceof Error ? error.message : 'Não foi possível salvar a tarefa.', 'error'),
  });

  // Kanban: o card precisa mudar de coluna na hora, sem esperar a rede -- mesmo padrão de
  // mutação otimista já usado em FilaChamados.tsx (onMutate aplica no cache, onError desfaz,
  // onSettled revalida). O invalidateQueries simples faria o card "voltar" e pular de volta.
  const categoriaMutation = useMutation({
    mutationFn: ({ taskId, categoria }: { taskId: string; categoria: StatusCategory }) =>
      updateTaskCategoria(clienteId as string, taskId, categoria),
    onMutate: async ({ taskId, categoria }) => {
      await queryClient.cancelQueries({ queryKey: ['tarefas', clienteId] });
      const previous = queryClient.getQueryData<{ items: TaskRecord[] }>(['tarefas', clienteId]);
      if (previous) {
        queryClient.setQueryData(['tarefas', clienteId], {
          ...previous,
          items: previous.items.map((item) => (item.id === taskId ? { ...item, categoria } : item)),
        });
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['tarefas', clienteId], context.previous);
    },
    onSettled: () => invalidarTarefas(),
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => deleteTaskReal(clienteId as string, taskId),
    onSuccess: () => {
      invalidarTarefas();
      showAppToast('Tarefa excluída.', 'success');
    },
    onError: (error) => showAppToast(error instanceof Error ? error.message : 'Não foi possível excluir a tarefa.', 'error'),
  });

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return tasks;
    return tasks.filter((task) => [task.descricao, task.origem, task.responsavel, task.prazo].join(' ').toLowerCase().includes(normalized));
  }, [tasks, query]);

  const kpis: Array<[string, number, typeof ListTodo, string]> = [
    ['Tarefas abertas', tasks.filter((t) => t.categoria !== 'concluido' && t.categoria !== 'cancelado').length, ListTodo, '#0f62fe'],
    ['Em andamento', tasks.filter((t) => t.categoria === 'andamento').length, Clock, '#00a6d6'],
    ['Vencidas', tasks.filter((t) => t.categoria !== 'concluido' && t.categoria !== 'cancelado' && new Date(t.prazo) < new Date()).length, AlertCircle, '#ff3b5c'],
    ['Concluídas', tasks.filter((t) => t.categoria === 'concluido').length, CheckCircle2, '#00875a'],
    ['Canceladas', tasks.filter((t) => t.categoria === 'cancelado').length, TimerReset, '#7c8880'],
  ];

  const closeModal = () => {
    setModal(false);
    setEditingId(null);
    setForm(emptyTask);
  };

  const openEditModal = (task: TaskRecord) => {
    setEditingId(task.id);
    setForm({ descricao: task.descricao, origem: task.origem, responsavel: task.responsavel, prazo: task.prazo });
    setModal(true);
  };

  const saveTask = async () => {
    if (!form.descricao.trim()) {
      showAppToast('Informe a descrição da tarefa.', 'warning');
      return;
    }
    if (!clienteId) {
      showAppToast('Acesse o contexto de um cliente antes de cadastrar.', 'warning');
      return;
    }

    saveMutation.mutate(form);
  };

  const setTaskCategory = (task: TaskRecord, categoria: StatusCategory) => {
    setStatusMenuId(null);
    if (!clienteId) return;
    categoriaMutation.mutate({ taskId: task.id, categoria });
  };

  const deleteTask = async (task: TaskRecord) => {
    if (!clienteId) return;
    const confirmed = await showAppConfirm({
      title: 'Excluir tarefa',
      description: `Excluir "${task.descricao}"? Esta ação não pode ser desfeita.`,
      tone: 'danger',
      confirmLabel: 'Excluir',
    });
    if (!confirmed) return;
    await deleteMutation.mutateAsync(task.id);
    void logAudit({
      usuarioNome: session?.user.displayName || 'Desconhecido',
      usuarioEmail: session?.user.email || '',
      modulo: 'tarefas',
      funcionalidade: 'exclusao_tarefa',
      operacao: 'delete',
      registroId: task.id,
      dadosAntes: task,
      observacao: `Tarefa "${task.descricao}" excluída (soft delete).`,
    });
  };

  if (!clienteId) {
    return (
      <div className="v3464-page">
        <div className="v3464-page-head"><h1>Tarefas</h1></div>
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>Acesse o contexto de um cliente para ver as tarefas dele.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="v3464-page">
        <div className="v3464-page-head"><h1>Tarefas</h1></div>
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>Carregando...</div>
      </div>
    );
  }

  return (
    <div className="v3464-page">
      <div className="v3464-page-head">
        <h1>Tarefas</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="view-toggle">
            <button className={viewMode === 'lista' ? 'active' : ''} onClick={() => changeViewMode('lista')}><List size={14} /> Lista</button>
            <button className={viewMode === 'kanban' ? 'active' : ''} onClick={() => changeViewMode('kanban')}><LayoutGrid size={14} /> Kanban</button>
          </div>
          <button className="v3464-btn primary" onClick={() => setModal(true)}><Plus size={16} /> Criar tarefa</button>
        </div>
      </div>

      <div className="v3464-kpis">
        {kpis.map(([title, value, Icon, color]) => (
          <div className="v3464-kpi" key={title}>
            <span className="v3464-kpi-icon" style={{ background: color }}><Icon size={22} /></span>
            <div><strong>{title}</strong><h2>{value}</h2></div>
          </div>
        ))}
      </div>

      <section className="v3464-card">
        <div className="v3464-search">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar tarefa, origem, responsável ou prazo..." />
        </div>
        <h2>Tarefas registradas</h2>

        {viewMode === 'kanban' ? (
          <KanbanBoard
            columns={taskColumns}
            items={filtered.map((task) => ({ ...task, columnId: task.categoria }))}
            onMove={(itemId, columnId) => {
              const task = tasks.find((item) => item.id === itemId);
              if (task) void setTaskCategory(task, columnId as StatusCategory);
            }}
            renderCard={(task) => (
              <>
                <strong>{task.descricao}</strong>
                <p>{task.origem} • {task.responsavel || 'Sem responsável'}</p>
                <div className="kanban-card-meta">
                  <span>{task.prioridade}</span>
                  {task.prazo && <span>Prazo: {formatDate(task.prazo)}</span>}
                </div>
              </>
            )}
          />
        ) : (
          <table className="v3464-table">
            <thead>
              <tr><th>Descrição da tarefa</th><th>Origem</th><th>Status</th><th>Prioridade</th><th>Responsável</th><th>Prazo</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {filtered.map((task) => (
                <tr key={task.id}>
                  <td><strong>{task.descricao}</strong></td>
                  <td>{task.origem}</td>
                  <td>
                    <div className="row-menu-wrap">
                      <button
                        className="v3464-icon"
                        title="Alterar status"
                        onClick={() => setStatusMenuId(statusMenuId === task.id ? null : task.id)}
                      >
                        <Badge tone={STATUS_CATEGORY_TONE[task.categoria]}>{STATUS_CATEGORY_LABELS[task.categoria]}</Badge>
                      </button>
                      {statusMenuId === task.id && (
                        <div className="row-more-menu" onClick={(event) => event.stopPropagation()}>
                          {STATUS_CATEGORY_ORDER.map((categoria) => (
                            <button key={categoria} onClick={() => setTaskCategory(task, categoria)}>
                              <Badge tone={STATUS_CATEGORY_TONE[categoria]}>{STATUS_CATEGORY_LABELS[categoria]}</Badge>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{task.prioridade}</td>
                  <td>{task.responsavel}</td>
                  <td>{task.prazo ? formatDate(task.prazo) : '-'}</td>
                  <td>
                    <button className="v3464-icon" title="Editar" onClick={() => openEditModal(task)}><Pencil size={16} /></button>
                    <button className="v3464-icon" title="Excluir" onClick={() => deleteTask(task)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {modal && (
        <div className="v3464-modal-backdrop">
          <section className="v3464-system-modal">
            <button className="v3464-modal-x" onClick={closeModal}>×</button>
            <h2>{editingId ? 'Editar tarefa' : 'Criar tarefa'}</h2>
            <div className="v3464-modal-form">
              <label>Descrição<textarea value={form.descricao} onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))} /></label>
              <label>Origem
                <select value={form.origem} onChange={(event) => setForm((current) => ({ ...current, origem: event.target.value }))}>
                  <option>Atendimento</option>
                  <option>Alerta</option>
                  <option>Conhecimento</option>
                  <option>Análise</option>
                </select>
              </label>
              <label>Responsável<input value={form.responsavel} onChange={(event) => setForm((current) => ({ ...current, responsavel: event.target.value }))} /></label>
              <label>Prazo<input type="date" value={form.prazo} onChange={(event) => setForm((current) => ({ ...current, prazo: event.target.value }))} /></label>
            </div>
            <footer>
              <button className="v3464-secondary-btn" onClick={closeModal}>Cancelar</button>
              <button className="v3464-primary-btn" onClick={() => void saveTask()}>{editingId ? 'Salvar alterações' : 'Salvar tarefa'}</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

export const AnaliseAcoes = Roadmap;
export default Roadmap;
