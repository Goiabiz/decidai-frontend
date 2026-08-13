import { useEffect, useMemo, useState } from 'react';
import { Bot, Edit3, FileText, Info, Search, Trash2, X } from 'lucide-react';
import { Badge } from '../components/Badge';
import { PageHeader } from '../components/PageHeader';
import { normalizeFilterText } from '../components/SmartFilters';
import { confirmApp } from '../lib/appConfirm';
import { showAppToast } from '../lib/appToast';
import { useSession } from '../contexts/SessionContext';
import { logAudit } from '../services/auditLog';
import { deleteKnowledgeEntry, listKnowledgeEntries, updateKnowledgeEntry, type KnowledgeEntryRecord, type KnowledgeSourceType } from '../services/baseConhecimento';

const categorias = ['Comercial', 'Integração', 'Operacional', 'Produto', 'Regra de negócio', 'Regulatório', 'Suporte'];

const sourceLabel: Record<KnowledgeSourceType, string> = {
  agente_extraido: 'Extraído pelo agente',
  manual: 'Cadastro manual',
  documento: 'Documento',
};

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

type EditForm = { title: string; content: string; tags: string; category: string };

export function BaseConhecimento() {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;
  const [items, setItems] = useState<KnowledgeEntryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState<KnowledgeEntryRecord | null>(null);
  const [form, setForm] = useState<EditForm>({ title: '', content: '', tags: '', category: '' });

  const carregar = async () => {
    setLoading(true);
    const result = await listKnowledgeEntries(undefined, clienteId);
    setItems(result.items);
    setLoadError(result.error || '');
    setLoading(false);
  };

  useEffect(() => { void carregar(); }, [clienteId]);

  const filtered = useMemo(() => {
    const query = normalizeFilterText(search);
    const categoryFilter = normalizeFilterText(category);
    return items.filter((item) => {
      const text = normalizeFilterText([item.title, item.content, item.category || '', item.tags.join(' ')].join(' '));
      return (!query || text.includes(query)) && (!categoryFilter || normalizeFilterText(item.category || '') === categoryFilter);
    });
  }, [items, search, category]);

  const openEdit = (item: KnowledgeEntryRecord) => {
    setEditing(item);
    setForm({ title: item.title, content: item.content, tags: item.tags.join(', '), category: item.category || '' });
  };

  const save = async () => {
    if (!editing) return;
    if (!form.title.trim() || !form.content.trim()) {
      showAppToast('Preencha título e conteúdo.', 'warning');
      return;
    }

    setSalvando(true);
    try {
      await updateKnowledgeEntry(editing.id, {
        title: form.title.trim(),
        content: form.content.trim(),
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        category: form.category || null,
      }, clienteId);
      await carregar();
      setEditing(null);
      showAppToast('Conhecimento atualizado. A busca do agente pode ficar menos precisa até o texto ser reprocessado.', 'success');
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível salvar.', 'error');
    } finally {
      setSalvando(false);
    }
  };

  const remove = async (item: KnowledgeEntryRecord) => {
    const confirmed = await confirmApp({
      title: 'Excluir conhecimento',
      description: `Excluir "${item.title}"? Esta ação apaga o registro de verdade — o agente deixa de encontrar essa solução em buscas futuras.`,
      confirmLabel: 'Excluir conhecimento',
      tone: 'danger',
    });
    if (!confirmed) return;

    try {
      await deleteKnowledgeEntry(item.id, clienteId);
      await carregar();
      showAppToast('Conhecimento excluído.', 'info');

      void logAudit({
        usuarioNome: session?.user.displayName || 'Desconhecido',
        usuarioEmail: session?.user.email || '',
        modulo: 'base_conhecimento',
        funcionalidade: 'exclusao_conhecimento',
        operacao: 'delete',
        registroId: item.id,
        dadosAntes: item,
        observacao: `Conhecimento "${item.title}" excluído (exclusão real, não há soft-delete nesta tabela).`,
      });
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível excluir.', 'error');
    }
  };

  return (
    <>
      <PageHeader title="Base de Conhecimento" />

      <section className="card knowledge-functional-card simplified">
        <div className="section-title-row">
          <div>
            <h3>Conhecimento publicado pelo agente</h3>
            <p className="section-description">
              <Bot size={14} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
              O agente decide o que publicar aqui a partir das conversas — esta tela é pra revisar, corrigir ou remover.
              Cadastro manual ainda não está disponível.
            </p>
          </div>
          <span className="small-muted">{loading ? '...' : `${filtered.length} de ${items.length} registros`}</span>
        </div>

        {loadError && (
          <div className="v36-status-strip compact" style={{ marginBottom: 12 }}>
            <Info size={14} /> <span>Não foi possível carregar: {loadError}</span>
          </div>
        )}

        <div className="smart-filter-bar knowledge-filter-bar simplified">
          <div className="smart-search">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por título, conteúdo, categoria ou tag..." />
          </div>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">Todas as categorias</option>
            {categorias.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div className="knowledge-table-wrap full">
          <table>
            <thead>
              <tr>
                <th>Conhecimento</th>
                <th>Categoria</th>
                <th>Origem</th>
                <th>Publicado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    <div className="table-subtitle">{item.content.length > 120 ? `${item.content.slice(0, 120)}…` : item.content}</div>
                    <div className="knowledge-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                  </td>
                  <td>{item.category ? <Badge tone="blue">{item.category}</Badge> : '-'}</td>
                  <td><span className="origin-pill"><FileText size={14} /> {sourceLabel[item.sourceType] || item.sourceType}</span></td>
                  <td>{formatDateTime(item.createdAt)}</td>
                  <td>
                    <div className="row-action-group">
                      <button title="Editar" onClick={() => openEdit(item)}><Edit3 size={16} /></button>
                      <button title="Excluir" onClick={() => void remove(item)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && !loadError && (
                <tr><td colSpan={5} className="empty-note">Nenhum conhecimento publicado ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editing && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="knowledge-form-modal simplified">
            <div className="cadastro-modal-header">
              <strong>Editar conhecimento</strong>
              <button className="icon-btn" onClick={() => setEditing(null)}><X size={18} /></button>
            </div>

            <div className="cadastro-modal-content">
              <section className="cadastro-form-section">
                <h3>Conteúdo</h3>
                <div className="cadastro-form-grid">
                  <label className="span-2"><span>Título</span><input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></label>
                  <label className="span-2"><span>Conteúdo</span><textarea value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} rows={6} /></label>
                  <label><span>Categoria</span><select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
                    <option value="">Sem categoria</option>
                    {categorias.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select></label>
                  <label><span>Tags (separadas por vírgula)</span><input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} /></label>
                </div>
              </section>
              <p className="section-description">Editar o conteúdo não atualiza automaticamente a busca semântica do agente para este registro — pode ficar menos preciso até ser reprocessado.</p>
            </div>

            <div className="cadastro-modal-footer">
              <button onClick={() => setEditing(null)}>Cancelar</button>
              <button className="primary" disabled={salvando} onClick={() => void save()}>{salvando ? 'Salvando...' : 'Salvar alterações'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BaseConhecimento;
