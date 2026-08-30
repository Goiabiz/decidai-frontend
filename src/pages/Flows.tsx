import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { CollapsibleKpiSection } from '../components/CollapsibleKpiSection';
import { Badge } from '../components/Badge';
import { showAppToast } from '../lib/appToast';
import { confirmApp } from '../lib/appConfirm';
import { useSession } from '../contexts/SessionContext';
import { FlowBuilderCanvas, type FlowBuilderCanvasHandle } from '../components/flow/FlowBuilderCanvas';
import {
  confirmFlowStep,
  deleteFlow,
  getFlow,
  getFlowRun,
  listFlowRuns,
  listFlows,
  runFlowNow,
  saveFlowSteps,
  upsertFlowDefinition,
  type FlowRunDetail,
  type FlowRunSummary,
  type FlowStep,
  type FlowStepRun,
  type FlowSummary,
  type FlowTriggerType,
} from '../services/flows';

type FormState = {
  name: string;
  description: string;
  usageArea: string;
  triggerType: FlowTriggerType;
  cronExpression: string;
  isActive: boolean;
};

const emptyForm: FormState = { name: '', description: '', usageArea: '', triggerType: 'manual', cronExpression: '', isActive: true };

const statusTone = (status: string) => {
  if (status === 'completed') return 'green';
  if (status === 'waiting_confirmation') return 'orange';
  if (status === 'failed') return 'red';
  if (status === 'running' || status === 'pending') return 'blue';
  return 'blue';
};

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  running: 'Rodando',
  waiting_confirmation: 'Aguardando confirmação',
  completed: 'Concluída',
  failed: 'Falhou',
  cancelled: 'Cancelada',
};

