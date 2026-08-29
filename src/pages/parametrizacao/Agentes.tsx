import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Camera, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { showAppToast } from '../../lib/appToast';
import { filterAgentEnabledProviders, listV35IntegrationCatalog, type V35IntegrationCatalogItem } from '../../services/v35Supabase';
import { useSession } from '../../contexts/SessionContext';
import { createAgent, listAgents, updateAgent, type AgentRecord } from '../../services/canaisAgentes';
import { uploadAvatar } from '../../services/storage';
import { FloatingPlatformAssistant } from '../../components/FloatingPlatformAssistant';

export type AgentesProps = { onSelectDetail?: (detail: any) => void; onOpenDetail?: (detail: any) => void };

const emptyAgent: AgentRecord = { id: '', name: '', purpose: '', status: 'Em configuração', flows: 'Atendimento padrão', usage: 'Atendimento', providers: '', prompt: '', avatarUrl: '' };

// Sem padrão de tamanho/formato ainda em nenhum outro upload de avatar do app (usuário,
// "minha conta") -- fixando um aqui porque o ícone do agente vale pra todos os clientes finais
// que falarem com ele, não só pra quem fez o upload.
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export function Agentes(_props: AgentesProps) {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;

  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [providers, setProviders] = useState<V35IntegrationCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AgentRecord>(emptyAgent);
  const [selected, setSelected] = useState<AgentRecord | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [testing, setTesting] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Só carrega o catálogo de conectores pra sugerir defaults em "Novo agente" -- não expõe
  // fonte/contagem/catálogo na tela (informação interna de motor, não do agente do cliente).
  const loadV35 = async () => {
    const catalog = await listV35IntegrationCatalog();
    setProviders(filterAgentEnabledProviders(catalog.data));
  };

  useEffect(() => { void loadV35(); }, []);

  useEffect(() => {
    if (!clienteId) { setLoading(false); return; }
    setLoading(true);
    listAgents(clienteId)
      .then((result) => {
        setAgents(result.items);
        // Não seleciona nenhum agente sozinho -- a tela mostrava o painel de detalhe (com
        // "Testar agente"/"Configurar") assim que abria, mesmo sem o usuário ter clicado em
        // nada. Só mostra depois de um clique real na lista (pedido direto do usuário).
        setSelected(null);
      })
      .finally(() => setLoading(false));
  }, [clienteId]);

  const filteredAgents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return agents.filter((agent) => !normalized || [agent.name, agent.purpose, agent.status, agent.flows, agent.usage, agent.providers].join(' ').toLowerCase().includes(normalized));
  }, [agents, query]);

  const update = <K extends keyof AgentRecord>(key: K, value: AgentRecord[K]) => setForm((current) => ({ ...current, [key]: value }));

  const selectAgent = (agent: AgentRecord) => {
    setSelected(agent);
    setTesting(false);
  };

  const openNew = () => {
    setEditingId(null);
    setAvatarFile(null);
    setForm({ ...emptyAgent, providers: providers.slice(0, 3).map((item) => item.name).join(', ') });
    setModal(true);
  };

  const edit = (agent: AgentRecord) => {
    setEditingId(agent.id);
    setAvatarFile(null);
    setForm(agent);
    setModal(true);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showAppToast('Envie uma imagem (PNG, JPG ou SVG).', 'warning');
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      showAppToast('Imagem muito grande -- até 2 MB.', 'warning');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => update('avatarUrl', String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.name.trim()) {
      showAppToast('Informe o nome do agente.', 'warning');
      return;
    }
    if (!clienteId) {
      showAppToast('Acesse o contexto de um cliente antes de cadastrar.', 'warning');
      return;
    }
    setSalvando(true);
    try {
      if (editingId) {
        const avatarUrl = avatarFile ? await uploadAvatar(clienteId, `agente-${editingId}`, avatarFile) : form.avatarUrl;
        const { item } = await updateAgent(clienteId, editingId, { ...form, avatarUrl });
        setAgents((current) => current.map((entry) => entry.id === editingId ? item : entry));
        setSelected(item);
        showAppToast('Agente atualizado.', 'success');
      } else {
        const { item: created } = await createAgent(clienteId, { ...form, avatarUrl: '' });
        const item = avatarFile
          ? (await updateAgent(clienteId, created.id, { ...form, avatarUrl: await uploadAvatar(clienteId, `agente-${created.id}`, avatarFile) })).item
          : created;
        setAgents((current) => [item, ...current]);
        setSelected(item);
        showAppToast('Agente criado.', 'success');
      }
      setModal(false);
    } finally {
      setSalvando(false);
    }
  };

  if (!clienteId) {
    return (
      <div className="v3464-page">
        <div className="v3464-page-head"><div><h1>Agentes</h1></div></div>
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>Acesse o contexto de um cliente para ver os agentes dele.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="v3464-page">
        <div className="v3464-page-head"><div><h1>Agentes</h1></div></div>
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>Carregando...</div>
      </div>
    );
  }

  return (
    <div className="v3464-page">
      <div className="v3464-page-head">
        <div>
          <h1>Agentes</h1>
          <p className="v36-muted">Crie e configure o agente que atende os clientes do seu ambiente -- nome, comportamento, ícone e tom de voz.</p>
        </div>
        <button className="v3464-btn primary" onClick={openNew}><Plus size={16} /> Novo agente</button>
      </div>

      <div className="v3464-two">
        <section className="v3464-card">
          <div className="v3464-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar agente, fluxo, uso, canal ou conector..." /></div>
          <table className="v3464-table"><tbody>{filteredAgents.map((agent) => <tr key={agent.id} onClick={() => selectAgent(agent)}><td>{agent.avatarUrl ? <img src={agent.avatarUrl} alt={agent.name} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} /> : <Bot size={22} />}</td><td><strong>{agent.name}</strong><small>{agent.purpose} • {agent.flows}</small></td><td><button className="v3464-icon" onClick={(event) => { event.stopPropagation(); edit(agent); }}><SlidersHorizontal size={16} /></button></td></tr>)}</tbody></table>
        </section>

        {selected && (
          <aside className="v3464-side-panel">
            {selected.avatarUrl ? <img src={selected.avatarUrl} alt={selected.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} /> : <Bot size={28} />}
            <h2>{selected.name}</h2>
            <p>{selected.purpose}</p>
            <button className="v3464-btn secondary" onClick={() => setTesting((current) => !current)}>{testing ? 'Fechar teste' : 'Testar agente'}</button> <button className="v3464-btn secondary" onClick={() => edit(selected)}><SlidersHorizontal size={16} /> Configurar</button>
            {[
              ['Prompt / Contexto', selected.prompt],
              ['Fluxos do agente', selected.flows],
              ['Pontos de uso', selected.usage],
              ['Conectores vinculados', selected.providers || 'Nenhum conector configurado ainda.'],
              ['Autonomia', 'Sugere ações, cria rascunhos e solicita confirmação quando a ação exigir validação.'],
            ].map(([title, body]) => <div className="v3464-side-box" key={title}><strong>{title}</strong><p>{body}</p></div>)}
          </aside>
        )}
      </div>

      {testing && selected && (
        <FloatingPlatformAssistant
          mode="usuario-cliente"
          iconUrl={selected.avatarUrl || undefined}
          enableFirstContact={false}
          initialOpen
          instanceId="test-client-agent"
          pageTitle={`Teste: ${selected.name}`}
        />
      )}

      {modal && (
        <div className="v3464-modal-backdrop">
          <section className="v3464-system-modal">
            <button className="v3464-modal-x" onClick={() => setModal(false)}><X size={18} /></button>
            <h2>{editingId ? 'Editar agente' : 'Novo agente'}</h2>
            <p>Defina comportamento, contexto, fluxos e conectores autorizados para o agente.</p>
            <div className="v3464-modal-form">
              <label>
                Ícone
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    className="v3464-icon"
                    onClick={() => avatarInputRef.current?.click()}
                    title="Escolher ícone"
                    style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {form.avatarUrl ? <img src={form.avatarUrl} alt={form.name || 'Ícone do agente'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={18} />}
                  </button>
                  <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                  <small className="v36-muted">Imagem quadrada, até 2 MB. Vale para todos os clientes finais que falarem com este agente.</small>
                </div>
              </label>
              <label>Nome<input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Ex.: Assistente de Atendimento" /></label>
              <label>Finalidade<input value={form.purpose} onChange={(event) => update('purpose', event.target.value)} placeholder="Ex.: Atendimento operacional" /></label>
              <label>Prompt / contexto<textarea value={form.prompt} onChange={(event) => update('prompt', event.target.value)} placeholder="Defina como o agente deve orientar, responder e sugerir ações." /></label>
              <label>Fluxos<select value={form.flows} onChange={(event) => update('flows', event.target.value)}><option>Atendimento padrão</option><option>Geração de alerta</option><option>Criação de tarefa</option><option>API guiada</option><option>Onboarding inicial</option></select></label>
              <label>Conectores permitidos<input value={form.providers} onChange={(event) => update('providers', event.target.value)} placeholder="Ex.: Gmail, WhatsApp, Jira, API personalizada" /></label>
            </div>
            <footer><button className="v3464-secondary-btn" onClick={() => setModal(false)}>Cancelar</button><button className="v3464-primary-btn" disabled={salvando} onClick={() => void save()}>{salvando ? 'Salvando...' : 'Salvar agente'}</button></footer>
          </section>
        </div>
      )}
    </div>
  );
}

export default Agentes;
