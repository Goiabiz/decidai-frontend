import { useEffect, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { KanbanBoard, type KanbanItem } from '../../components/KanbanBoard';
import { showAppToast } from '../../lib/appToast';
import { useSession, usePermission } from '../../contexts/SessionContext';
import { listUsuariosCliente, type UsuarioCliente } from '../../services/auth';
import {
  createCaso,
  ensureEstagiosPadrao,
  listCasos,
  listContatos,
  moveCasoEstagio,
  type CrmCaso,
  type CrmCasoInput,
  type CrmContato,
  type CrmEstagio,
} from '../../services/crm';

type CasoKanbanItem = KanbanItem & { caso: CrmCaso };

const TONE_BY_INDEX = ['blue', 'purple', 'orange', 'green', 'red'];

function formatBrl(value: number | null) {
  if (value === null) return null;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const emptyForm: CrmCasoInput = { titulo: '', contatoId: '', estagioId: '', valor: null, responsavelId: null, observacao: '' };

export function CrmPipeline() {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;
  const podeVer = usePermission('crm.acessar.visualizar');
  const podeEditar = usePermission('crm.acessar.editar');

  const [estagios, setEstagios] = useState<CrmEstagio[]>([]);
  const [casos, setCasos] = useState<CrmCaso[]>([]);
  const [contatos, setContatos] = useState<CrmContato[]>([]);
  const [responsaveis, setResponsaveis] = useState<UsuarioCliente[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<CrmCasoInput>(emptyForm);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!clienteId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([ensureEstagiosPadrao(clienteId), listCasos(clienteId), listContatos(clienteId), listUsuariosCliente(clienteId)])
      .then(([estagiosResult, casosResult, contatosResult, responsaveisResult]) => {
        setEstagios(estagiosResult);
        setCasos(casosResult);
        setContatos(contatosResult);
        setResponsaveis(responsaveisResult);
      })
      .catch((error) => showAppToast(error instanceof Error ? error.message : 'Não foi possível carregar o pipeline.', 'error'))
      .finally(() => setLoading(false));
  }, [clienteId]);

  const items = useMemo<CasoKanbanItem[]>(() => casos.map((caso) => ({ id: caso.id, columnId: caso.estagioId, caso })), [casos]);
  const columns = useMemo(() => estagios.map((estagio, index) => ({ id: estagio.id, label: estagio.nome, tone: TONE_BY_INDEX[index % TONE_BY_INDEX.length] })), [estagios]);

  const handleMove = async (itemId: string, columnId: string) => {
    const previous = casos;
    setCasos((current) => current.map((caso) => caso.id === itemId ? { ...caso, estagioId: columnId } : caso));
    try {
      await moveCasoEstagio(itemId, columnId, estagios);
    } catch (error) {
      setCasos(previous);
      showAppToast(error instanceof Error ? error.message : 'Não foi possível mover o caso.', 'error');
    }
  };

  const openForm = () => {
    setForm({ ...emptyForm, estagioId: estagios[0]?.id ?? '' });
    setIsFormOpen(true);
  };

  const saveCaso = async () => {
    if (!form.titulo.trim()) { showAppToast('Informe o título do caso.', 'warning'); return; }
    if (!form.contatoId) { showAppToast('Selecione o contato do caso.', 'warning'); return; }
    if (!form.estagioId) { showAppToast('Selecione o estágio inicial.', 'warning'); return; }
    if (!clienteId) return;

    setSalvando(true);
    try {
      const contato = contatos.find((item) => item.id === form.contatoId);
      const novo = await createCaso(clienteId, { ...form, empresaId: contato?.empresaId ?? null });
      setCasos((current) => [novo, ...current]);
      setIsFormOpen(false);
      showAppToast('Caso criado.', 'success');
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível salvar o caso.', 'error');
    } finally {
      setSalvando(false);
    }
  };

  if (!podeVer) {
    return (
      <>
        <PageHeader title="Pipeline (CRM)" />
        <section className="card audit-clean-card"><p className="muted">O pipeline de casos é visível apenas para quem tem acesso ao CRM.</p></section>
      </>
    );
  }

  if (!clienteId) {
    return (
      <>
        <PageHeader title="Pipeline (CRM)" />
        <section className="card audit-clean-card"><p className="muted">Acesse o contexto de um cliente para ver o pipeline dele.</p></section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Pipeline (CRM)"
        subtitle="Casos em andamento, organizados por estágio. Arraste um card para mudar de estágio."
        action={podeEditar ? <button className="primary-small" onClick={openForm}><Plus size={16} /> Novo caso</button> : undefined}
      />

      {loading ? (
        <section className="card audit-clean-card"><p className="muted">Carregando pipeline...</p></section>
      ) : columns.length === 0 ? (
        <section className="card audit-clean-card"><p className="muted">Nenhum estágio configurado para este ambiente ainda.</p></section>
      ) : (
        <KanbanBoard
          columns={columns}
          items={items}
          onMove={(itemId, columnId) => void handleMove(itemId, columnId)}
          renderCard={(item) => {
            const valorFormatado = formatBrl(item.caso.valor);
            return (
              <div>
                <strong>{item.caso.titulo}</strong>
                <div className="table-subtitle">{item.caso.contatoNome}{item.caso.empresaNome ? ` · ${item.caso.empresaNome}` : ''}</div>
                {valorFormatado && <div className="table-subtitle">{valorFormatado}</div>}
                {item.caso.responsavelNome && <div className="table-subtitle">Responsável: {item.caso.responsavelNome}</div>}
              </div>
            );
          }}
        />
      )}

      {isFormOpen && (
        <div className="modal-backdrop unit-modal-backdrop">
          <div className="unit-form-modal">
            <div className="unit-modal-header"><strong>Novo caso</strong><button className="icon-btn" onClick={() => setIsFormOpen(false)}><X size={18} /></button></div>
            <div className="unit-modal-content">
              <section className="unit-form-section">
                <div className="unit-form-grid">
                  <label><span className="form-label-text">Título</span><input value={form.titulo} onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))} placeholder="Ex.: Renovação de contrato" /></label>
                  <label>
                    <span className="form-label-text">Contato</span>
                    <select value={form.contatoId} onChange={(event) => setForm((current) => ({ ...current, contatoId: event.target.value }))}>
                      <option value="">Selecione um contato</option>
                      {contatos.map((contato) => <option key={contato.id} value={contato.id}>{contato.nome}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="form-label-text">Estágio inicial</span>
                    <select value={form.estagioId} onChange={(event) => setForm((current) => ({ ...current, estagioId: event.target.value }))}>
                      {estagios.map((estagio) => <option key={estagio.id} value={estagio.id}>{estagio.nome}</option>)}
                    </select>
                  </label>
                  <label><span className="form-label-text">Valor (R$)</span><input type="number" min="0" step="0.01" value={form.valor ?? ''} onChange={(event) => setForm((current) => ({ ...current, valor: event.target.value === '' ? null : Number(event.target.value) }))} placeholder="0,00" /></label>
                  <label>
                    <span className="form-label-text">Responsável</span>
                    <select value={form.responsavelId ?? ''} onChange={(event) => setForm((current) => ({ ...current, responsavelId: event.target.value || null }))}>
                      <option value="">Sem responsável definido</option>
                      {responsaveis.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>)}
                    </select>
                  </label>
                  <label><span className="form-label-text">Observação</span><input value={form.observacao} onChange={(event) => setForm((current) => ({ ...current, observacao: event.target.value }))} placeholder="Observação livre" /></label>
                </div>
              </section>
            </div>
            <div className="unit-modal-footer"><button onClick={() => setIsFormOpen(false)}>Cancelar</button><button className="primary" disabled={salvando} onClick={() => void saveCaso()}>{salvando ? 'Salvando...' : 'Salvar caso'}</button></div>
          </div>
        </div>
      )}
    </>
  );
}

export default CrmPipeline;
