import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, RefreshCcw, Search, X } from 'lucide-react';
import { showAppToast } from '../../lib/appToast';
import { filterChannelProviders, listV35IntegrationCatalog, type V35IntegrationCatalogItem, type V35LoadState } from '../../services/v35Supabase';
import { useSession } from '../../contexts/SessionContext';
import { createChannel, listChannelTypes, listChannels, updateChannel, type ChannelRecord, type ChannelType } from '../../services/canaisAgentes';

export type CanaisProps = { onSelectDetail?: (detail: any) => void; onOpenDetail?: (detail: any) => void };

const emptyChannel: ChannelRecord = { id: '', nome: '', tipo: 'Mensageria', providerCode: '', providerName: '', fila: 'Atendimento digital', sla: '4h', status: 'Em configuração' };

export function Canais(_props: CanaisProps) {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;

  const [providers, setProviders] = useState<V35IntegrationCatalogItem[]>([]);
  const [source, setSource] = useState<V35LoadState>('empty');
  const [channelTypes, setChannelTypes] = useState<ChannelType[]>([]);
  const [channels, setChannels] = useState<ChannelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ChannelRecord>(emptyChannel);
  const [selected, setSelected] = useState<ChannelRecord | null>(null);

  const loadProviders = async () => {
    const result = await listV35IntegrationCatalog();
    const channelProviders = filterChannelProviders(result.data);
    setProviders(channelProviders);
    setSource(result.source);
  };

  useEffect(() => { void loadProviders(); }, []);

  useEffect(() => {
    if (!clienteId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([listChannelTypes(), listChannels(clienteId)])
      .then(([types, list]) => {
        setChannelTypes(types.items);
        setChannels(list.items);
        setSelected(list.items[0] ?? null);
      })
      .finally(() => setLoading(false));
  }, [clienteId]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return channels.filter((channel) => !normalized || [channel.nome, channel.tipo, channel.providerName, channel.fila, channel.sla, channel.status].join(' ').toLowerCase().includes(normalized));
  }, [channels, query]);

  const update = <K extends keyof ChannelRecord>(key: K, value: ChannelRecord[K]) => setForm((current) => ({ ...current, [key]: value }));

  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyChannel, tipo: channelTypes[0]?.name || emptyChannel.tipo, providerCode: providers[0]?.code || '', providerName: providers[0]?.name || '' });
    setModal(true);
  };

  const edit = (channel: ChannelRecord) => {
    setEditingId(channel.id);
    setForm(channel);
    setModal(true);
  };

  const save = async () => {
    if (!form.nome.trim()) {
      showAppToast('Informe o nome do canal.', 'warning');
      return;
    }
    if (!clienteId) {
      showAppToast('Acesse o contexto de um cliente antes de cadastrar.', 'warning');
      return;
    }
    const provider = providers.find((item) => item.code === form.providerCode);
    const payload = { ...form, providerName: provider?.name || form.providerName || 'Integração não selecionada' };
    setSalvando(true);
    try {
      if (editingId) {
        const { item } = await updateChannel(clienteId, editingId, payload);
        setChannels((current) => current.map((entry) => entry.id === editingId ? item : entry));
        setSelected(item);
        showAppToast('Canal atualizado.', 'success');
      } else {
        const { item } = await createChannel(clienteId, payload);
        setChannels((current) => [item, ...current]);
        setSelected(item);
        showAppToast('Canal criado.', 'success');
      }
      setModal(false);
    } finally {
      setSalvando(false);
    }
  };

  if (!clienteId) {
    return (
      <div className="v3464-page">
        <div className="v3464-page-head"><div><h1>Canais de Atendimento</h1></div></div>
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>Acesse o contexto de um cliente para ver os canais dele.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="v3464-page">
        <div className="v3464-page-head"><div><h1>Canais de Atendimento</h1></div></div>
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>Carregando...</div>
      </div>
    );
  }

  return (
    <div className="v3464-page">
      <div className="v3464-page-head">
        <div>
          <h1>Canais de Atendimento</h1>
          <p className="v36-muted">Canal é o uso operacional. Integração é a conexão técnica liberada pelo catálogo v35.</p>
        </div>
        <button className="v3464-btn primary" onClick={openNew}><Plus size={16} /> Novo canal</button>
      </div>

      <div className="v3464-two">
        <section className="v3464-card">
          <div className="v36-status-strip">
            <span>Fonte de provedores: {source === 'supabase' ? 'Supabase v35' : 'local/fallback'}</span>
            <span>{providers.length} provedores técnicos disponíveis</span>
            <button className="v36-link-button" onClick={loadProviders}><RefreshCcw size={14} /> Atualizar</button>
          </div>

          <div className="v3464-search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar canal, integração, agente, fila ou SLA..." />
          </div>

          <table className="v3464-table">
            <thead><tr><th>Canal</th><th>Tipo</th><th>Integração usada</th><th>Fila/SLA</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>{filtered.map((channel) => (
              <tr key={channel.id} onClick={() => setSelected(channel)}>
                <td><strong>{channel.nome}</strong><small>{channel.id}</small></td>
                <td>{channel.tipo}</td>
                <td>{channel.providerName}</td>
                <td>{channel.fila}<small>{channel.sla}</small></td>
                <td><span className="v3464-badge">{channel.status}</span></td>
                <td><button className="v3464-icon" onClick={(event) => { event.stopPropagation(); edit(channel); }}><Pencil size={16} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        </section>

        <aside className="v3464-side-panel">
          {selected ? (
            <>
              <h2>{selected.nome}</h2>
              <p>{selected.tipo}</p>
              {[
                ['Integração usada', selected.providerName],
                ['Provedor técnico', selected.providerCode],
                ['Agente padrão', 'SUSi'],
                ['Fila / SLA', `${selected.fila} • ${selected.sla}`],
                ['Transbordo humano', 'Após tentativas sem resolução ou solicitação do usuário.'],
              ].map(([title, body]) => <div className="v3464-side-box" key={title}><strong>{title}</strong><p>{body}</p></div>)}
            </>
          ) : (
            <p className="v36-muted">Nenhum canal cadastrado ainda. Clique em "Novo canal" para começar.</p>
          )}
        </aside>
      </div>

      {modal && (
        <div className="v3464-modal-backdrop">
          <section className="v3464-system-modal">
            <button className="v3464-modal-x" onClick={() => setModal(false)}><X size={18} /></button>
            <h2>{editingId ? 'Editar canal' : 'Novo canal'}</h2>
            <p>Configure o uso operacional e vincule a integração técnica correspondente.</p>
            <div className="v3464-modal-form">
              <label>Nome<input value={form.nome} onChange={(event) => update('nome', event.target.value)} placeholder="Ex.: Atendimento via WhatsApp" /></label>
              <label>Tipo<select value={form.tipo} onChange={(event) => update('tipo', event.target.value)}>{channelTypes.map((type) => <option key={type.id} value={type.name}>{type.name}</option>)}</select></label>
              <label>Integração técnica<select value={form.providerCode} onChange={(event) => update('providerCode', event.target.value)}>{providers.map((provider) => <option key={provider.id} value={provider.code}>{provider.name}</option>)}</select></label>
              <label>Fila<input value={form.fila} onChange={(event) => update('fila', event.target.value)} placeholder="Ex.: Atendimento digital" /></label>
              <label>SLA<input value={form.sla} onChange={(event) => update('sla', event.target.value)} placeholder="Ex.: 4h" /></label>
              <label>Status<select value={form.status} onChange={(event) => update('status', event.target.value)}><option>Ativo</option><option>Em configuração</option><option>Inativo</option></select></label>
            </div>
            <footer><button className="v3464-secondary-btn" onClick={() => setModal(false)}>Cancelar</button><button className="v3464-primary-btn" disabled={salvando} onClick={() => void save()}>{salvando ? 'Salvando...' : 'Salvar canal'}</button></footer>
          </section>
        </div>
      )}
    </div>
  );
}

export default Canais;
