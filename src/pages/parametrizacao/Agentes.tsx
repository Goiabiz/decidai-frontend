import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Camera, Info, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { showAppToast } from '../../lib/appToast';
import { filterAgentEnabledProviders, listV35IntegrationCatalog, providerDomain, type V35IntegrationCatalogItem } from '../../services/v35Supabase';
import { useSession } from '../../contexts/SessionContext';
import { createAgent, listAgents, updateAgent, type AgentRecord } from '../../services/canaisAgentes';
import { uploadAvatar } from '../../services/storage';
import { BrandIcon } from '../../components/BrandIcon';

export type AgentesProps = { onSelectDetail?: (detail: any) => void; onOpenDetail?: (detail: any) => void };

const emptyAgent: AgentRecord = { id: '', name: '', purpose: '', status: 'Em configuração', flows: 'Atendimento padrão', usage: 'Atendimento', providers: '', prompt: '', avatarUrl: '', color: '#00875a', voiceTone: '', ttsVoice: '' };

// Sem padrão de tamanho/formato ainda em nenhum outro upload de avatar do app (usuário,
// "minha conta") -- fixando um aqui porque o ícone do agente vale pra todos os clientes finais
// que falarem com ele, não só pra quem fez o upload.
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const FLOW_OPTIONS = ['Atendimento padrão', 'Geração de alerta', 'Criação de tarefa', 'API guiada', 'Onboarding inicial'];

// IDs reais da voz da OpenAI TTS (voice-tts.ts) -- mesmo catálogo fixo que a API aceita, sem
// endpoint de listagem pra consultar dinamicamente.
// Correção de bug real (30/08/2026): esta lista só tinha vozes do motor ANTIGO (OpenAI tts-1),
// então escolher qualquer voz aqui rebaixava o agente pro motor antigo -- a única forma de ficar
// no motor novo (Gemini, voz Kore, escolhido pelo usuário depois de ouvir 11 amostras) era não
// escolher voz nenhuma. As vozes do Gemini abaixo foram confirmadas uma a uma contra a API real
// (ver GEMINI_TTS_VOICES em gemini-tts.ts); as da OpenAI continuam disponíveis, mas rotuladas
// como motor antigo pra escolha ser informada, não acidental.
const TTS_VOICE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Padrão da plataforma (Kore)' },
  { value: 'Kore', label: 'Kore (feminina, pt-BR natural)' },
  { value: 'Leda', label: 'Leda (feminina)' },
  { value: 'Aoede', label: 'Aoede (feminina)' },
  { value: 'Callirrhoe', label: 'Callirrhoe (feminina)' },
  { value: 'Autonoe', label: 'Autonoe (feminina)' },
  { value: 'Zephyr', label: 'Zephyr (neutra)' },
  { value: 'Puck', label: 'Puck (masculina)' },
  { value: 'Charon', label: 'Charon (masculina)' },
  { value: 'Fenrir', label: 'Fenrir (masculina, grave)' },
  { value: 'nova', label: 'Nova (feminina) — motor antigo' },
  { value: 'shimmer', label: 'Shimmer (feminina, suave) — motor antigo' },
  { value: 'alloy', label: 'Alloy (neutra) — motor antigo' },
  { value: 'echo', label: 'Echo (masculina) — motor antigo' },
  { value: 'fable', label: 'Fable (narrativa) — motor antigo' },
  { value: 'onyx', label: 'Onyx (masculina, grave) — motor antigo' },
];

function InfoTip({ text }: { text: string }) {
  return <span className="field-info-tip" data-tooltip={text}><Info size={14} /></span>;
}

function FieldLabel({ children, info }: { children: React.ReactNode; info: string }) {
  return <span className="form-label-text">{children} <InfoTip text={info} /></span>;
}

function toggleInCommaList(list: string, value: string): string {
  const current = list.split(',').map((item) => item.trim()).filter(Boolean);
  const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
  return next.join(', ');
}

// Achado real testando ao vivo (usuário): ativar o agente só mostrava o ícone enquanto a
// pessoa ficava na própria tela Agentes -- saía da tela, o ícone sumia (React desmontava o
// componente). Não é funcional -- "ativo" precisa sobreviver a navegação e valer pra
// qualquer usuário do ambiente, não só a sessão de quem ativou. Por isso a ativação agora
// escreve de verdade em `client_agents.status` (App.tsx lê isso pra montar o ícone GLOBAL,
// fora desta tela) em vez de só um state local -- e avisa o App.tsx pra reagir na hora, sem
// precisar de reload, via este evento.
export const CLIENT_AGENT_STATUS_EVENT = 'client-agent-status-changed';

