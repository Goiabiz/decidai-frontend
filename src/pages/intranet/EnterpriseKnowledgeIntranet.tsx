import { Edit3, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/Badge';
import { normalizeFilterText } from '../../components/SmartFilters';
import { showAppConfirm } from '../../lib/appConfirm';
import { showAppToast } from '../../lib/appToast';
import { useSession } from '../../contexts/SessionContext';
import { KNOWLEDGE_LIFECYCLE_LABELS } from '../../services/baseConhecimento';
import {
  deleteIntranetKnowledgeEntry,
  listIntranetKnowledgeEntries,
  updateIntranetKnowledgeEntry,
  TIPO_BIBLIOTECA_LABELS,
  VISIBILIDADE_LABELS,
  type IntranetKnowledgeEntry,
  type IntranetKnowledgeEntryUpdate,
  type TipoBiblioteca,
  type Visibilidade,
} from '../../services/enterpriseKnowledgeIntranet';
import { listOntologiaDepartamentos, listOntologiaIndustrias, listOntologiaProcessos, type OntologiaRef } from '../../services/ontologiaNegocio';

const emptyUpdate: IntranetKnowledgeEntryUpdate = {
  title: '',
  content: '',
  tags: [],
  category: null,
  tipoBiblioteca: null,
  industriaId: null,
  departamentoId: null,
  processoId: null,
  dor: null,
  impacto: null,
  solucaoDecidai: null,
  roiEstimado: null,
  visibilidade: 'interno',
};

function refName(list: OntologiaRef[], id: string | null): string {
  if (!id) return '—';
  return list.find((item) => item.id === id)?.nome || '—';
}

function visibilidadeTone(value: Visibilidade): 'green' | 'blue' | 'gray' {
  if (value === 'interno') return 'green';
  if (value === 'cliente') return 'blue';
  return 'gray';
}

export function EnterpriseKnowledgeIntranet() {
  const { isSupport } = useSession();

  const [items, setItems] = useState<IntranetKnowledgeEntry[]>([]);
  const [departamentos, setDepartamentos] = useState<OntologiaRef[]>([]);
  const [processos, setProcessos] = useState<OntologiaRef[]>([]);
  const [industrias, setIndustrias] = useState<OntologiaRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [query, setQuery] = useState('');
  const [tipoBibliotecaFiltro, setTipoBibliotecaFiltro] = useState<TipoBiblioteca | ''>('');

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<IntranetKnowledgeEntryUpdate>(emptyUpdate);

  const carregar = async () => {
    setLoading(true);
    const [entriesResult, deps, procs, inds] = await Promise.all([
      listIntranetKnowledgeEntries(),
      listOntologiaDepartamentos(),
      listOntologiaProcessos(),
      listOntologiaIndustrias(),
    ]);
    if (entriesResult.error) showAppToast(entriesResult.error, 'error');
    setItems(entriesResult.items);
    setDepartamentos(deps);
    setProcessos(procs);
    setIndustrias(inds);
    setLoading(false);
  };

  useEffect(() => {
    if (!isSupport) { setLoading(false); return; }
    void carregar();
  }, [isSupport]);

  const filtered = useMemo(() => {
    const normalized = normalizeFilterText(query);
    return items.filter((item) => {
      const text = normalizeFilterText([item.title, item.content, item.category || '', item.dor || '', item.impacto || ''].join(' '));
      return (!normalized || text.includes(normalized)) && (!tipoBibliotecaFiltro || item.tipoBiblioteca === tipoBibliotecaFiltro);
    });
  }, [items, query, tipoBibliotecaFiltro]);

  const update = <K extends keyof IntranetKnowledgeEntryUpdate>(key: K, value: IntranetKnowledgeEntryUpdate[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const edit = (item: IntranetKnowledgeEntry) => {
    setForm({
      title: item.title,
      content: item.content,
      tags: item.tags,
      category: item.category,
      tipoBiblioteca: item.tipoBiblioteca,
      industriaId: item.industriaId,
      departamentoId: item.departamentoId,
      processoId: item.processoId,
      dor: item.dor,
      impacto: item.impacto,
      solucaoDecidai: item.solucaoDecidai,
      roiEstimado: item.roiEstimado,
      visibilidade: item.visibilidade,
    });
    setEditingId(item.id);
    setOpen(true);
  };

  const remove = (item: IntranetKnowledgeEntry) => {
    void showAppConfirm({
      title: 'Excluir entrada da Intranet',
      description: `Excluir "${item.title}"? Esta é uma exclusão real, sem desfazer.`,
      confirmLabel: 'Excluir entrada',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await deleteIntranetKnowledgeEntry(item.id);
          await carregar();
          showAppToast('Entrada excluída.', 'info');
        } catch (error) {
          showAppToast(error instanceof Error ? error.message : 'Não foi possível excluir a entrada.', 'error');
        }
      },
    });
  };

  const save = async () => {
    if (!editingId) return;
    if (!form.title.trim()) {
      showAppToast('Informe o título.', 'warning');
      return;
    }
    setSalvando(true);
    try {
      await updateIntranetKnowledgeEntry(editingId, form);
      showAppToast('Entrada atualizada.', 'success');
      await carregar();
      setOpen(false);
      setEditingId(null);
      setForm(emptyUpdate);
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível salvar a entrada.', 'error');
    } finally {
      setSalvando(false);
    }
  };

  if (!isSupport) {
    return (
      <>
        <PageHeader title="Central de Conhecimento Interna" />
        <section className="card audit-clean-card">
          <p className="muted">
            A Enterprise Knowledge Intranet é visível apenas para a equipe da operadora (suporte/administração).
            Ela reúne o conhecimento interno usado por Produto, DEV, Suporte, Comercial e Marketing — nada aqui é
            visível a clientes.
          </p>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Central de Conhecimento Interna" />

      <section className="card fields-api-card">
        <div className="section-title-row">
          <div>
            <h3>Conhecimento interno da operadora</h3>
            <p className="section-description">
              Markets/Industry/Process/Pain Library e Playbooks — conteúdo publicado pelo agente e organizado aqui.
              Criação continua exclusiva do agente (mesma regra da Base de Conhecimento do cliente); esta tela
              qualifica, filtra e edita o que já existe.
            </p>
          </div>
          <span className="small-muted">{loading ? '...' : `${filtered.length} de ${items.length} registros`}</span>
        </div>

        <div className="field-filter-grid">
          <div className="smart-search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar título, conteúdo, categoria, dor ou impacto..." />
          </div>
          <select value={tipoBibliotecaFiltro} onChange={(event) => setTipoBibliotecaFiltro(event.target.value as TipoBiblioteca | '')}>
            <option value="">Todas as bibliotecas</option>
            {(Object.keys(TIPO_BIBLIOTECA_LABELS) as TipoBiblioteca[]).map((key) => (
              <option key={key} value={key}>{TIPO_BIBLIOTECA_LABELS[key]}</option>
            ))}
          </select>
        </div>

        <div className="simple-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Biblioteca</th>
                <th>Indústria / Departamento</th>
                <th>Visibilidade</th>
                <th>Estado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.title}</strong><br /><small className="table-subtitle">{item.content.slice(0, 90)}{item.content.length > 90 ? '…' : ''}</small></td>
                  <td>{item.tipoBiblioteca ? <Badge tone="blue">{TIPO_BIBLIOTECA_LABELS[item.tipoBiblioteca]}</Badge> : <span className="small-muted">—</span>}</td>
                  <td><span className="table-subtitle">{refName(industrias, item.industriaId)} / {refName(departamentos, item.departamentoId)}</span></td>
                  <td><Badge tone={visibilidadeTone(item.visibilidade)}>{VISIBILIDADE_LABELS[item.visibilidade]}</Badge></td>
                  <td><Badge tone="gray">{KNOWLEDGE_LIFECYCLE_LABELS[item.lifecycleState]}</Badge></td>
                  <td>
                    <div className="row-action-group">
                      <button title="Editar" onClick={() => edit(item)}><Edit3 size={16} /></button>
                      <button title="Excluir" onClick={() => remove(item)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="empty-note">Nenhuma entrada interna ainda — publicações do agente com visibilidade "interno" ou "ambos" aparecem aqui.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {open && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="agent-modal">
            <div className="cadastro-modal-header">
              <strong>Editar entrada da Intranet</strong>
              <button className="icon-btn" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>

            <div className="cadastro-modal-content">
              <section className="cadastro-form-section">
                <h3>Conteúdo</h3>
                <div className="cadastro-form-grid">
                  <label className="span-2"><span>Título *</span><input value={form.title} onChange={(event) => update('title', event.target.value)} /></label>
                  <label className="span-2"><span>Conteúdo</span><textarea rows={4} value={form.content} onChange={(event) => update('content', event.target.value)} /></label>
                  <label><span>Categoria</span><input value={form.category || ''} onChange={(event) => update('category', event.target.value || null)} /></label>
                  <label><span>Biblioteca</span><select value={form.tipoBiblioteca || ''} onChange={(event) => update('tipoBiblioteca', (event.target.value || null) as TipoBiblioteca | null)}>
                    <option value="">Sem biblioteca</option>
                    {(Object.keys(TIPO_BIBLIOTECA_LABELS) as TipoBiblioteca[]).map((key) => <option key={key} value={key}>{TIPO_BIBLIOTECA_LABELS[key]}</option>)}
                  </select></label>
                </div>
              </section>

              <section className="cadastro-form-section">
                <h3>Classificação (Ontologia — Onda E)</h3>
                <div className="cadastro-form-grid">
                  <label><span>Indústria</span><select value={form.industriaId || ''} onChange={(event) => update('industriaId', event.target.value || null)}>
                    <option value="">Não classificado</option>
                    {industrias.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                  </select></label>
                  <label><span>Departamento</span><select value={form.departamentoId || ''} onChange={(event) => update('departamentoId', event.target.value || null)}>
                    <option value="">Não classificado</option>
                    {departamentos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                  </select></label>
                  <label><span>Processo</span><select value={form.processoId || ''} onChange={(event) => update('processoId', event.target.value || null)}>
                    <option value="">Não classificado</option>
                    {processos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                  </select></label>
                </div>
              </section>

              {form.tipoBiblioteca === 'pain' && (
                <section className="cadastro-form-section">
                  <h3>Pain Library</h3>
                  <p className="section-description">Estrutura Indústria → Departamento → Processo → Dor → Impacto → Solução → ROI (seção 79 da emenda).</p>
                  <div className="cadastro-form-grid">
                    <label className="span-2"><span>Dor</span><textarea rows={2} value={form.dor || ''} onChange={(event) => update('dor', event.target.value || null)} /></label>
                    <label className="span-2"><span>Impacto</span><textarea rows={2} value={form.impacto || ''} onChange={(event) => update('impacto', event.target.value || null)} /></label>
                    <label className="span-2"><span>Solução DecidAI</span><textarea rows={2} value={form.solucaoDecidai || ''} onChange={(event) => update('solucaoDecidai', event.target.value || null)} /></label>
                    <label><span>ROI estimado</span><input value={form.roiEstimado || ''} onChange={(event) => update('roiEstimado', event.target.value || null)} placeholder="Ex.: 10h/mês" /></label>
                  </div>
                </section>
              )}

              <section className="cadastro-form-section">
                <h3>Visibilidade</h3>
                <div className="cadastro-form-grid">
                  <label><span>Quem pode ver</span><select value={form.visibilidade} onChange={(event) => update('visibilidade', event.target.value as Visibilidade)}>
                    {(Object.keys(VISIBILIDADE_LABELS) as Visibilidade[]).map((key) => <option key={key} value={key}>{VISIBILIDADE_LABELS[key]}</option>)}
                  </select></label>
                </div>
              </section>
            </div>

            <div className="cadastro-modal-footer">
              <button onClick={() => setOpen(false)}>Cancelar</button>
              <button className="primary" disabled={salvando} onClick={() => void save()}>{salvando ? 'Salvando...' : 'Salvar entrada'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EnterpriseKnowledgeIntranet;
