import { useEffect, useMemo, useState } from 'react';
import { Plus, X, Settings, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { KanbanBoard, type KanbanItem } from '../../components/KanbanBoard';
import { showAppToast } from '../../lib/appToast';
import { useSession, usePermission } from '../../contexts/SessionContext';
import { listUsuariosCliente, type UsuarioCliente } from '../../services/auth';
import {
  createAtividade,
  createCaso,
  ensureEstagiosPadrao,
  listAtividades,
  listCasos,
  listContatos,
  moveCasoEstagio,
  updateCasoFollowup,
  updateEstagioProbabilidade,
  type CrmAtividade,
  type CrmAtividadeTipo,
  type CrmCaso,
  type CrmCasoInput,
  type CrmContato,
  type CrmEstagio,
} from '../../services/crm';

type CasoKanbanItem = KanbanItem & { caso: CrmCaso };

const TONE_BY_INDEX = ['blue', 'purple', 'orange', 'green', 'red'];

const ATIVIDADE_TIPOS: Array<{ value: CrmAtividadeTipo; label: string }> = [
  { value: 'ligacao', label: 'Ligação' },
  { value: 'email', label: 'E-mail' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'nota', label: 'Nota' },
];

function formatBrl(value: number | null) {
  if (value === null) return null;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDataHora(value: string) {
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function toDateInputValue(value: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

function isAtrasado(caso: CrmCaso) {
  if (!caso.proximoFollowupEm || caso.status !== 'aberto') return false;
  return new Date(caso.proximoFollowupEm).getTime() < Date.now();
}

const emptyForm: CrmCasoInput = { titulo: '', contatoId: '', estagioId: '', valor: null, responsavelId: null, observacao: '' };

export function CrmPipeline() {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;
  const usuarioClienteId = session?.user.kind === 'cliente' ? session.user.registroId : null;
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

  const [detalheCaso, setDetalheCaso] = useState<CrmCaso | null>(null);
  const [atividades, setAtividades] = useState<CrmAtividade[]>([]);
  const [loadingAtividades, setLoadingAtividades] = useState(false);
  const [followupInput, setFollowupInput] = useState('');
  const [savingFollowup, setSavingFollowup] = useState(false);
  const [novaAtividadeTipo, setNovaAtividadeTipo] = useState<CrmAtividadeTipo>('nota');
  const [novaAtividadeDescricao, setNovaAtividadeDescricao] = useState('');
  const [savingAtividade, setSavingAtividade] = useState(false);

  const [configOpen, setConfigOpen] = useState(false);
  const [probInputs, setProbInputs] = useState<Record<string, string>>({});
  const [savingConfig, setSavingConfig] = useState(false);

  const carregarTudo = () => {
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
  };

  useEffect(carregarTudo, [clienteId]);

  const items = useMemo<CasoKanbanItem[]>(() => casos.map((caso) => ({ id: caso.id, columnId: caso.estagioId, caso })), [casos]);
  const columns = useMemo(() => estagios.map((estagio, index) => ({ id: estagio.id, label: estagio.nome, tone: TONE_BY_INDEX[index % TONE_BY_INDEX.length] })), [estagios]);

  const forecastTotal = useMemo(() => {
    return casos
      .filter((caso) => caso.status === 'aberto')
      .reduce((total, caso) => {
        const estagio = estagios.find((item) => item.id === caso.estagioId);
        const peso = estagio?.probabilidade ?? null;
        if (peso === null || caso.valor === null) return total;
        return total + (caso.valor * peso) / 100;
      }, 0);
  }, [casos, estagios]);

  const casosEmAberto = useMemo(() => casos.filter((caso) => caso.status === 'aberto').length, [casos]);
  const atrasados = useMemo(() => casos.filter(isAtrasado).length, [casos]);

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

  const abrirDetalhe = (caso: CrmCaso) => {
    setDetalheCaso(caso);
    setFollowupInput(toDateInputValue(caso.proximoFollowupEm));
    setNovaAtividadeTipo('nota');
    setNovaAtividadeDescricao('');
    setLoadingAtividades(true);
    listAtividades(caso.id)
      .then(setAtividades)
      .catch((error) => showAppToast(error instanceof Error ? error.message : 'Não foi possível carregar as atividades.', 'error'))
      .finally(() => setLoadingAtividades(false));
  };

  const salvarFollowup = async () => {
    if (!detalheCaso) return;
    setSavingFollowup(true);
    try {
      const iso = followupInput ? new Date(`${followupInput}T09:00:00`).toISOString() : null;
      await updateCasoFollowup(detalheCaso.id, iso);
      setCasos((current) => current.map((caso) => caso.id === detalheCaso.id ? { ...caso, proximoFollowupEm: iso } : caso));
      setDetalheCaso((current) => current ? { ...current, proximoFollowupEm: iso } : current);
      showAppToast('Follow-up atualizado.', 'success');
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível salvar o follow-up.', 'error');
    } finally {
      setSavingFollowup(false);
    }
  };

  const registrarAtividade = async () => {
    if (!detalheCaso || !clienteId) return;
    if (!novaAtividadeDescricao.trim()) { showAppToast('Descreva a atividade.', 'warning'); return; }
    setSavingAtividade(true);
    try {
      const nova = await createAtividade(clienteId, usuarioClienteId, { casoId: detalheCaso.id, tipo: novaAtividadeTipo, descricao: novaAtividadeDescricao.trim() });
      setAtividades((current) => [nova, ...current]);
      setNovaAtividadeDescricao('');
      showAppToast('Atividade registrada.', 'success');
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível registrar a atividade.', 'error');
    } finally {
      setSavingAtividade(false);
    }
  };

  const abrirConfig = () => {
    const initial: Record<string, string> = {};
    estagios.forEach((estagio) => { initial[estagio.id] = estagio.probabilidade === null ? '' : String(estagio.probabilidade); });
    setProbInputs(initial);
    setConfigOpen(true);
  };

  const salvarConfig = async () => {
    setSavingConfig(true);
    try {
      const alterados = estagios.filter((estagio) => {
        const atual = estagio.probabilidade === null ? '' : String(estagio.probabilidade);
        return probInputs[estagio.id] !== atual;
      });
      await Promise.all(alterados.map((estagio) => {
        const raw = probInputs[estagio.id];
        const valor = raw === '' ? null : Math.max(0, Math.min(100, Number(raw)));
        return updateEstagioProbabilidade(estagio.id, valor);
      }));
      const atualizados = await ensureEstagiosPadrao(clienteId as string);
      setEstagios(atualizados);
      setConfigOpen(false);
      showAppToast('Configuração do pipeline salva.', 'success');
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível salvar a configuração.', 'error');
    } finally {
      setSavingConfig(false);
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
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            {podeEditar && <button className="secondary-btn" onClick={abrirConfig}><Settings size={16} /> Configurar pipeline</button>}
            {podeEditar && <button className="primary-small" onClick={openForm}><Plus size={16} /> Novo caso</button>}
          </div>
        }
      />

      {!loading && columns.length > 0 && (
        <section className="card audit-clean-card" style={{ marginBottom: 16, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div className="table-subtitle">Forecast ponderado (casos em aberto)</div>
            <strong style={{ fontSize: 20 }}>{formatBrl(forecastTotal) ?? 'R$ 0,00'}</strong>
          </div>
          <div>
            <div className="table-subtitle">Casos em aberto</div>
            <strong style={{ fontSize: 20 }}>{casosEmAberto}</strong>
          </div>
          <div>
            <div className="table-subtitle">Follow-up atrasado</div>
            <strong style={{ fontSize: 20, color: atrasados > 0 ? 'var(--red-500)' : undefined }}>{atrasados}</strong>
          </div>
        </section>
      )}

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
            const atrasado = isAtrasado(item.caso);
            return (
              <div onClick={() => abrirDetalhe(item.caso)} style={{ cursor: 'pointer' }}>
                <strong>{item.caso.titulo}</strong>
                <div className="table-subtitle">{item.caso.contatoNome}{item.caso.empresaNome ? ` · ${item.caso.empresaNome}` : ''}</div>
                {valorFormatado && <div className="table-subtitle">{valorFormatado}</div>}
                {item.caso.responsavelNome && <div className="table-subtitle">Responsável: {item.caso.responsavelNome}</div>}
                {atrasado && (
                  <div className="table-subtitle" style={{ color: 'var(--red-500)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <AlertTriangle size={12} /> Follow-up atrasado
                  </div>
                )}
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

      {detalheCaso && (
        <div className="modal-backdrop unit-modal-backdrop">
          <div className="unit-form-modal">
            <div className="unit-modal-header"><strong>{detalheCaso.titulo}</strong><button className="icon-btn" onClick={() => setDetalheCaso(null)}><X size={18} /></button></div>
            <div className="unit-modal-content">
              <section className="unit-form-section">
                <p className="table-subtitle">{detalheCaso.contatoNome}{detalheCaso.empresaNome ? ` · ${detalheCaso.empresaNome}` : ''}{formatBrl(detalheCaso.valor) ? ` · ${formatBrl(detalheCaso.valor)}` : ''}</p>
                <div className="unit-form-grid">
                  <label>
                    <span className="form-label-text">Próximo follow-up</span>
                    <input type="date" value={followupInput} onChange={(event) => setFollowupInput(event.target.value)} />
                  </label>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button className="secondary-btn" disabled={savingFollowup} onClick={() => void salvarFollowup()}>{savingFollowup ? 'Salvando...' : 'Salvar follow-up'}</button>
                  </div>
                </div>
              </section>

              <section className="unit-form-section" style={{ marginTop: 16 }}>
                <strong style={{ fontSize: 13 }}>Registrar atividade</strong>
                <div className="unit-form-grid" style={{ marginTop: 8 }}>
                  <label>
                    <span className="form-label-text">Tipo</span>
                    <select value={novaAtividadeTipo} onChange={(event) => setNovaAtividadeTipo(event.target.value as CrmAtividadeTipo)}>
                      {ATIVIDADE_TIPOS.map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}
                    </select>
                  </label>
                  <label><span className="form-label-text">Descrição</span><input value={novaAtividadeDescricao} onChange={(event) => setNovaAtividadeDescricao(event.target.value)} placeholder="O que aconteceu ou foi combinado" /></label>
                </div>
                <div style={{ marginTop: 8 }}>
                  <button className="secondary-btn" disabled={savingAtividade} onClick={() => void registrarAtividade()}>{savingAtividade ? 'Registrando...' : 'Registrar atividade'}</button>
                </div>
              </section>

              <section className="unit-form-section" style={{ marginTop: 16 }}>
                <strong style={{ fontSize: 13 }}>Histórico</strong>
                {loadingAtividades ? (
                  <p className="muted">Carregando...</p>
                ) : atividades.length === 0 ? (
                  <p className="muted">Nenhuma atividade registrada ainda.</p>
                ) : (
                  <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                    {atividades.map((atividade) => (
                      <div key={atividade.id} className="card audit-clean-card" style={{ padding: '8px 12px' }}>
                        <div className="table-subtitle">{ATIVIDADE_TIPOS.find((tipo) => tipo.value === atividade.tipo)?.label ?? atividade.tipo} · {formatDataHora(atividade.realizadaEm)}{atividade.responsavelNome ? ` · ${atividade.responsavelNome}` : ''}</div>
                        <div>{atividade.descricao}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
            <div className="unit-modal-footer"><button onClick={() => setDetalheCaso(null)}>Fechar</button></div>
          </div>
        </div>
      )}

      {configOpen && (
        <div className="modal-backdrop unit-modal-backdrop">
          <div className="unit-form-modal">
            <div className="unit-modal-header"><strong>Configurar pipeline</strong><button className="icon-btn" onClick={() => setConfigOpen(false)}><X size={18} /></button></div>
            <div className="unit-modal-content">
              <p className="table-subtitle">Probabilidade (%) de cada estágio, usada no cálculo do forecast ponderado. Deixe em branco para excluir o estágio do forecast.</p>
              <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                {estagios.map((estagio) => (
                  <label key={estagio.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px', alignItems: 'center', gap: 12 }}>
                    <span className="form-label-text">{estagio.nome}</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={probInputs[estagio.id] ?? ''}
                      onChange={(event) => setProbInputs((current) => ({ ...current, [estagio.id]: event.target.value }))}
                      placeholder="0-100"
                    />
                  </label>
                ))}
              </div>
            </div>
            <div className="unit-modal-footer"><button onClick={() => setConfigOpen(false)}>Cancelar</button><button className="primary" disabled={savingConfig} onClick={() => void salvarConfig()}>{savingConfig ? 'Salvando...' : 'Salvar'}</button></div>
          </div>
        </div>
      )}
    </>
  );
}

export default CrmPipeline;