// Ícone estilo avatar do Discord: cor de fundo escolhida pelo tenant, imagem em cima
// (`object-fit: contain`, não corta) -- funciona bem tanto com imagem de fundo transparente
// quanto opaco. Componente pequeno reaproveitado nos 3 lugares que mostram o ícone (linha da
// lista, painel lateral, botão de upload no modal) pra não repetir o mesmo estilo 3x.
function AgentIcon({ agent, size }: { agent: Pick<AgentRecord, 'name' | 'avatarUrl' | 'color'>; size: number }) {
  if (!agent.avatarUrl) return <Bot size={size} />;
  return (
    <span
      style={{
        width: size + 6, height: size + 6, borderRadius: '50%', background: agent.color || '#64748b',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
      }}
    >
      <img src={agent.avatarUrl} alt={agent.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </span>
  );
}

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
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const panelAreaRef = useRef<HTMLDivElement>(null);

  // Clicar fora da lista/painel oculta o painel lateral junto (pedido direto do usuário) --
  // ignora clique enquanto o modal de edição está aberto, senão editar o agente selecionado
  // desmarcaria ele por baixo do modal. Nunca mexe em ativação -- isso é persistido de
  // verdade (status no banco), não deve reagir a navegação/clique na tela.
  useEffect(() => {
    if (modal) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (panelAreaRef.current && !panelAreaRef.current.contains(event.target as Node)) {
        setSelected(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [modal]);

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

  const selectAgent = (agent: AgentRecord) => setSelected(agent);

  const toggleAgentStatus = async (agent: AgentRecord) => {
    if (!clienteId) return;
    const nextStatus = agent.status === 'ativo' ? 'configurando' : 'ativo';
    const { item } = await updateAgent(clienteId, agent.id, { ...agent, status: nextStatus });
    setAgents((current) => current.map((entry) => entry.id === agent.id ? item : entry));
    setSelected(item);
    window.dispatchEvent(new CustomEvent(CLIENT_AGENT_STATUS_EVENT, { detail: { clienteId } }));
    showAppToast(nextStatus === 'ativo' ? 'Agente ativado -- ícone disponível em todo o ambiente.' : 'Agente desativado.', 'success');
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
      showAppToast('Imagem muito grande. Até 2 MB.', 'warning');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => update('avatarUrl', String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const save = async (activateAfter: boolean) => {
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
      // "Salvar e ativar" poupa o clique extra em "Ativar agente" logo depois de configurar
      // (pedido direto do usuário) -- grava status='ativo' na mesma chamada.
      const status = activateAfter ? 'ativo' : form.status;
      if (editingId) {
        const avatarUrl = avatarFile ? await uploadAvatar(clienteId, `agente-${editingId}`, avatarFile) : form.avatarUrl;
        const { item } = await updateAgent(clienteId, editingId, { ...form, avatarUrl, status });
        setAgents((current) => current.map((entry) => entry.id === editingId ? item : entry));
        setSelected(item);
        showAppToast('Agente atualizado.', 'success');
      } else {
        const { item: created } = await createAgent(clienteId, { ...form, avatarUrl: '', status });
        const item = avatarFile
          ? (await updateAgent(clienteId, created.id, { ...form, status, avatarUrl: await uploadAvatar(clienteId, `agente-${created.id}`, avatarFile) })).item
          : created;
        setAgents((current) => [item, ...current]);
        setSelected(item);
        showAppToast('Agente criado.', 'success');
      }
      setModal(false);
      if (activateAfter) window.dispatchEvent(new CustomEvent(CLIENT_AGENT_STATUS_EVENT, { detail: { clienteId } }));
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
          <p className="v36-muted">Crie e configure o agente que atende os clientes do seu ambiente: nome, comportamento, ícone e tom de voz.</p>
        </div>
        <button className="v3464-btn primary" onClick={openNew}><Plus size={16} /> Novo agente</button>
      </div>

      <div className="v3464-two" ref={panelAreaRef}>
        <section className="v3464-card">
          <div className="v3464-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar agente, fluxo, uso, canal ou conector..." /></div>
          <table className="v3464-table"><tbody>{filteredAgents.map((agent) => <tr key={agent.id} onClick={() => selectAgent(agent)}><td><AgentIcon agent={agent} size={22} /></td><td><strong>{agent.name}</strong><small>{agent.purpose} • {agent.flows}</small></td><td><button className="v3464-icon" onClick={(event) => { event.stopPropagation(); edit(agent); }}><SlidersHorizontal size={16} /></button></td></tr>)}</tbody></table>
        </section>

        {selected && (
          <aside className="v3464-side-panel">
            <AgentIcon agent={selected} size={28} />
            <h2>{selected.name}</h2>
            <p>{selected.purpose}</p>
            <button className="v3464-btn secondary" onClick={() => void toggleAgentStatus(selected)}>{selected.status === 'ativo' ? 'Desativar agente' : 'Ativar agente'}</button> <button className="v3464-btn secondary" onClick={() => edit(selected)}><SlidersHorizontal size={16} /> Configurar</button>
            {[
              ['Prompt / Contexto', selected.prompt],
              ['Fluxos do agente', selected.flows],
              ['Pontos de uso', selected.usage],
              ['Tom de voz', selected.voiceTone || 'Não definido ainda.'],
              ['Conectores vinculados', selected.providers || 'Nenhum conector configurado ainda.'],
              ['Autonomia', 'Sugere ações, cria rascunhos e solicita confirmação quando a ação exigir validação.'],
            ].map(([title, body]) => <div className="v3464-side-box" key={title}><strong>{title}</strong><p>{body}</p></div>)}
          </aside>
        )}
      </div>

      {modal && (
        <div className="v3464-modal-backdrop">
          <section className="v3464-system-modal">
            <button className="v3464-modal-x" onClick={() => setModal(false)}><X size={18} /></button>
            <h2>{editingId ? 'Editar agente' : 'Novo agente'}</h2>
            <p>Defina comportamento, contexto, fluxos e conectores autorizados para o agente.</p>
            <div className="v3464-modal-form">
              <label>
                <FieldLabel info="Imagem que representa o agente pra quem fala com ele. Escolha também uma cor de fundo ao lado.">Ícone</FieldLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    type="button"
                    className="v3464-icon"
                    onClick={() => avatarInputRef.current?.click()}
                    title="Escolher imagem do ícone"
                    style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: form.avatarUrl ? form.color || '#64748b' : undefined }}
                  >
                    {form.avatarUrl ? <img src={form.avatarUrl} alt={form.name || 'Ícone do agente'} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Camera size={18} />}
                  </button>
                  <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                  <div title="Cor de fundo do ícone" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: 11 }}>
                    <input type="color" value={form.color || '#64748b'} onChange={(event) => update('color', event.target.value)} style={{ width: 30, height: 30, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }} />
                    <span>Cor de fundo</span>
                  </div>
                  <small className="v36-muted">PNG ou JPG, até 2 MB.</small>
                </div>
              </label>
              <label><FieldLabel info="Como o agente se identifica ao falar com o cliente.">Nome</FieldLabel><input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Ex.: Assistente de Atendimento" /></label>
              <label><FieldLabel info="Frase curta que resume o papel do agente. Aparece na lista.">Finalidade</FieldLabel><input value={form.purpose} onChange={(event) => update('purpose', event.target.value)} placeholder="Ex.: Atendimento operacional" /></label>
              <label><FieldLabel info="Instruções de comportamento que o agente segue em toda conversa -- pode ser bem detalhado.">Prompt / contexto</FieldLabel><textarea value={form.prompt} onChange={(event) => update('prompt', event.target.value)} placeholder="Defina como o agente deve orientar, responder e sugerir ações." /></label>
              <label>
                <FieldLabel info="Estilo de comunicação do agente -- ex.: formal, descontraído, técnico.">Tom de voz</FieldLabel>
                <input value={form.voiceTone} onChange={(event) => update('voiceTone', event.target.value)} placeholder="Ex.: Voz feminina e suave, tom simpático e acolhedor." />
              </label>
              <label>
                <FieldLabel info="Voz usada quando o agente responde falando (texto-pra-voz). Sem escolha, usa a voz padrão da plataforma.">Voz do agente</FieldLabel>
                <select value={form.ttsVoice} onChange={(event) => update('ttsVoice', event.target.value)}>
                  {TTS_VOICE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label>
                <FieldLabel info="Situações em que o agente atua. Pode marcar mais de uma.">Fluxos</FieldLabel>
                <div className="v36-checkbox-grid">
                  {FLOW_OPTIONS.map((flow) => (
                    <label key={flow} className="v36-checkbox-item">
                      <input type="checkbox" checked={form.flows.split(',').map((f) => f.trim()).includes(flow)} onChange={() => update('flows', toggleInCommaList(form.flows, flow))} />
                      {flow}
                    </label>
                  ))}
                </div>
              </label>
              <label>
                <FieldLabel info="Conectores que o agente pode consultar. Clique num ícone pra ativar ou desativar o uso dele por este agente.">Conectores</FieldLabel>
                {providers.length === 0 ? (
                  <small className="v36-muted">Nenhum conector ativo no ambiente ainda -- ative em Parametrização &gt; Integrações.</small>
                ) : (
                  <div className="v36-connector-grid">
                    {providers.map((provider) => {
                      const active = form.providers.split(',').map((p) => p.trim()).includes(provider.name);
                      return (
                        <button
                          type="button"
                          key={provider.id}
                          className={`v36-connector-toggle ${active ? 'active' : ''}`}
                          title={provider.name}
                          onClick={() => update('providers', toggleInCommaList(form.providers, provider.name))}
                        >
                          <BrandIcon label={provider.name} domain={providerDomain(provider)} size={26} />
                          <span>{provider.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </label>
            </div>
            <footer>
              <button className="v3464-secondary-btn" onClick={() => setModal(false)}>Cancelar</button>
              <button className="v3464-secondary-btn" disabled={salvando} onClick={() => void save(false)}>{salvando ? 'Salvando...' : 'Salvar'}</button>
              <button className="v3464-primary-btn" disabled={salvando} onClick={() => void save(true)}>{salvando ? 'Salvando...' : 'Salvar e ativar'}</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

export default Agentes;
