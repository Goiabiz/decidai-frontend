import { Copy, Database, Edit3, FileJson, FunctionSquare, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/Badge';
import { normalizeFilterText } from '../../components/SmartFilters';
import { showAppConfirm } from '../../lib/appConfirm';
import { showAppToast } from '../../lib/appToast';
import { useSession } from '../../contexts/SessionContext';
import { logAudit } from '../../services/auditLog';
import { listV35ApiDictionary, type V35ApiDictionaryField, type V35LoadState } from '../../services/v35Supabase';
import { createCampoContexto, listCamposContexto, softDeleteCampoContexto, updateCampoContexto, type CampoContextoInput, type CampoContextoRecord, type CampoOrigem } from '../../services/camposContexto';

const emptyField: CampoContextoInput = {
  nome: '',
  descricao: '',
  tipo: 'Texto curto',
  origem: 'Manual',
  status: 'Ativo',
  integracao: '',
  endpoint: '',
  campoExterno: '',
  sensivel: false,
  usarTela: true,
  usarAlerta: false,
  usarRelatorio: true,
  usarAgente: true,
};

const fieldTypes = ['Texto curto', 'Parágrafo / Rich text', 'Número', 'Moeda', 'Percentual', 'Data', 'Data e hora', 'E-mail', 'Telefone', 'Lista seleção única', 'Lista seleção múltipla', 'Lista em cascata', 'Checkbox', 'Sim/Não', 'Fórmula', 'JSON', 'Anexo'];

function originIcon(origin: CampoOrigem) {
  if (origin === 'Integração/API') return Database;
  if (origin === 'Fórmula') return FunctionSquare;
  if (origin === 'Sistema') return FileJson;
  return Edit3;
}

export function CamposContexto() {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;

  const [items, setItems] = useState<CampoContextoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<CampoContextoInput>(emptyField);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [origin, setOrigin] = useState('');
  const [apiFields, setApiFields] = useState<V35ApiDictionaryField[]>([]);
  const [apiSource, setApiSource] = useState<V35LoadState>('empty');
  const [apiQuery, setApiQuery] = useState('');

  useEffect(() => {
    void listV35ApiDictionary().then((result) => {
      setApiFields(result.data);
      setApiSource(result.source);
    });
  }, []);

  const carregar = async () => {
    if (!clienteId) { setLoading(false); return; }
    setLoading(true);
    const result = await listCamposContexto(clienteId);
    setItems(result.items);
    setLoading(false);
  };

  useEffect(() => { void carregar(); }, [clienteId]);

  const filtered = useMemo(() => {
    const normalized = normalizeFilterText(query);
    return items.filter((item) => {
      const text = normalizeFilterText(Object.values(item).join(' '));
      return (!normalized || text.includes(normalized)) && (!origin || item.origem === origin);
    });
  }, [items, query, origin]);

  const update = <K extends keyof CampoContextoInput>(key: K, value: CampoContextoInput[K]) => setForm((current) => ({ ...current, [key]: value }));

  const filteredApiFields = useMemo(() => {
    const normalized = normalizeFilterText(apiQuery);
    return apiFields
      .filter((field) => {
        const text = normalizeFilterText([field.connection_name, field.endpoint_name, field.field_label, field.field_key, field.field_path, field.data_type].join(' '));
        return !normalized || text.includes(normalized);
      })
      .slice(0, 10);
  }, [apiFields, apiQuery]);

  const applyApiField = (field: V35ApiDictionaryField) => {
    update('origem', 'Integração/API');
    update('integracao', field.connection_name || 'API guiada');
    update('endpoint', field.endpoint_name || field.endpoint_key || 'Endpoint');
    update('campoExterno', field.field_label || field.field_key || field.field_path || 'Campo externo');
    update('tipo', field.data_type || 'Texto curto');
    update('sensivel', !!field.is_sensitive);
    update('usarTela', !!field.can_use_in_screen);
    update('usarAlerta', !!field.can_use_in_alert);
    update('usarRelatorio', !!field.can_use_in_report);
    update('usarAgente', !!field.can_use_by_agent);
  };

  const openNew = () => {
    setForm(emptyField);
    setEditingId(null);
    setOpen(true);
  };

  const edit = (item: CampoContextoRecord) => {
    const { id, ...rest } = item;
    setForm(rest);
    setEditingId(id);
    setOpen(true);
  };

  const duplicate = async (item: CampoContextoRecord) => {
    if (!clienteId) return;
    const { id, ...rest } = item;
    try {
      await createCampoContexto(clienteId, { ...rest, nome: `${item.nome} cópia` });
      await carregar();
      showAppToast('Campo duplicado.', 'success');
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível duplicar o campo.', 'error');
    }
  };

  const remove = (item: CampoContextoRecord) => {
    void showAppConfirm({
      title: 'Excluir campo',
      description: `Excluir o campo "${item.nome}"? Essa ação não deve ser usada se o campo já estiver vinculado a uma tela em produção. O registro fica oculto, não é apagado de verdade.`,
      confirmLabel: 'Excluir campo',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await softDeleteCampoContexto(item.id);
          await carregar();
          showAppToast('Campo excluído.', 'info');

          void logAudit({
            usuarioNome: session?.user.displayName || 'Desconhecido',
            usuarioEmail: session?.user.email || '',
            modulo: 'campos_contexto',
            funcionalidade: 'exclusao_campo',
            operacao: 'delete',
            registroId: item.id,
            dadosAntes: item,
            observacao: `Campo "${item.nome}" excluído (soft delete).`,
          });
        } catch (error) {
          showAppToast(error instanceof Error ? error.message : 'Não foi possível excluir o campo.', 'error');
        }
      },
    });
  };

  const save = async () => {
    if (!form.nome.trim()) {
      showAppToast('Informe o nome do campo.', 'warning');
      return;
    }
    if (!clienteId) {
      showAppToast('Acesse o contexto de um cliente antes de cadastrar.', 'warning');
      return;
    }

    setSalvando(true);
    try {
      if (editingId) {
        await updateCampoContexto(editingId, form);
        showAppToast('Campo atualizado.', 'success');
      } else {
        await createCampoContexto(clienteId, form);
        showAppToast('Campo criado.', 'success');
      }
      await carregar();
      setOpen(false);
      setEditingId(null);
      setForm(emptyField);
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível salvar o campo.', 'error');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <PageHeader title="Campos" action={<button className="primary-small" onClick={openNew}><Plus size={16} /> Novo campo</button>} />

      <section className="card fields-api-card">
        <div className="section-title-row">
          <div>
            <h3>Cadastro de campos</h3>
            <p className="section-description">Campos podem ser manuais, do sistema, calculados ou vindos de integração/API.</p>
          </div>
          <span className="small-muted">{loading ? '...' : `${filtered.length} de ${items.length} registros`}</span>
        </div>

        <div className="field-filter-grid">
          <div className="smart-search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar campo, origem, integração, endpoint ou descrição..." />
          </div>
          <select value={origin} onChange={(event) => setOrigin(event.target.value)}>
            <option value="">Todas as origens</option>
            <option>Manual</option>
            <option>Sistema</option>
            <option>Fórmula</option>
            <option>Integração/API</option>
          </select>
        </div>

        <div className="simple-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Campo</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Origem</th>
                <th>Uso</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const Icon = originIcon(item.origem);

                return (
                  <tr key={item.id}>
                    <td><strong>{item.nome}</strong></td>
                    <td>{item.descricao}</td>
                    <td><Badge tone="blue">{item.tipo}</Badge></td>
                    <td><span className="origin-pill"><Icon size={14} /> {item.origem}</span>{item.origem === 'Integração/API' && <small className="table-subtitle">{item.integracao} / {item.endpoint} / {item.campoExterno}</small>}</td>
                    <td><span className="table-subtitle">Tela {item.usarTela ? 'sim' : 'não'} • Alerta {item.usarAlerta ? 'sim' : 'não'} • Relatório {item.usarRelatorio ? 'sim' : 'não'} • Agente {item.usarAgente ? 'sim' : 'não'}</span></td>
                    <td>
                      <div className="row-action-group">
                        <button title="Editar" onClick={() => edit(item)}><Edit3 size={16} /></button>
                        <button title="Duplicar" onClick={() => void duplicate(item)}><Copy size={16} /></button>
                        <button title="Excluir" onClick={() => remove(item)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="empty-note">Nenhum campo cadastrado ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {open && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="agent-modal">
            <div className="cadastro-modal-header">
              <strong>{editingId ? 'Editar campo' : 'Novo campo'}</strong>
              <button className="icon-btn" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>

            <div className="cadastro-modal-content">
              <section className="cadastro-form-section">
                <h3>Identificação</h3>
                <div className="cadastro-form-grid">
                  <label><span>Nome *</span><input value={form.nome} onChange={(event) => update('nome', event.target.value)} placeholder="Ex.: Status do pedido" /></label>
                  <label><span>Tipo</span><select value={form.tipo} onChange={(event) => update('tipo', event.target.value)}>{fieldTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label className="span-2"><span>Descrição</span><input value={form.descricao} onChange={(event) => update('descricao', event.target.value)} placeholder="Explique o objetivo do campo." /></label>
                  <label><span>Origem do dado</span><select value={form.origem} onChange={(event) => update('origem', event.target.value as CampoOrigem)}>
                    <option>Manual</option>
                    <option>Sistema</option>
                    <option>Fórmula</option>
                    <option>Integração/API</option>
                  </select></label>
                  <label><span>Status</span><select value={form.status} onChange={(event) => update('status', event.target.value as CampoContextoInput['status'])}><option>Ativo</option><option>Inativo</option></select></label>
                </div>
              </section>

              {form.origem === 'Integração/API' && (
                <section className="cadastro-form-section">
                  <h3>Origem Integração/API</h3>
                  <p className="section-description">Dicionário carregado do Supabase v35. Quando a API guiada descobrir campos, eles aparecem aqui para vínculo com o campo personalizado.</p>
                  <div className="v36-status-strip compact"><span>Fonte: {apiSource === 'supabase' ? 'Supabase v35' : apiSource === 'empty' ? 'Sem campos descobertos' : 'Local/fallback'}</span><span>{apiFields.length} campos externos</span></div>
                  <div className="cadastro-form-grid">
                    <label><span>Buscar no dicionário</span><input value={apiQuery} onChange={(event) => setApiQuery(event.target.value)} placeholder="Digite para buscar conexão, endpoint ou campo externo..." /></label>
                    <label><span>Campos encontrados</span><select value="" onChange={(event) => { const field = apiFields.find((item) => item.response_field_id === event.target.value); if (field) applyApiField(field); }}>
                      <option value="">Selecione um campo externo</option>
                      {filteredApiFields.map((field) => <option key={field.response_field_id || field.field_path || field.field_key} value={field.response_field_id || ''}>{field.connection_name || 'API'} / {field.endpoint_name || field.endpoint_key} / {field.field_label || field.field_key}</option>)}
                    </select></label>
                    <label><span>Integração</span><input value={form.integracao || ''} onChange={(event) => update('integracao', event.target.value)} placeholder="Ex.: Bling, Salesforce, API personalizada" /></label>
                    <label><span>Endpoint</span><input value={form.endpoint || ''} onChange={(event) => update('endpoint', event.target.value)} placeholder="Ex.: Produtos, Pedidos, Clientes" /></label>
                    <label><span>Campo externo</span><input value={form.campoExterno || ''} onChange={(event) => update('campoExterno', event.target.value)} placeholder="Ex.: estoque_atual" /></label>
                    <label><span>Sensível?</span><select value={form.sensivel ? 'sim' : 'nao'} onChange={(event) => update('sensivel', event.target.value === 'sim')}><option value="nao">Não</option><option value="sim">Sim</option></select></label>
                  </div>
                </section>
              )}

              <section className="cadastro-form-section">
                <h3>Uso do campo</h3>
                <div className="capability-config">
                  <label><input type="checkbox" checked={!!form.usarTela} onChange={() => update('usarTela', !form.usarTela)} /> Usar em tela</label>
                  <label><input type="checkbox" checked={!!form.usarAlerta} onChange={() => update('usarAlerta', !form.usarAlerta)} /> Usar em alerta</label>
                  <label><input type="checkbox" checked={!!form.usarRelatorio} onChange={() => update('usarRelatorio', !form.usarRelatorio)} /> Usar em relatório</label>
                  <label><input type="checkbox" checked={!!form.usarAgente} onChange={() => update('usarAgente', !form.usarAgente)} /> Usar pelo agente</label>
                </div>
              </section>
            </div>

            <div className="cadastro-modal-footer">
              <button onClick={() => setOpen(false)}>Cancelar</button>
              <button className="primary" disabled={salvando} onClick={() => void save()}>{salvando ? 'Salvando...' : 'Salvar campo'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CamposContexto;
