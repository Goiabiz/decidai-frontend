import { useMemo, useState } from 'react';
import {
  Activity,
  Bot,
  Brain,
  CheckCircle2,
  Clock,
  Database,
  Edit3,
  KeyRound,
  MessageCircle,
  PlayCircle,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { normalizeFilterText } from '../components/SmartFilters';
import { showAppToast } from '../lib/appToast';

type AgentStatus = 'Ativo' | 'Pausado' | 'Em configuração';
type AutonomyLevel = 'Responde e orienta' | 'Sugere ações' | 'Cria rascunhos' | 'Executa ações permitidas' | 'Executa com aprovação';

type AgentRecord = {
  id: string;
  nome: string;
  modelo: string;
  descricao: string;
  status: AgentStatus;
  tomVoz: string;
  saudacao: string;
  assinatura: string;
  autonomia: AutonomyLevel;
  canais: string[];
  bases: string[];
  modulos: string[];
  acoes: string[];
  exigeAprovacao: boolean;
  horario: string;
  limiteTokens: number;
  limiteExecucoes: number;
  execucoesHoje: number;
  tokensHoje: number;
  responsavel: string;
};

const agentModels = [
  'Atendimento',
  'Suporte',
  'Produto',
  'Operacional',
  'Comercial',
  'Construtor de Modelos',
  'Radar/Monitoramento',
];

const channelOptions = ['Widget Web', 'WhatsApp', 'E-mail', 'SMS', 'Telegram', 'Teams', 'Discord', 'Chat interno'];
const knowledgeOptions = ['Base do Cliente', 'Base do Produto', 'Modelos por Mercado', 'Documentos conectados'];
const moduleOptions = ['Base de Conhecimento', 'Atendimentos', 'Alertas', 'Serviços', 'Telas', 'Campos', 'Roadmap'];
const actionOptions = ['Consultar base', 'Sugerir alerta', 'Gerar tarefa', 'Criar rascunho', 'Responder usuário', 'Transferir para humano'];

const initialAgents: AgentRecord[] = [
  {
    id: 'AGT-001',
    nome: 'SUSi',
    modelo: 'Atendimento',
    descricao: 'Agente de atendimento contextual do ConectaSUS.',
    status: 'Ativo',
    tomVoz: 'Claro, acolhedor e objetivo',
    saudacao: 'Olá, eu sou a SUSi. Como posso ajudar?',
    assinatura: 'SUSi — Assistente Virtual ConectaSUS',
    autonomia: 'Sugere ações',
    canais: ['Widget Web', 'WhatsApp'],
    bases: ['Base do Cliente', 'Base do Produto'],
    modulos: ['Base de Conhecimento', 'Atendimentos', 'Alertas'],
    acoes: ['Consultar base', 'Sugerir alerta', 'Gerar tarefa', 'Responder usuário'],
    exigeAprovacao: true,
    horario: 'Segunda a sexta, 08:00 às 18:00',
    limiteTokens: 120000,
    limiteExecucoes: 3000,
    execucoesHoje: 148,
    tokensHoje: 16420,
    responsavel: 'Produto',
  },
  {
    id: 'AGT-002',
    nome: 'Biel',
    modelo: 'Construtor de Modelos',
    descricao: 'Agente interno para simular cenários, sugerir telas e alimentar modelos do produto.',
    status: 'Em configuração',
    tomVoz: 'Técnico, direto e analítico',
    saudacao: 'Vamos montar o melhor modelo para esse cenário.',
    assinatura: 'Biel — Agente Construtor',
    autonomia: 'Cria rascunhos',
    canais: ['Chat interno'],
    bases: ['Base do Produto', 'Modelos por Mercado'],
    modulos: ['Telas', 'Campos', 'Base de Conhecimento', 'Roadmap'],
    acoes: ['Consultar base', 'Criar rascunho', 'Gerar tarefa'],
    exigeAprovacao: true,
    horario: 'Uso interno',
    limiteTokens: 300000,
    limiteExecucoes: 8000,
    execucoesHoje: 31,
    tokensHoje: 28700,
    responsavel: 'Produto',
  },
];

const emptyAgent: AgentRecord = {
  id: '',
  nome: '',
  modelo: 'Atendimento',
  descricao: '',
  status: 'Em configuração',
  tomVoz: '',
  saudacao: '',
  assinatura: '',
  autonomia: 'Responde e orienta',
  canais: [],
  bases: [],
  modulos: [],
  acoes: [],
  exigeAprovacao: true,
  horario: '',
  limiteTokens: 50000,
  limiteExecucoes: 1000,
  execucoesHoje: 0,
  tokensHoje: 0,
  responsavel: '',
};

function toggleList(value: string, list: string[]) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function statusTone(status: AgentStatus) {
  if (status === 'Ativo') return 'green';
  if (status === 'Pausado') return 'blue';
  return 'orange';
}

export function Agentes() {
  const [agents, setAgents] = useState(initialAgents);
  const [selected, setSelected] = useState<AgentRecord>(initialAgents[0]);
  const [form, setForm] = useState<AgentRecord>(emptyAgent);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = normalizeFilterText(query);
    if (!normalized) return agents;

    return agents.filter((agent) => normalizeFilterText([
      agent.nome,
      agent.modelo,
      agent.descricao,
      agent.status,
      agent.canais.join(' '),
      agent.bases.join(' '),
      agent.modulos.join(' '),
      agent.acoes.join(' '),
    ].join(' ')).includes(normalized));
  }, [agents, query]);

  const update = <K extends keyof AgentRecord>(key: K, value: AgentRecord[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = () => {
    if (!form.nome.trim()) {
      showAppToast('Informe o nome do agente.', 'warning');
      return;
    }

    const next: AgentRecord = {
      ...form,
      id: `AGT-${String(agents.length + 1).padStart(3, '0')}`,
      assinatura: form.assinatura || `${form.nome} — Agente IA`,
      saudacao: form.saudacao || `Olá, eu sou ${form.nome}. Como posso ajudar?`,
    };

    setAgents((current) => [next, ...current]);
    setSelected(next);
    setForm(emptyAgent);
    setOpen(false);
    showAppToast('Agente criado em modo de configuração.', 'success');
  };

  const remove = (id: string) => {
    const item = agents.find((agent) => agent.id === id);
    if (!window.confirm(`Excluir o agente "${item?.nome || id}"?`)) return;

    setAgents((current) => current.filter((agent) => agent.id !== id));
    if (selected.id === id) setSelected(agents.find((agent) => agent.id !== id) || initialAgents[0]);
    showAppToast('Agente excluído.', 'info');
  };

  const testAgent = (agent: AgentRecord) => {
    showAppToast(`Teste iniciado para ${agent.nome}.`, 'success');
  };

  return (
    <>
      <PageHeader
        title="Agentes"
        action={<button className="primary-small" onClick={() => setOpen(true)}><Plus size={16} /> Novo agente</button>}
      />

      <section className="agent-grid-page">
        <section className="card agent-main-card">
          <div className="section-title-row">
            <div>
              <h3>Agentes configurados</h3>
              <p className="section-description">Configure identidade, canais, base permitida, ações e autonomia do agente do cliente.</p>
            </div>
            <span className="small-muted">{filtered.length} agentes</span>
          </div>

          <div className="smart-search agent-search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar agente, modelo, canal, base ou ação..." />
          </div>

          <div className="agent-card-list">
            {filtered.map((agent) => (
              <button key={agent.id} className={selected.id === agent.id ? 'active' : ''} onClick={() => setSelected(agent)}>
                <span className="agent-avatar"><Bot size={22} /></span>
                <span>
                  <strong>{agent.nome}</strong>
                  <small>{agent.modelo} • {agent.descricao}</small>
                  <em>{agent.canais.length} canais • {agent.acoes.length} ações • {agent.bases.length} bases</em>
                </span>
                <Badge tone={statusTone(agent.status)}>{agent.status}</Badge>
              </button>
            ))}
          </div>
        </section>

        <aside className="card agent-detail-card">
          <div className="agent-detail-header">
            <div className="agent-avatar large"><Bot size={28} /></div>
            <div>
              <h3>{selected.nome}</h3>
              <p>{selected.assinatura}</p>
            </div>
            <Badge tone={statusTone(selected.status)}>{selected.status}</Badge>
          </div>

          <div className="agent-detail-actions">
            <button onClick={() => testAgent(selected)}><PlayCircle size={16} /> Testar agente</button>
            <button onClick={() => showAppToast('Edição será ligada ao backend na próxima etapa.', 'info')}><Edit3 size={16} /> Editar</button>
            <button onClick={() => remove(selected.id)}><Trash2 size={16} /> Excluir</button>
          </div>

          <div className="agent-info-grid">
            <div><Sparkles size={18} /><strong>Modelo</strong><span>{selected.modelo}</span></div>
            <div><SlidersHorizontal size={18} /><strong>Autonomia</strong><span>{selected.autonomia}</span></div>
            <div><ShieldCheck size={18} /><strong>Aprovação</strong><span>{selected.exigeAprovacao ? 'Exige aprovação humana' : 'Pode executar ações permitidas'}</span></div>
            <div><Clock size={18} /><strong>Horário</strong><span>{selected.horario || 'Não definido'}</span></div>
          </div>

          <div className="agent-meter-list">
            <div>
              <span>Tokens hoje</span>
              <strong>{selected.tokensHoje.toLocaleString('pt-BR')} / {selected.limiteTokens.toLocaleString('pt-BR')}</strong>
              <i style={{ width: `${Math.min(100, selected.tokensHoje / selected.limiteTokens * 100)}%` }} />
            </div>
            <div>
              <span>Execuções hoje</span>
              <strong>{selected.execucoesHoje.toLocaleString('pt-BR')} / {selected.limiteExecucoes.toLocaleString('pt-BR')}</strong>
              <i style={{ width: `${Math.min(100, selected.execucoesHoje / selected.limiteExecucoes * 100)}%` }} />
            </div>
          </div>

          <div className="agent-section-block">
            <h4><MessageCircle size={18} /> Canais</h4>
            <div className="chip-list">{selected.canais.map((item) => <span key={item}>{item}</span>)}</div>
          </div>

          <div className="agent-section-block">
            <h4><Database size={18} /> Bases autorizadas</h4>
            <div className="chip-list">{selected.bases.map((item) => <span key={item}>{item}</span>)}</div>
          </div>

          <div className="agent-section-block">
            <h4><KeyRound size={18} /> Ações permitidas</h4>
            <div className="chip-list">{selected.acoes.map((item) => <span key={item}>{item}</span>)}</div>
          </div>
        </aside>
      </section>

      {open && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="agent-modal">
            <div className="cadastro-modal-header">
              <strong>Novo agente</strong>
              <button className="icon-btn" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>

            <div className="cadastro-modal-content">
              <section className="cadastro-form-section">
                <h3>Identidade</h3>
                <div className="cadastro-form-grid">
                  <label><span>Nome do agente *</span><input value={form.nome} onChange={(event) => update('nome', event.target.value)} placeholder="Ex.: SUSi, Nina, Biel..." /></label>
                  <label><span>Modelo</span><select value={form.modelo} onChange={(event) => update('modelo', event.target.value)}>{agentModels.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label className="span-2"><span>Descrição</span><input value={form.descricao} onChange={(event) => update('descricao', event.target.value)} placeholder="Explique onde esse agente atua." /></label>
                  <label><span>Tom de voz</span><input value={form.tomVoz} onChange={(event) => update('tomVoz', event.target.value)} placeholder="Ex.: claro, acolhedor e objetivo" /></label>
                  <label><span>Autonomia</span><select value={form.autonomia} onChange={(event) => update('autonomia', event.target.value as AutonomyLevel)}>
                    <option>Responde e orienta</option>
                    <option>Sugere ações</option>
                    <option>Cria rascunhos</option>
                    <option>Executa ações permitidas</option>
                    <option>Executa com aprovação</option>
                  </select></label>
                  <label className="span-2"><span>Saudação</span><input value={form.saudacao} onChange={(event) => update('saudacao', event.target.value)} placeholder="Olá, eu sou..." /></label>
                </div>
              </section>

              <section className="cadastro-form-section">
                <h3>Permissões e escopo</h3>
                <div className="option-columns">
                  <div><strong>Canais</strong>{channelOptions.map((item) => <label key={item}><input type="checkbox" checked={form.canais.includes(item)} onChange={() => update('canais', toggleList(item, form.canais))} /> {item}</label>)}</div>
                  <div><strong>Bases</strong>{knowledgeOptions.map((item) => <label key={item}><input type="checkbox" checked={form.bases.includes(item)} onChange={() => update('bases', toggleList(item, form.bases))} /> {item}</label>)}</div>
                  <div><strong>Módulos</strong>{moduleOptions.map((item) => <label key={item}><input type="checkbox" checked={form.modulos.includes(item)} onChange={() => update('modulos', toggleList(item, form.modulos))} /> {item}</label>)}</div>
                  <div><strong>Ações</strong>{actionOptions.map((item) => <label key={item}><input type="checkbox" checked={form.acoes.includes(item)} onChange={() => update('acoes', toggleList(item, form.acoes))} /> {item}</label>)}</div>
                </div>
              </section>

              <section className="cadastro-form-section">
                <h3>Limites</h3>
                <div className="cadastro-form-grid">
                  <label><span>Limite de tokens</span><input type="number" value={form.limiteTokens} onChange={(event) => update('limiteTokens', Number(event.target.value))} /></label>
                  <label><span>Limite de execuções</span><input type="number" value={form.limiteExecucoes} onChange={(event) => update('limiteExecucoes', Number(event.target.value))} /></label>
                  <label><span>Horário de atendimento</span><input value={form.horario} onChange={(event) => update('horario', event.target.value)} placeholder="Ex.: Segunda a sexta, 08:00 às 18:00" /></label>
                  <label><span>Responsável</span><input value={form.responsavel} onChange={(event) => update('responsavel', event.target.value)} placeholder="Produto, Suporte..." /></label>
                </div>
              </section>
            </div>

            <div className="cadastro-modal-footer">
              <button onClick={() => setOpen(false)}>Cancelar</button>
              <button className="primary" onClick={save}>Salvar agente</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Agentes;
