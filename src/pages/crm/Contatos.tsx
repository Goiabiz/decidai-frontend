import { useEffect, useMemo, useState } from 'react';
import { Building2, Headphones, Plus, Search, Target, User, X } from 'lucide-react';
import { Badge } from '../../components/Badge';
import { PageHeader } from '../../components/PageHeader';
import { normalizeFilterText } from '../../components/SmartFilters';
import { showAppToast } from '../../lib/appToast';
import { useSession, usePermission } from '../../contexts/SessionContext';
import { listUsuariosCliente } from '../../services/auth';
import {
  createContato,
  createEmpresa,
  getContato360,
  listContatos,
  listEmpresas,
  updateContato,
  type CrmContato,
  type CrmContato360,
  type CrmContatoInput,
  type CrmEmpresa,
  type CrmEmpresaInput,
} from '../../services/crm';

const CANAIS = ['E-mail', 'WhatsApp', 'Widget', 'API', 'Manual', 'Portal'];

const emptyContatoForm: CrmContatoInput = { nome: '', email: '', telefone: '', canalOrigem: '', observacao: '', empresaId: null };
const emptyEmpresaForm: CrmEmpresaInput = { nome: '', documento: '', observacao: '' };

function statusTone(status: string) {
  if (status === 'ganho') return 'green';
  if (status === 'perdido') return 'red';
  return 'blue';
}

