import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { KpiCard } from '../../components/KpiCard';
import { Badge } from '../../components/Badge';
import { showAppToast } from '../../lib/appToast';
import { FlowCanvas, type FlowCanvasHandle } from '../../components/flow/FlowCanvas';
import type { Fluxo } from '../../types/workflow';
import { flowTemplates, getFlowTemplate } from '../../data/flowTemplates';
import { STATUS_CATEGORY_LABELS, STATUS_CATEGORY_ORDER, type StatusCategory } from '../../lib/statusCategory';
import { useSession } from '../../contexts/SessionContext';
import {
  createFila,
  createFluxo,
  createGrupo,
  createServico,
  createSla,
  listFilas,
  listFluxos,
  listGrupos,
  listServicos,
  listSlas,
  prioridades,
  type FilaRecord,
  type FluxoRecord,
  type GrupoFilaRecord,
  type ItemStatus,
  type Prioridade,
  type ServicoRecord,
  type SlaRecord,
} from '../../services/servicosFilas';
import type { PageProps } from '../../App';
import type { PanelDetail } from '../../components/RightPanel';

type ItemTipo = 'Serviço' | 'Fila' | 'Grupo de filas' | 'Fluxo' | 'SLA';

const PRIORIDADE_RANK: Record<Prioridade, number> = { Crítica: 0, Alta: 1, Média: 2, Baixa: 3 };

const emptyServico = { nome: '', descricao: '', status: 'Ativo' as ItemStatus };
const emptyFila = { servicoId: '', nome: '', responsavel: '', capacidade: '', status: 'Ativo' as ItemStatus };
const emptyGrupo = { nome: '', filaIds: [] as string[], transferenciaLivre: true, status: 'Ativo' as ItemStatus };
type SlaCalendario = '24x7' | 'comercial';
type SlaFormState = { servicoId: string; prioridade: Prioridade; prazoHoras: string; calendario: SlaCalendario; pausarEm: StatusCategory[]; manterPrazo: boolean; status: ItemStatus };
const emptySla: SlaFormState = { servicoId: '', prioridade: 'Média', prazoHoras: '', calendario: 'comercial', pausarEm: [], manterPrazo: true, status: 'Ativo' };

function createDefaultFluxo(): Fluxo {
  return {
    id: `fluxo-${Date.now()}`,
    nome: '',
    statuses: [
      { id: 'novo', label: 'Novo', categoria: 'novo', posX: 60, posY: 80 },
      { id: 'andamento', label: 'Em andamento', categoria: 'andamento', posX: 300, posY: 80 },
      { id: 'concluido', label: 'Concluído', categoria: 'concluido', posX: 540, posY: 80 },
    ],
    transitions: [
      { id: 'novo-andamento', fromId: 'novo', toId: 'andamento' },
      { id: 'andamento-concluido', fromId: 'andamento', toId: 'concluido' },
    ],
  };
}

const governanceItems: Array<{ tipo: ItemTipo; descricao: string; tag: string }> = [
  { tipo: 'Serviço', descricao: 'Tipo de trabalho tratado pela Central de Atendimento.', tag: 'Estrutura' },
  { tipo: 'Fila', descricao: 'Local de tratamento e responsabilidade operacional.', tag: 'Operação' },
  { tipo: 'Grupo de filas', descricao: 'Filas que se conversam, com transferência entre si.', tag: 'Operação' },
  { tipo: 'Fluxo', descricao: 'Caminho do atendimento entre status e transições.', tag: 'Processo' },
  { tipo: 'SLA', descricao: 'Prazo por prioridade, calendário e regra de pausa.', tag: 'Gestão' },
];

const statusTone = (status: ItemStatus) => (status === 'Ativo' ? 'green' : status === 'Pendente' ? 'orange' : 'blue');

