import { useEffect, useMemo, useState } from 'react';
import { Bot, Database, Plus, RefreshCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { showAppToast } from '../../lib/appToast';
import { filterAgentEnabledProviders, listV35IntegrationCatalog, listV35ProviderActions, type V35IntegrationCatalogItem, type V35ProviderAction, type V35LoadState } from '../../services/v35Supabase';
import { useSession } from '../../contexts/SessionContext';
import { createAgent, listAgents, updateAgent, type AgentRecord } from '../../services/canaisAgentes';

export type AgentesProps = { onSelectDetail?: (detail: any) => void; onOpenDetail?: (detail: any) => void };

const emptyAgent: AgentRecord = { id: '', name: '', purpose: '', status: 'Em configuração', flows: 'Atendimento padrão', usage: 'Atendimento', providers: '', prompt: '' };

export function Agentes(_props: AgentesProps) {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;

  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [providers, setProviders] = useState<V35IntegrationCatalogItem[]>([]);
  const [actions, setActions] = useState<V35ProviderAction[]>([]);
  const [source, setSource] = useState<V35LoadState>('empty');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AgentRecord>(emptyAgent);
  const [selected, setSelected] = useState<AgentRecord | null>(null);

  const loadV35 = async () => {
    const catalog = await listV35IntegrationCatalog();
    const agentProviders = filterAgentEnabledProviders(catalog.data);
    setProviders(agentProviders);
    setSource(catalog.source);
    const providerWithActions = agentProviders.find((item) => item.can_create_tasks || item.can_feed_knowledge || item.can_open_attendance) || agentProviders[0];
    if (providerWithActions) {
      const actionResult = await listV35ProviderActions(providerWithActions.id);
      setActions(actionResult.data);
    }
  };

  useEffect(() => { void loadV35(); }, []);

  useEffect(() => {
    if (!clienteId) { setLoading(false); return; }
    setLoading(true);
    listAgents(clienteId)
      .then((result) => {
        setAgents(result.items);
        setSelected(result.items[0] ?? null);
      })
      .finally(() => setLoading(false));
  }, [clienteId]);

  const filteredAgents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return agents.filter((agent) => !normalized || [agent.name, agent.purpose, agent.status, agent.flows, agent.usage, agent.providers].join(' ').toLowerCase().includes(normalized));
  }, [agents, query]);

  const update = <K extends keyof AgentRecord>(key: K, value: AgentRecord[K]) => setForm((current) => ({ ...current, [key]: value }));

  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyAgent, providers: providers.slice(0, 3).map((item) => item.name).join(', ') });
    setModal(true);
  };

  const edit = (agent: AgentRecord) => {
    setEditingId(agent.id);
    setForm(agent);
    setModal(true);
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
        const { item } = await updateAgent(clienteId, editingId, form);
        setAgents((current) => current.map((entry) => entry.id === editingId ? item : entry));
        setSelected(item);
        showAppToast('Agente atualizado.', 'success');
      } else {
        const { item } = await createAgent(clienteId, form);
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
          <p className="v36-muted">Agentes usam conhecimento, conectores e ações liberadas no catálogo v35. Tokens e execução ficam no backend/plano.</p>
        </div>
        <button className="v3464-btn primary" onClick={openNew}><Plus size={16} /> Novo agente</button>
      </div>

      <div className="v3464-two">
        <section className="v3464-card">
          <div className="v36-status-strip">
            <span><Database size={15} /> Fonte: {source === 'supabase' ? 'Supabase v35' : 'local/fallback'}</span>
            <span>{providers.length} conectores utilizáveis por agentes</span>
            <span>{actions.length} ações carregadas</span>
            <button className="v36-link-button" onClick={loadV35}><RefreshCcw size={14} /> Atualizar</button>
          </div>
          <div className="v3464-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar agente, fluxo, uso, canal ou conector..." /></div>
          <table className="v3464-table"><tbody>{filteredAgents.map((agent) => <tr key={agent.id} onClick={() => setSelected(agent)}><td><Bot size={22} /></td><td><strong>{agent.name}</strong><small>{agent.purpose} • {agent.flows}</small></td><td><span className="v3464-badge">{agent.status}</span></td><td><button className="v3464-icon" onClick={(event) => { event.stopPropagation(); edit(agent); }}><SlidersHorizontal size={16} /></button></td></tr>)}</tbody></table>
        </section>

        <aside className="v3464-side-panel">
          <Bot size={28} />
          {selected ? (
            <>
              <h2>{selected.name}</h2>
              <p>{selected.purpose}</p>
              <button className="v3464-btn secondary" onClick={() => showAppToast('Teste do agente preparado para a v36.1/backend.', 'info')}>Testar agente</button> <button className="v3464-btn secondary" onClick={() => edit(selected)}><SlidersHorizontal size={16} /> Configurar</button>
              {[
                ['Prompt / Contexto', selected.prompt],
                ['Fluxos do agente', selected.flows],
                ['Pontos de uso', selected.usage],
                ['Conectores v35 vinculados', selected.providers || providers.slice(0, 5).map((item) => item.name).join(', ')],
                ['Ações disponíveis', actions.length ? actions.map((item) => item.action_name).slice(0, 4).join(', ') : 'Nenhuma ação carregada para o conector selecionado.'],
                ['Autonomia', 'Sugere ações, cria rascunhos e solicita confirmação quando a ação exigir validação.'],
              ].map(([title, body]) => <div className="v3464-side-box" key={title}><strong>{title}</strong><p>{body}</p></div>)}
            </>
          ) : (
            <p className="v36-muted">Nenhum agente cadastrado ainda. Clique em "Novo agente" para começar.</p>
          )}
        </aside>
      </div>

      {modal && (
        <div className="v3464-modal-backdrop">
          <section className="v3464-system-modal">
            <button className="v3464-modal-x" onClick={() => setModal(false)}><X size={18} /></button>
            <h2>{editingId ? 'Editar agente' : 'Novo agente'}</h2>
            <p>Defina comportamento, contexto, fluxos e conectores autorizados para o agente.</p>
            <div className="v3464-modal-form">
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