export function CrmContatos() {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;
  const podeVer = usePermission('crm.acessar.visualizar');
  const podeEditar = usePermission('crm.acessar.editar');

  const [tab, setTab] = useState<'contatos' | 'empresas'>('contatos');
  const [contatos, setContatos] = useState<CrmContato[]>([]);
  const [empresas, setEmpresas] = useState<CrmEmpresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<CrmContato360 | null>(null);
  const [detalheLoading, setDetalheLoading] = useState(false);

  const [isContatoFormOpen, setIsContatoFormOpen] = useState(false);
  const [contatoForm, setContatoForm] = useState<CrmContatoInput>(emptyContatoForm);
  const [salvandoContato, setSalvandoContato] = useState(false);

  const [isEmpresaFormOpen, setIsEmpresaFormOpen] = useState(false);
  const [empresaForm, setEmpresaForm] = useState<CrmEmpresaInput>(emptyEmpresaForm);
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);

  const carregarListas = () => {
    if (!clienteId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([listContatos(clienteId), listEmpresas(clienteId)])
      .then(([contatosResult, empresasResult]) => {
        setContatos(contatosResult);
        setEmpresas(empresasResult);
        setSelectedId((current) => current ?? contatosResult[0]?.id ?? null);
      })
      .catch((error) => showAppToast(error instanceof Error ? error.message : 'Não foi possível carregar o CRM.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(carregarListas, [clienteId]);

  useEffect(() => {
    if (!selectedId) { setDetalhe(null); return; }
    setDetalheLoading(true);
    getContato360(selectedId)
      .then(setDetalhe)
      .catch((error) => showAppToast(error instanceof Error ? error.message : 'Não foi possível carregar o perfil do contato.', 'error'))
      .finally(() => setDetalheLoading(false));
  }, [selectedId]);

  const filtered = useMemo(() => {
    const query = normalizeFilterText(search);
    if (!query) return contatos;
    return contatos.filter((contato) => normalizeFilterText([contato.nome, contato.email, contato.telefone, contato.empresaNome].join(' ')).includes(query));
  }, [contatos, search]);

  const openContatoForm = () => { setContatoForm(emptyContatoForm); setIsContatoFormOpen(true); };

  const saveContato = async () => {
    if (!contatoForm.nome.trim()) { showAppToast('Informe o nome do contato.', 'warning'); return; }
    if (!clienteId) return;
    setSalvandoContato(true);
    try {
      const novo = await createContato(clienteId, contatoForm);
      setContatos((current) => [novo, ...current]);
      setSelectedId(novo.id);
      setIsContatoFormOpen(false);
      showAppToast('Contato criado.', 'success');
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível salvar o contato.', 'error');
    } finally {
      setSalvandoContato(false);
    }
  };

  const saveEmpresa = async () => {
    if (!empresaForm.nome.trim()) { showAppToast('Informe o nome da empresa.', 'warning'); return; }
    if (!clienteId) return;
    setSalvandoEmpresa(true);
    try {
      const nova = await createEmpresa(clienteId, empresaForm);
      setEmpresas((current) => [nova, ...current].sort((a, b) => a.nome.localeCompare(b.nome)));
      setEmpresaForm(emptyEmpresaForm);
      setIsEmpresaFormOpen(false);
      showAppToast('Empresa criada.', 'success');
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível salvar a empresa.', 'error');
    } finally {
      setSalvandoEmpresa(false);
    }
  };

  if (!podeVer) {
    return (
      <>
        <PageHeader title="CRM" />
        <section className="card audit-clean-card">
          <p className="muted">Contatos, empresas e pipeline são visíveis apenas para quem tem acesso ao CRM. Fale com quem administra sua conta se precisar dessa informação.</p>
        </section>
      </>
    );
  }

  if (!clienteId) {
    return (
      <>
        <PageHeader title="CRM" />
        <section className="card audit-clean-card"><p className="muted">Acesse o contexto de um cliente para ver os contatos dele.</p></section>
      </>
    );
  }

  const selected = contatos.find((item) => item.id === selectedId) ?? null;

  return (
    <>
      <PageHeader
        title="CRM"
        subtitle="Contatos, empresas e o histórico de relacionamento (casos + atendimentos) de cada um."
        action={podeEditar ? (
          <div className="header-actions">
            {tab === 'empresas'
              ? <button className="primary-small" onClick={() => setIsEmpresaFormOpen(true)}><Plus size={16} /> Nova empresa</button>
              : <button className="primary-small" onClick={openContatoForm}><Plus size={16} /> Novo contato</button>}
          </div>
        ) : undefined}
      />

      <div className="detail-tabs" style={{ marginBottom: 16 }}>
        <button className={tab === 'contatos' ? 'active' : ''} onClick={() => setTab('contatos')}>Contatos</button>
        <button className={tab === 'empresas' ? 'active' : ''} onClick={() => setTab('empresas')}>Empresas</button>
      </div>

      {tab === 'contatos' ? (
        <section className="card unit-functional-card">
          <div className="section-title-row"><h3>Contatos</h3><span className="small-muted">{loading ? '...' : `${filtered.length} de ${contatos.length} registros`}</span></div>
          <div className="smart-filter-bar units-filter-bar">
            <div className="smart-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, e-mail, telefone ou empresa..." /></div>
          </div>

          <div className="units-layout-grid">
            <div className="units-table-wrap">
              <table>
                <thead><tr><th>Nome</th><th>Empresa</th><th>Canal de origem</th><th>Contato</th></tr></thead>
                <tbody>
                  {filtered.map((contato) => (
                    <tr key={contato.id} className="clickable-row" onClick={() => setSelectedId(contato.id)}>
                      <td><strong>{contato.nome}</strong></td>
                      <td>{contato.empresaNome || '-'}</td>
                      <td>{contato.canalOrigem ? <Badge tone="blue">{contato.canalOrigem}</Badge> : '-'}</td>
                      <td>{contato.email || '-'}<div className="table-subtitle">{contato.telefone || '-'}</div></td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && <tr><td colSpan={4} className="empty-note">Nenhum contato cadastrado ainda.</td></tr>}
                </tbody>
              </table>
            </div>

            <aside className="unit-detail-inline">
              <div className="section-title-row"><h3>Perfil 360</h3></div>
              {selected ? (
                <>
                  <div className="unit-profile-box"><div className="unit-icon-large"><User size={28} /></div><div><strong>{selected.nome}</strong><span>{selected.empresaNome || 'Sem empresa vinculada'}</span></div></div>
                  <div className="detail-grid compact unit-detail-grid">
                    <span>E-mail</span><strong>{selected.email || '-'}</strong>
                    <span>Telefone</span><strong>{selected.telefone || '-'}</strong>
                    <span>Canal de origem</span><strong>{selected.canalOrigem || '-'}</strong>
                    <span>Observação</span><strong>{selected.observacao || '-'}</strong>
                  </div>

                  <div className="unit-sector-list">
                    <h4><Target size={14} style={{ verticalAlign: 'text-bottom' }} /> Casos no pipeline ({detalheLoading ? '...' : detalhe?.casos.length ?? 0})</h4>
                    {detalhe?.casos.length ? detalhe.casos.map((caso) => (
                      <div className="mini-row" key={caso.id}><span>{caso.titulo}</span><Badge tone={statusTone(caso.status)}>{caso.status}</Badge></div>
                    )) : <p className="empty-note">Nenhum caso vinculado a este contato ainda.</p>}
                  </div>

                  <div className="unit-sector-list">
                    <h4><Headphones size={14} style={{ verticalAlign: 'text-bottom' }} /> Atendimentos ({detalheLoading ? '...' : detalhe?.atendimentos.length ?? 0})</h4>
                    {detalhe?.atendimentos.length ? detalhe.atendimentos.map((atendimento) => (
                      <div className="mini-row" key={atendimento.id}><span>nº {atendimento.numeroSequencial} · {atendimento.assunto}</span><Badge tone="gray">{atendimento.status}</Badge></div>
                    )) : <p className="empty-note">Nenhum atendimento vinculado a este contato ainda.</p>}
                  </div>
                </>
              ) : <p className="empty-note">{loading ? 'Carregando...' : 'Selecione um contato para ver o perfil.'}</p>}
            </aside>
          </div>
        </section>
      ) : (
        <section className="card unit-functional-card">
          <div className="section-title-row"><h3>Empresas</h3><span className="small-muted">{loading ? '...' : `${empresas.length} registros`}</span></div>
          <div className="units-table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>Documento</th><th>Observação</th></tr></thead>
              <tbody>
                {empresas.map((empresa) => (
                  <tr key={empresa.id}>
                    <td><strong><Building2 size={14} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />{empresa.nome}</strong></td>
                    <td>{empresa.documento || '-'}</td>
                    <td>{empresa.observacao || '-'}</td>
                  </tr>
                ))}
                {!loading && empresas.length === 0 && <tr><td colSpan={3} className="empty-note">Nenhuma empresa cadastrada ainda.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {isContatoFormOpen && (
        <div className="modal-backdrop unit-modal-backdrop">
          <div className="unit-form-modal">
            <div className="unit-modal-header"><strong>Novo contato</strong><button className="icon-btn" onClick={() => setIsContatoFormOpen(false)}><X size={18} /></button></div>
            <div className="unit-modal-content">
              <section className="unit-form-section">
                <div className="unit-form-grid">
                  <label><span className="form-label-text">Nome</span><input value={contatoForm.nome} onChange={(event) => setContatoForm((current) => ({ ...current, nome: event.target.value }))} placeholder="Nome do contato" /></label>
                  <label><span className="form-label-text">E-mail</span><input value={contatoForm.email} onChange={(event) => setContatoForm((current) => ({ ...current, email: event.target.value }))} placeholder="contato@dominio.com" /></label>
                  <label><span className="form-label-text">Telefone</span><input value={contatoForm.telefone} onChange={(event) => setContatoForm((current) => ({ ...current, telefone: event.target.value }))} placeholder="+55 (00) 00000-0000" /></label>
                  <label>
                    <span className="form-label-text">Canal de origem</span>
                    <select value={contatoForm.canalOrigem} onChange={(event) => setContatoForm((current) => ({ ...current, canalOrigem: event.target.value }))}>
                      <option value="">Não informado</option>
                      {CANAIS.map((canal) => <option key={canal} value={canal}>{canal}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="form-label-text">Empresa</span>
                    <select value={contatoForm.empresaId ?? ''} onChange={(event) => setContatoForm((current) => ({ ...current, empresaId: event.target.value || null }))}>
                      <option value="">Sem empresa vinculada</option>
                      {empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>)}
                    </select>
                  </label>
                  <label><span className="form-label-text">Observação</span><input value={contatoForm.observacao} onChange={(event) => setContatoForm((current) => ({ ...current, observacao: event.target.value }))} placeholder="Observação livre" /></label>
                </div>
              </section>
            </div>
            <div className="unit-modal-footer"><button onClick={() => setIsContatoFormOpen(false)}>Cancelar</button><button className="primary" disabled={salvandoContato} onClick={() => void saveContato()}>{salvandoContato ? 'Salvando...' : 'Salvar contato'}</button></div>
          </div>
        </div>
      )}

      {isEmpresaFormOpen && (
        <div className="modal-backdrop small-action-modal-backdrop">
          <div className="small-action-modal">
            <div className="unit-modal-header"><strong>Nova empresa</strong><button className="icon-btn" onClick={() => setIsEmpresaFormOpen(false)}><X size={18} /></button></div>
            <div className="small-action-modal-body">
              <label><span className="form-label-text">Nome</span><input value={empresaForm.nome} onChange={(event) => setEmpresaForm((current) => ({ ...current, nome: event.target.value }))} placeholder="Razão social ou nome fantasia" /></label>
              <label><span className="form-label-text">Documento</span><input value={empresaForm.documento} onChange={(event) => setEmpresaForm((current) => ({ ...current, documento: event.target.value }))} placeholder="CNPJ" /></label>
              <label><span className="form-label-text">Observação</span><input value={empresaForm.observacao} onChange={(event) => setEmpresaForm((current) => ({ ...current, observacao: event.target.value }))} placeholder="Observação livre" /></label>
            </div>
            <div className="unit-modal-footer"><button onClick={() => setIsEmpresaFormOpen(false)}>Cancelar</button><button className="primary" disabled={salvandoEmpresa} onClick={() => void saveEmpresa()}>{salvandoEmpresa ? 'Salvando...' : 'Salvar empresa'}</button></div>
          </div>
        </div>
      )}
    </>
  );
}

export default CrmContatos;