export function Flows() {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;

  const [flows, setFlows] = useState<FlowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [runs, setRuns] = useState<FlowRunSummary[]>([]);
  const [selectedRun, setSelectedRun] = useState<{ run: FlowRunDetail; stepRuns: FlowStepRun[] } | null>(null);
  const [busyAction, setBusyAction] = useState(false);
  const canvasRef = useRef<FlowBuilderCanvasHandle>(null);

  const loadFlows = () => {
    if (!clienteId) { setLoading(false); return; }
    setLoading(true);
    listFlows(clienteId).then((result) => {
      setFlows(result.items);
      if (result.error) showAppToast(result.error, 'warning');
    }).finally(() => setLoading(false));
  };

  useEffect(loadFlows, [clienteId]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSteps([{ stepOrder: 1, stepType: 'instrucao', instruction: '', requiresHumanApproval: false, config: {} }]);
    setRuns([]);
    setSelectedRun(null);
    setModalOpen(true);
  };

  const openEdit = async (flow: FlowSummary) => {
    setEditingId(flow.id);
    setForm({
      name: flow.name,
      description: flow.description ?? '',
      usageArea: flow.usageArea,
      triggerType: flow.triggerType,
      cronExpression: flow.cronExpression ?? '',
      isActive: flow.isActive,
    });
    setSelectedRun(null);
    setModalOpen(true);

    const result = await getFlow(flow.id, clienteId);
    if ('error' in result) { showAppToast(result.error, 'warning'); return; }
    setSteps(result.steps.length > 0 ? result.steps : [{ stepOrder: 1, stepType: 'instrucao', instruction: '', requiresHumanApproval: false, config: {} }]);

    const runsResult = await listFlowRuns(flow.id, clienteId);
    setRuns(runsResult.items);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const save = async () => {
    if (!form.name.trim()) return showAppToast('Informe o nome do flow.', 'warning');
    if (!form.usageArea.trim()) return showAppToast('Informe a área de uso do flow.', 'warning');
    if (form.triggerType === 'cron' && !form.cronExpression.trim()) {
      return showAppToast('Informe a expressão cron do disparo agendado.', 'warning');
    }

    const finalSteps = canvasRef.current?.getSteps() ?? steps;
    if (finalSteps.length === 0 || finalSteps.some((step) => !step.instruction.trim())) {
      return showAppToast('Todo passo precisa de uma instrução preenchida.', 'warning');
    }

    setSalvando(true);
    try {
      const result = await upsertFlowDefinition({
        id: editingId ?? undefined,
        name: form.name,
        description: form.description || null,
        usageArea: form.usageArea,
        triggerType: form.triggerType,
        cronExpression: form.triggerType === 'cron' ? form.cronExpression : null,
        isActive: form.isActive,
      }, clienteId);

      if ('error' in result) return showAppToast(result.error, 'warning');

      const stepsResult = await saveFlowSteps(result.id, finalSteps, clienteId);
      if ('error' in stepsResult) return showAppToast(stepsResult.error, 'warning');

      showAppToast(editingId ? 'Flow atualizado.' : 'Flow cadastrado.', 'success');
      closeModal();
      loadFlows();
    } finally {
      setSalvando(false);
    }
  };

  const remove = async (flow: FlowSummary) => {
    const confirmed = await confirmApp({
      title: 'Excluir flow',
      description: `Excluir o flow "${flow.name}"? Isso apaga também o histórico de execuções dele.`,
      confirmLabel: 'Excluir',
      tone: 'danger',
    });
    if (!confirmed) return;
    const result = await deleteFlow(flow.id, clienteId);
    if ('error' in result) return showAppToast(result.error, 'warning');
    showAppToast('Flow excluído.', 'success');
    loadFlows();
  };

  const runNow = async (flow: FlowSummary) => {
    setBusyAction(true);
    try {
      const result = await runFlowNow(flow.id, clienteId);
      if ('error' in result) return showAppToast(result.error, 'warning');
      showAppToast(result.status === 'waiting_confirmation' ? 'Flow rodando -- pausado aguardando confirmação de uma ação.' : 'Flow concluído.', 'success');
      const runsResult = await listFlowRuns(flow.id, clienteId);
      setRuns(runsResult.items);
    } finally {
      setBusyAction(false);
    }
  };

  const openRun = async (runId: string) => {
    const result = await getFlowRun(runId, clienteId);
    if ('error' in result) { showAppToast(result.error, 'warning'); return; }
    setSelectedRun(result);
  };

  const confirmRun = async (runId: string) => {
    setBusyAction(true);
    try {
      const result = await confirmFlowStep(runId, clienteId);
      if ('error' in result) return showAppToast(result.error, 'warning');
      showAppToast(result.status === 'waiting_confirmation' ? 'Próxima ação também aguarda confirmação.' : 'Ação confirmada -- flow retomado.', 'success');
      await openRun(runId);
      if (editingId) {
        const runsResult = await listFlowRuns(editingId, clienteId);
        setRuns(runsResult.items);
      }
    } finally {
      setBusyAction(false);
    }
  };

  if (!clienteId) {
    return (
      <>
        <PageHeader title="Flows" />
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>
          Acesse o contexto de um cliente para ver os flows dele.
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Flows" />
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>Carregando...</div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Flows" />

      <CollapsibleKpiSection>
        <div className="kpi-grid four">
          <KpiCard label="Flows ativos" value={String(flows.filter((f) => f.isActive).length)} trend={`${flows.length} no total`} tone="green" />
          <KpiCard label="Disparo manual" value={String(flows.filter((f) => f.triggerType === 'manual').length)} trend="rodam sob demanda" tone="blue" />
          <KpiCard label="Disparo agendado" value={String(flows.filter((f) => f.triggerType === 'cron').length)} trend="rodam sozinhos" tone="purple" />
          <KpiCard label="Passos sensíveis" value="—" trend="ações sempre pedem confirmação" tone="orange" />
        </div>
      </CollapsibleKpiSection>

      <section className="workspace-settings-panel">
        <div className="workspace-settings-header">
          <div>
            <h2>Flows</h2>
            <p>Sequências de passos que o agente segue -- instruções (o agente responde/decide) e ações (efeito real, sempre com confirmação humana).</p>
          </div>
          <button className="secondary-btn" onClick={openNew}>Novo flow</button>
        </div>
      </section>

      <section className="card roadmap-card">
        <div className="section-title-row">
          <h3>Flows cadastrados</h3>
          <span className="small-muted">{flows.length} registros</span>
        </div>
        {flows.length === 0 ? (
          <p className="empty-note">Nenhum flow cadastrado ainda.</p>
        ) : (
          <div className="simple-table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>Área de uso</th><th>Disparo</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {flows.map((item) => (
                  <tr key={item.id} className="clickable-row" onClick={() => openEdit(item)}>
                    <td><strong>{item.name}</strong><div className="table-subtitle">{item.description || '-'}</div></td>
                    <td>{item.usageArea}</td>
                    <td className="table-subtitle">{item.triggerType === 'cron' ? (item.cronExpression || 'cron') : 'manual'}</td>
                    <td><Badge tone={item.isActive ? 'green' : 'blue'}>{item.isActive ? 'Ativo' : 'Inativo'}</Badge></td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <button className="secondary-btn" disabled={busyAction} onClick={() => runNow(item)}>Rodar agora</button>
                      {' '}
                      <button className="icon-btn" onClick={() => remove(item)} title="Excluir"><X size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="agent-modal">
            <div className="cadastro-modal-header">
              <strong>{editingId ? 'Editar flow' : 'Novo flow'}</strong>
              <button className="icon-btn" onClick={closeModal}><X size={18} /></button>
            </div>
            <div className="cadastro-modal-content">
              <section className="cadastro-form-section">
                <h3>Dados do flow</h3>
                <div className="cadastro-form-grid">
                  <label className="span-2"><span>Nome *</span><input value={form.name} onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))} placeholder="Nome do flow" /></label>
                  <label><span>Área de uso *</span><input value={form.usageArea} onChange={(event) => setForm((c) => ({ ...c, usageArea: event.target.value }))} placeholder="Ex.: suporte-atendimento" /></label>
                  <label>
                    <span>Status</span>
                    <select value={form.isActive ? 'ativo' : 'inativo'} onChange={(event) => setForm((c) => ({ ...c, isActive: event.target.value === 'ativo' }))}>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </label>
                  <label className="span-2"><span>Descrição</span><textarea value={form.description} onChange={(event) => setForm((c) => ({ ...c, description: event.target.value }))} placeholder="Para que serve este flow." /></label>
                  <label>
                    <span>Disparo</span>
                    <select value={form.triggerType} onChange={(event) => setForm((c) => ({ ...c, triggerType: event.target.value as FlowTriggerType }))}>
                      <option value="manual">Manual</option>
                      <option value="cron">Agendado (cron)</option>
                    </select>
                  </label>
                  {form.triggerType === 'cron' && (
                    <label><span>Expressão cron *</span><input value={form.cronExpression} onChange={(event) => setForm((c) => ({ ...c, cronExpression: event.target.value }))} placeholder="Ex.: 0 9 * * * (todo dia às 9h)" /></label>
                  )}
                </div>
              </section>

              <section className="cadastro-form-section">
                <h3>Passos</h3>
                <FlowBuilderCanvas key={editingId ?? 'novo'} ref={canvasRef} initialSteps={steps} triggerType={form.triggerType} cronExpression={form.cronExpression || null} />
              </section>

              {editingId && (
                <section className="cadastro-form-section">
                  <h3>Execuções recentes</h3>
                  {runs.length === 0 ? (
                    <p className="empty-note">Este flow ainda não rodou.</p>
                  ) : (
                    <div className="simple-table-wrap">
                      <table>
                        <thead><tr><th>Início</th><th>Disparo</th><th>Status</th><th></th></tr></thead>
                        <tbody>
                          {runs.map((run) => (
                            <tr key={run.id} className="clickable-row" onClick={() => openRun(run.id)}>
                              <td className="table-subtitle">{run.startedAt ? new Date(run.startedAt).toLocaleString('pt-BR') : '-'}</td>
                              <td className="table-subtitle">{run.triggerType === 'cron' ? 'agendado' : 'manual'}</td>
                              <td><Badge tone={statusTone(run.status)}>{statusLabel[run.status] ?? run.status}</Badge></td>
                              <td onClick={(event) => event.stopPropagation()}>
                                {run.status === 'waiting_confirmation' && (
                                  <button className="secondary-btn" disabled={busyAction} onClick={() => confirmRun(run.id)}>Confirmar ação</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedRun && (
                    <div className="flow-run-detail">
                      <h4>Passos da execução selecionada</h4>
                      {selectedRun.stepRuns.map((sr) => (
                        <div key={sr.id} className="flow-run-step-row">
                          <Badge tone={statusTone(sr.status)}>{statusLabel[sr.status] ?? sr.status}</Badge>
                          <span>Passo {sr.stepOrder}</span>
                          {sr.errorMessage && <span className="flow-run-step-error">{sr.errorMessage}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
            <div className="cadastro-modal-footer">
              <button onClick={closeModal}>Cancelar</button>
              <button className="primary" onClick={save} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar flow'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Flows;