export function ServicosFilas({ onSelectDetail }: PageProps) {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;

  const [servicos, setServicos] = useState<ServicoRecord[]>([]);
  const [filas, setFilas] = useState<FilaRecord[]>([]);
  const [grupos, setGrupos] = useState<GrupoFilaRecord[]>([]);
  const [fluxos, setFluxos] = useState<FluxoRecord[]>([]);
  const [slas, setSlas] = useState<SlaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ItemTipo | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [formServico, setFormServico] = useState(emptyServico);
  const [formFila, setFormFila] = useState(emptyFila);
  const [formGrupo, setFormGrupo] = useState(emptyGrupo);
  const [fluxoNome, setFluxoNome] = useState('');
  const [fluxoTemplateKey, setFluxoTemplateKey] = useState('em-branco');
  const [fluxoDraft, setFluxoDraft] = useState<Fluxo>(() => createDefaultFluxo());
  const [formSla, setFormSla] = useState(emptySla);
  const flowCanvasRef = useRef<FlowCanvasHandle>(null);

  useEffect(() => {
    if (!clienteId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([listServicos(clienteId), listFilas(clienteId), listGrupos(clienteId), listFluxos(clienteId), listSlas(clienteId)])
      .then(([s, f, g, fl, sl]) => {
        setServicos(s.items);
        setFilas(f.items);
        setGrupos(g.items);
        setFluxos(fl.items);
        setSlas(sl.items);
      })
      .finally(() => setLoading(false));
  }, [clienteId]);

  const servicoNome = (id: string) => servicos.find((item) => item.id === id)?.nome ?? '-';
  const filaNome = (id: string) => filas.find((item) => item.id === id)?.nome ?? '-';
  const filasDoServico = (servicoId: string) => filas.filter((item) => item.servicoId === servicoId);
  const grupoDaFila = (id: string) => grupos.find((item) => item.filaIds.includes(id))?.nome;
  const select = (detail: PanelDetail) => onSelectDetail?.(detail);

  const buildServicoDetail = (item: ServicoRecord): PanelDetail => {
    const filasVinculadas = filasDoServico(item.id);
    return {
      title: item.nome,
      subtitle: `${filasVinculadas.length} fila(s)`,
      badge: item.status,
      badgeTone: statusTone(item.status),
      description: item.descricao || 'Sem descrição registrada.',
      meta: [
        { label: 'Filas', value: filasVinculadas.map((f) => f.nome).join(', ') || 'Nenhuma' },
        { label: 'Status', value: item.status },
      ],
      actions: ['Editar serviço', 'Duplicar serviço', 'Arquivar serviço'],
    };
  };

  const buildFilaDetail = (item: FilaRecord): PanelDetail => ({
    title: item.nome,
    subtitle: item.responsavel ? `Responsável: ${item.responsavel}` : undefined,
    badge: item.status,
    badgeTone: statusTone(item.status),
    meta: [
      { label: 'Serviço', value: servicoNome(item.servicoId) },
      { label: 'Responsável', value: item.responsavel || '-' },
      { label: 'Capacidade', value: item.capacidade || '-' },
      { label: 'Grupo de filas', value: grupoDaFila(item.id) ?? 'Nenhum' },
    ],
    actions: ['Editar fila', 'Duplicar fila', 'Arquivar fila'],
  });

  const buildGrupoDetail = (item: GrupoFilaRecord): PanelDetail => ({
    title: item.nome,
    subtitle: `${item.filaIds.length} filas`,
    badge: item.status,
    badgeTone: statusTone(item.status),
    meta: [
      { label: 'Filas', value: item.filaIds.map(filaNome).join(', ') || '-' },
      { label: 'Transferência entre filas', value: item.transferenciaLivre ? 'Permitida' : 'Bloqueada' },
    ],
    actions: ['Editar grupo', 'Duplicar grupo', 'Arquivar grupo'],
  });

  const buildFluxoDetail = (item: FluxoRecord): PanelDetail => ({
    title: item.nome,
    subtitle: `${item.fluxo.statuses.length} status • ${item.fluxo.transitions.length} transições`,
    badge: item.status,
    badgeTone: statusTone(item.status),
    meta: item.fluxo.statuses.map((s) => ({ label: STATUS_CATEGORY_LABELS[s.categoria], value: s.label })),
    actions: ['Editar fluxo', 'Duplicar fluxo', 'Arquivar fluxo'],
  });

  const buildSlaDetail = (item: SlaRecord): PanelDetail => ({
    title: `Prioridade ${item.prioridade}`,
    subtitle: `Prazo: ${item.prazoHoras}h`,
    badge: item.status,
    badgeTone: statusTone(item.status),
    meta: [
      { label: 'Serviço', value: servicoNome(item.servicoId) },
      { label: 'Prazo', value: `${item.prazoHoras}h` },
      { label: 'Calendário', value: item.calendario === '24x7' ? '24x7' : 'Horário comercial' },
      { label: 'Pausa a contagem em', value: item.pausarEm.length ? item.pausarEm.map((c) => STATUS_CATEGORY_LABELS[c]).join(', ') : 'Nunca pausa' },
      { label: 'Ao trocar prioridade', value: item.manterPrazo ? 'Mantém prazo restante' : 'Reinicia contagem' },
    ],
    actions: ['Editar SLA', 'Duplicar SLA', 'Arquivar SLA'],
  });

  const openModal = (tipo: ItemTipo) => {
    if (tipo === 'Fluxo') {
      setFluxoNome('');
      setFluxoTemplateKey('em-branco');
      setFluxoDraft(createDefaultFluxo());
    }
    setActiveModal(tipo);
  };

  const applyFluxoTemplate = (key: string) => {
    setFluxoTemplateKey(key);
    if (key === 'em-branco') {
      setFluxoNome('');
      setFluxoDraft(createDefaultFluxo());
      return;
    }
    const template = getFlowTemplate(key);
    if (!template) return;
    setFluxoNome(template.nome);
    setFluxoDraft({ id: `fluxo-${Date.now()}`, ...template.fluxo });
  };

  const saveServico = async () => {
    if (!formServico.nome.trim()) return showAppToast('Informe o nome do serviço.', 'warning');
    if (!clienteId) return showAppToast('Acesse o contexto de um cliente antes de cadastrar.', 'warning');
    setSalvando(true);
    try {
      const { item } = await createServico(clienteId, formServico);
      setServicos((current) => [item, ...current]);
      setActiveModal(null);
      setFormServico(emptyServico);
      showAppToast('Serviço cadastrado.', 'success');
    } finally {
      setSalvando(false);
    }
  };

  const saveFila = async () => {
    if (!formFila.nome.trim()) return showAppToast('Informe o nome da fila.', 'warning');
    if (!formFila.servicoId) return showAppToast('Selecione o serviço ao qual esta fila pertence.', 'warning');
    setSalvando(true);
    try {
      const { item } = await createFila(formFila);
      setFilas((current) => [item, ...current]);
      setActiveModal(null);
      setFormFila(emptyFila);
      showAppToast('Fila cadastrada.', 'success');
    } finally {
      setSalvando(false);
    }
  };

  const saveGrupo = async () => {
    if (!formGrupo.nome.trim()) return showAppToast('Informe o nome do grupo.', 'warning');
    if (formGrupo.filaIds.length < 2) return showAppToast('Selecione ao menos 2 filas para formar um grupo.', 'warning');
    if (!clienteId) return showAppToast('Acesse o contexto de um cliente antes de cadastrar.', 'warning');
    setSalvando(true);
    try {
      const { item } = await createGrupo(clienteId, formGrupo);
      setGrupos((current) => [item, ...current]);
      setActiveModal(null);
      setFormGrupo(emptyGrupo);
      showAppToast('Grupo de filas cadastrado.', 'success');
    } finally {
      setSalvando(false);
    }
  };

  const saveFluxo = async () => {
    if (!fluxoNome.trim()) return showAppToast('Informe o nome do fluxo.', 'warning');
    const fluxo = flowCanvasRef.current?.getFluxo() ?? fluxoDraft;
    if (fluxo.statuses.length === 0) return showAppToast('Adicione ao menos um status ao fluxo.', 'warning');
    if (!clienteId) return showAppToast('Acesse o contexto de um cliente antes de cadastrar.', 'warning');
    setSalvando(true);
    try {
      const { item } = await createFluxo(clienteId, { nome: fluxoNome, fluxo, status: 'Ativo' });
      setFluxos((current) => [item, ...current]);
      setActiveModal(null);
      setFluxoNome('');
      setFluxoTemplateKey('em-branco');
      setFluxoDraft(createDefaultFluxo());
      showAppToast('Fluxo cadastrado.', 'success');
    } finally {
      setSalvando(false);
    }
  };

  const saveSla = async () => {
    if (!formSla.servicoId) return showAppToast('Selecione o serviço ao qual este SLA se aplica.', 'warning');
    if (!formSla.prazoHoras.trim()) return showAppToast('Informe o prazo do SLA.', 'warning');
    if (slas.some((item) => item.servicoId === formSla.servicoId && item.prioridade === formSla.prioridade)) {
      return showAppToast(`Este serviço já tem um SLA para a prioridade ${formSla.prioridade}.`, 'warning');
    }
    setSalvando(true);
    try {
      const { item } = await createSla(formSla);
      setSlas((current) => [...current, item].sort((a, b) => PRIORIDADE_RANK[a.prioridade] - PRIORIDADE_RANK[b.prioridade]));
      setActiveModal(null);
      setFormSla(emptySla);
      showAppToast('SLA cadastrado.', 'success');
    } finally {
      setSalvando(false);
    }
  };

  const toggleGrupoFila = (id: string) => {
    setFormGrupo((current) => ({
      ...current,
      filaIds: current.filaIds.includes(id) ? current.filaIds.filter((item) => item !== id) : [...current.filaIds, id],
    }));
  };

  const togglePausarEm = (categoria: StatusCategory) => {
    setFormSla((current) => ({
      ...current,
      pausarEm: current.pausarEm.includes(categoria) ? current.pausarEm.filter((item) => item !== categoria) : [...current.pausarEm, categoria],
    }));
  };

  if (!clienteId) {
    return (
      <>
        <PageHeader title="Serviços e Filas" />
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>
          Acesse o contexto de um cliente para ver os serviços e filas dele.
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Serviços e Filas" />
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>Carregando...</div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Serviços e Filas" />

      <div className="kpi-grid four">
        <KpiCard label="Serviços ativos" value={String(servicos.filter((item) => item.status === 'Ativo').length)} trend={`${servicos.length} no total`} tone="green" />
        <KpiCard label="Filas ativas" value={String(filas.filter((item) => item.status === 'Ativo').length)} trend={`${grupos.length} grupos`} tone="blue" />
        <KpiCard label="Fluxos configurados" value={String(fluxos.length)} trend="editor em canvas" tone="purple" />
        <KpiCard label="SLAs configurados" value={String(slas.length)} trend={`${prioridades.length} prioridades`} tone="orange" />
      </div>

      <section className="workspace-settings-panel">
        <div className="workspace-settings-header">
          <div>
            <h2>Serviços e Filas</h2>
            <p>Configuração de tipos de atendimento, filas, agrupamento, fluxo e SLA.</p>
          </div>
          <span className="badge badge-blue">Funcionalidade</span>
        </div>

        <div className="governance-list">
          {governanceItems.map((item) => (
            <div className="governance-list-row" key={item.tipo}>
              <div>
                <strong>{item.tipo}</strong>
                <span>{item.descricao}</span>
                <small>{item.tag}</small>
              </div>
              <button className="secondary-btn" onClick={() => openModal(item.tipo)}>Cadastrar {item.tipo.toLowerCase()}</button>
            </div>
          ))}
        </div>
      </section>

      <section className="card roadmap-card">
        <div className="section-title-row">
          <h3>Serviços</h3>
          <span className="small-muted">{servicos.length} registros</span>
        </div>
        {servicos.length === 0 ? (
          <p className="empty-note">Nenhum serviço cadastrado ainda. Cada serviço vira sua própria vista de drill-in ao clicar na linha.</p>
        ) : (
          <div className="simple-table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>Filas</th><th>Status</th></tr></thead>
              <tbody>
                {servicos.map((item) => (
                  <tr key={item.id} className="clickable-row" onClick={() => select(buildServicoDetail(item))}>
                    <td><strong>{item.nome}</strong><div className="table-subtitle">{item.descricao || '-'}</div></td>
                    <td>{filasDoServico(item.id).length}</td>
                    <td><Badge tone={statusTone(item.status)}>{item.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card roadmap-card">
        <div className="section-title-row">
          <h3>Filas</h3>
          <span className="small-muted">{filas.length} registros</span>
        </div>
        {filas.length === 0 ? (
          <p className="empty-note">Nenhuma fila cadastrada ainda. Cadastre um serviço primeiro — toda fila pertence a um serviço.</p>
        ) : (
          <div className="simple-table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>Serviço</th><th>Responsável</th><th>Capacidade</th><th>Grupo</th><th>Status</th></tr></thead>
              <tbody>
                {filas.map((item) => (
                  <tr key={item.id} className="clickable-row" onClick={() => select(buildFilaDetail(item))}>
                    <td><strong>{item.nome}</strong></td>
                    <td>{servicoNome(item.servicoId)}</td>
                    <td>{item.responsavel || '-'}</td>
                    <td>{item.capacidade || '-'}</td>
                    <td>{grupoDaFila(item.id) ?? '-'}</td>
                    <td><Badge tone={statusTone(item.status)}>{item.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card roadmap-card">
        <div className="section-title-row">
          <h3>Grupos de filas</h3>
          <span className="small-muted">{grupos.length} registros</span>
        </div>
        {grupos.length === 0 ? (
          <p className="empty-note">Nenhum grupo cadastrado — filas sem grupo não trocam atendimentos entre si.</p>
        ) : (
          <div className="simple-table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>Filas</th><th>Transferência</th><th>Status</th></tr></thead>
              <tbody>
                {grupos.map((item) => (
                  <tr key={item.id} className="clickable-row" onClick={() => select(buildGrupoDetail(item))}>
                    <td><strong>{item.nome}</strong></td>
                    <td className="table-subtitle">{item.filaIds.map(filaNome).join(', ')}</td>
                    <td><Badge tone={item.transferenciaLivre ? 'green' : 'blue'}>{item.transferenciaLivre ? 'Permitida' : 'Bloqueada'}</Badge></td>
                    <td><Badge tone={statusTone(item.status)}>{item.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card roadmap-card">
        <div className="section-title-row">
          <h3>Fluxos</h3>
          <span className="small-muted">{fluxos.length} registros</span>
        </div>
        {fluxos.length === 0 ? (
          <p className="empty-note">Nenhum fluxo cadastrado ainda.</p>
        ) : (
          <div className="simple-table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>Status e transições</th><th>Status</th></tr></thead>
              <tbody>
                {fluxos.map((item) => (
                  <tr key={item.id} className="clickable-row" onClick={() => select(buildFluxoDetail(item))}>
                    <td><strong>{item.nome}</strong></td>
                    <td className="table-subtitle">{item.fluxo.statuses.length} status • {item.fluxo.transitions.length} transições</td>
                    <td><Badge tone={statusTone(item.status)}>{item.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card roadmap-card">
        <div className="section-title-row">
          <h3>SLA por prioridade</h3>
          <span className="small-muted">{slas.length} de {prioridades.length} prioridades configuradas</span>
        </div>
        {slas.length === 0 ? (
          <p className="empty-note">Nenhum SLA cadastrado ainda — os prazos seguem em aberto por prioridade.</p>
        ) : (
          <div className="simple-table-wrap">
            <table>
              <thead><tr><th>Serviço</th><th>Prioridade</th><th>Prazo</th><th>Calendário</th><th>Pausa</th><th>Ao trocar prioridade</th><th>Status</th></tr></thead>
              <tbody>
                {slas.map((item) => (
                  <tr key={item.id} className="clickable-row" onClick={() => select(buildSlaDetail(item))}>
                    <td>{servicoNome(item.servicoId)}</td>
                    <td><Badge tone="blue">{item.prioridade}</Badge></td>
                    <td>{item.prazoHoras}h</td>
                    <td>{item.calendario === '24x7' ? '24x7' : 'Comercial'}</td>
                    <td className="table-subtitle">{item.pausarEm.length ? item.pausarEm.map((c) => STATUS_CATEGORY_LABELS[c]).join(', ') : 'Nunca'}</td>
                    <td>{item.manterPrazo ? 'Mantém prazo' : 'Reinicia'}</td>
                    <td><Badge tone={statusTone(item.status)}>{item.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {activeModal === 'Serviço' && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="agent-modal">
            <div className="cadastro-modal-header">
              <strong>Novo serviço</strong>
              <button className="icon-btn" onClick={() => setActiveModal(null)}><X size={18} /></button>
            </div>
            <div className="cadastro-modal-content">
              <section className="cadastro-form-section">
                <h3>Dados do serviço</h3>
                <div className="cadastro-form-grid">
                  <label className="span-2"><span>Nome *</span><input value={formServico.nome} onChange={(event) => setFormServico((c) => ({ ...c, nome: event.target.value }))} placeholder="Nome do serviço" /></label>
                  <label><span>Status</span><select value={formServico.status} onChange={(event) => setFormServico((c) => ({ ...c, status: event.target.value as ItemStatus }))}><option>Ativo</option><option>Em análise</option><option>Pendente</option></select></label>
                  <label className="span-2"><span>Descrição</span><textarea value={formServico.descricao} onChange={(event) => setFormServico((c) => ({ ...c, descricao: event.target.value }))} placeholder="Descreva o tipo de trabalho tratado por este serviço." /></label>
                </div>
                <p className="empty-note">Depois de criar o serviço, cadastre as filas dele (um serviço pode ter várias).</p>
              </section>
            </div>
            <div className="cadastro-modal-footer">
              <button onClick={() => setActiveModal(null)}>Cancelar</button>
              <button className="primary" onClick={saveServico} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar serviço'}</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'Fila' && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="agent-modal">
            <div className="cadastro-modal-header">
              <strong>Nova fila</strong>
              <button className="icon-btn" onClick={() => setActiveModal(null)}><X size={18} /></button>
            </div>
            <div className="cadastro-modal-content">
              <section className="cadastro-form-section">
                <h3>Dados da fila</h3>
                <div className="cadastro-form-grid">
                  <label className="span-2"><span>Nome *</span><input value={formFila.nome} onChange={(event) => setFormFila((c) => ({ ...c, nome: event.target.value }))} placeholder="Nome da fila" /></label>
                  <label>
                    <span>Serviço *</span>
                    <select value={formFila.servicoId} onChange={(event) => setFormFila((c) => ({ ...c, servicoId: event.target.value }))}>
                      <option value="">Selecione</option>
                      {servicos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                    </select>
                  </label>
                  <label><span>Responsável</span><input value={formFila.responsavel} onChange={(event) => setFormFila((c) => ({ ...c, responsavel: event.target.value }))} placeholder="Responsável pela fila" /></label>
                  <label><span>Capacidade</span><input value={formFila.capacidade} onChange={(event) => setFormFila((c) => ({ ...c, capacidade: event.target.value }))} placeholder="Ex.: 20 atendimentos/dia" /></label>
                  <label><span>Status</span><select value={formFila.status} onChange={(event) => setFormFila((c) => ({ ...c, status: event.target.value as ItemStatus }))}><option>Ativo</option><option>Em análise</option><option>Pendente</option></select></label>
                </div>
                {servicos.length === 0 && <p className="empty-note">Cadastre um serviço antes de criar uma fila.</p>}
              </section>
            </div>
            <div className="cadastro-modal-footer">
              <button onClick={() => setActiveModal(null)}>Cancelar</button>
              <button className="primary" onClick={saveFila} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar fila'}</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'Grupo de filas' && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="agent-modal">
            <div className="cadastro-modal-header">
              <strong>Novo grupo de filas</strong>
              <button className="icon-btn" onClick={() => setActiveModal(null)}><X size={18} /></button>
            </div>
            <div className="cadastro-modal-content">
              <section className="cadastro-form-section">
                <h3>Dados do grupo</h3>
                <div className="cadastro-form-grid">
                  <label className="span-2"><span>Nome *</span><input value={formGrupo.nome} onChange={(event) => setFormGrupo((c) => ({ ...c, nome: event.target.value }))} placeholder="Ex.: Suporte técnico" /></label>
                  <label><span>Status</span><select value={formGrupo.status} onChange={(event) => setFormGrupo((c) => ({ ...c, status: event.target.value as ItemStatus }))}><option>Ativo</option><option>Em análise</option><option>Pendente</option></select></label>
                </div>
              </section>
              <section className="cadastro-form-section">
                <h3>Filas do grupo</h3>
                {filas.length < 2 ? (
                  <p className="empty-note">Cadastre ao menos 2 filas para formar um grupo.</p>
                ) : (
                  <div className="capability-config">
                    {filas.map((item) => (
                      <label key={item.id}>
                        <input type="checkbox" checked={formGrupo.filaIds.includes(item.id)} onChange={() => toggleGrupoFila(item.id)} />
                        {item.nome}
                      </label>
                    ))}
                  </div>
                )}
                <label className="checkbox-inline-row">
                  <input type="checkbox" checked={formGrupo.transferenciaLivre} onChange={(event) => setFormGrupo((c) => ({ ...c, transferenciaLivre: event.target.checked }))} />
                  Permitir transferência de atendimento entre as filas deste grupo
                </label>
              </section>
            </div>
            <div className="cadastro-modal-footer">
              <button onClick={() => setActiveModal(null)}>Cancelar</button>
              <button className="primary" onClick={saveGrupo} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar grupo'}</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'Fluxo' && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="agent-modal">
            <div className="cadastro-modal-header">
              <strong>Novo fluxo</strong>
              <button className="icon-btn" onClick={() => setActiveModal(null)}><X size={18} /></button>
            </div>
            <div className="cadastro-modal-content">
              <section className="cadastro-form-section">
                <div className="cadastro-form-grid">
                  <label className="span-2">
                    <span>Modelo de fluxo</span>
                    <select value={fluxoTemplateKey} onChange={(event) => applyFluxoTemplate(event.target.value)}>
                      <option value="em-branco">Em branco</option>
                      {flowTemplates.map((template) => (
                        <option key={template.key} value={template.key}>{template.nome}</option>
                      ))}
                    </select>
                  </label>
                  {fluxoTemplateKey !== 'em-branco' && (
                    <p className="span-2 muted" style={{ margin: 0, fontSize: 13 }}>{getFlowTemplate(fluxoTemplateKey)?.descricao}</p>
                  )}
                  <label className="span-2"><span>Nome *</span><input value={fluxoNome} onChange={(event) => setFluxoNome(event.target.value)} placeholder="Nome do fluxo" /></label>
                </div>
              </section>
              <section className="cadastro-form-section">
                <h3>Status e transições</h3>
                <FlowCanvas key={fluxoDraft.id} ref={flowCanvasRef} fluxo={fluxoDraft} />
              </section>
            </div>
            <div className="cadastro-modal-footer">
              <button onClick={() => setActiveModal(null)}>Cancelar</button>
              <button className="primary" onClick={saveFluxo} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar fluxo'}</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'SLA' && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="agent-modal">
            <div className="cadastro-modal-header">
              <strong>Novo SLA</strong>
              <button className="icon-btn" onClick={() => setActiveModal(null)}><X size={18} /></button>
            </div>
            <div className="cadastro-modal-content">
              <section className="cadastro-form-section">
                <h3>Meta de prazo</h3>
                <div className="cadastro-form-grid">
                  <label>
                    <span>Serviço *</span>
                    <select value={formSla.servicoId} onChange={(event) => setFormSla((c) => ({ ...c, servicoId: event.target.value }))}>
                      <option value="">Selecione</option>
                      {servicos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Prioridade</span>
                    <select value={formSla.prioridade} onChange={(event) => setFormSla((c) => ({ ...c, prioridade: event.target.value as Prioridade }))}>
                      {prioridades.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label><span>Prazo (horas) *</span><input value={formSla.prazoHoras} onChange={(event) => setFormSla((c) => ({ ...c, prazoHoras: event.target.value }))} placeholder="Ex.: 4" /></label>
                  <label>
                    <span>Calendário de expediente</span>
                    <select value={formSla.calendario} onChange={(event) => setFormSla((c) => ({ ...c, calendario: event.target.value as 'comercial' | '24x7' }))}>
                      <option value="comercial">Horário comercial (08:00-18:00)</option>
                      <option value="24x7">24x7 — não pausa fora do expediente</option>
                    </select>
                  </label>
                  <label><span>Status</span><select value={formSla.status} onChange={(event) => setFormSla((c) => ({ ...c, status: event.target.value as ItemStatus }))}><option>Ativo</option><option>Em análise</option><option>Pendente</option></select></label>
                </div>
                {servicos.length === 0 && <p className="empty-note">Cadastre um serviço antes de configurar um SLA.</p>}
              </section>
              <section className="cadastro-form-section">
                <h3>Pausar a contagem quando o status estiver em</h3>
                <div className="capability-config">
                  {STATUS_CATEGORY_ORDER.map((categoria) => (
                    <label key={categoria}>
                      <input type="checkbox" checked={formSla.pausarEm.includes(categoria)} onChange={() => togglePausarEm(categoria)} />
                      {STATUS_CATEGORY_LABELS[categoria]}
                    </label>
                  ))}
                </div>
                <p className="empty-note">Nenhuma categoria marcada = o relógio nunca pausa.</p>
              </section>
              <section className="cadastro-form-section">
                <label className="checkbox-inline-row">
                  <input type="checkbox" checked={formSla.manterPrazo} onChange={(event) => setFormSla((c) => ({ ...c, manterPrazo: event.target.checked }))} />
                  Manter o prazo restante se a prioridade mudar no meio do atendimento (carry-over)
                </label>
              </section>
            </div>
            <div className="cadastro-modal-footer">
              <button onClick={() => setActiveModal(null)}>Cancelar</button>
              <button className="primary" onClick={saveSla} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar SLA'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
