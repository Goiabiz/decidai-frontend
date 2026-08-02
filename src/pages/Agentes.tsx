import { useMemo, useState } from 'react';
import { Bot, CheckCircle2, Clock, Edit3, FileText, GitBranch, MessageSquareText, PlayCircle, Plus, Search, Sparkles, Trash2, Workflow, X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { normalizeFilterText } from '../components/SmartFilters';
import { showAppToast } from '../lib/appToast';
import { showAppConfirm } from '../lib/appConfirm';

type AgentStatus = 'Ativo' | 'Pausado' | 'Em configuração';
type AutonomyLevel = 'Responde e orienta' | 'Sugere ações' | 'Cria rascunhos' | 'Executa ações permitidas' | 'Executa com aprovação';

type AgentRecord = {
  id: string;
  nome: string;
  papel: string;
  descricao: string;
  status: AgentStatus;
  tomVoz: string;
  saudacao: string;
  promptContexto: string;
  autonomia: AutonomyLevel;
  fluxos: string[];
  pontosUso: string[];
  exigeAprovacao: boolean;
  horario: string;
  limiteTokens: number;
  limiteExecucoes: number;
  tokensHoje: number;
  execucoesHoje: number;
};

const agentRoles = ['Atendimento', 'Suporte', 'Operacional', 'Comercial', 'Construtor inicial', 'Radar/Monitoramento'];
const flowOptions = ['Fluxo de atendimento padrão', 'Fluxo de triagem', 'Fluxo de geração de alerta', 'Fluxo de criação de tarefa', 'Fluxo de onboarding inicial', 'Fluxo de API guiada'];
const usePoints = ['Central de Atendimento', 'Canais de Atendimento', 'Widget Web', 'Integrações', 'Campos/Telas', 'Alertas'];

const initialAgents: AgentRecord[] = [
  {
    id: 'AGT-001',
    nome: 'SUSi',
    papel: 'Atendimento',
    descricao: 'Agente operacional para apoiar atendimento, triagem e sugestão de ações dentro da Central.',
    status: 'Ativo',
    tomVoz: 'Claro, acolhedor e objetivo',
    saudacao: 'Olá, eu sou a SUSi. Como posso ajudar?',
    promptContexto: 'Atue como agente de atendimento. Use o contexto da tela, o fluxo do canal e o histórico do atendimento antes de sugerir qualquer ação.',
    autonomia: 'Sugere ações',
    fluxos: ['Fluxo de atendimento padrão', 'Fluxo de geração de alerta'],
    pontosUso: ['Central de Atendimento', 'Canais de Atendimento', 'Alertas'],
    exigeAprovacao: true,
    horario: 'Segunda a sexta, 08:00 às 18:00',
    limiteTokens: 120000,
    limiteExecucoes: 3000,
    tokensHoje: 16420,
    execucoesHoje: 148,
  },
  {
    id: 'AGT-002',
    nome: 'Biel',
    papel: 'Construtor inicial',
    descricao: 'Agente para onboarding, criação assistida de campos, telas, fluxos e conexões guiadas.',
    status: 'Em configuração',
    tomVoz: 'Técnico, direto e analítico',
    saudacao: 'Vamos montar a estrutura inicial do seu produto.',
    promptContexto: 'Conduza perguntas de onboarding, identifique mercado, sugira modelos e crie rascunhos para aprovação do usuário.',
    autonomia: 'Cria rascunhos',
    fluxos: ['Fluxo de onboarding inicial', 'Fluxo de API guiada'],
    pontosUso: ['Campos/Telas', 'Integrações'],
    exigeAprovacao: true,
    horario: 'Sob demanda',
    limiteTokens: 300000,
    limiteExecucoes: 8000,
    tokensHoje: 28700,
    execucoesHoje: 31,
  },
];

const emptyAgent: AgentRecord = {
  id: '', nome: '', papel: 'Atendimento', descricao: '', status: 'Em configuração', tomVoz: '', saudacao: '', promptContexto: '', autonomia: 'Responde e orienta', fluxos: [], pontosUso: [], exigeAprovacao: true, horario: '', limiteTokens: 50000, limiteExecucoes: 1000, tokensHoje: 0, execucoesHoje: 0,
};

function toggle(value: string, list: string[]) { return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]; }
function statusTone(status: AgentStatus) { return status === 'Ativo' ? 'green' : status === 'Pausado' ? 'blue' : 'orange'; }

export function Agentes() {
  const [agents, setAgents] = useState(initialAgents);
  const [selected, setSelected] = useState<AgentRecord>(initialAgents[0]);
  const [form, setForm] = useState<AgentRecord>(emptyAgent);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalizeFilterText(query);
    if (!q) return agents;
    return agents.filter((agent) => normalizeFilterText([agent.nome, agent.papel, agent.descricao, agent.fluxos.join(' '), agent.pontosUso.join(' ')].join(' ')).includes(q));
  }, [agents, query]);

  const update = <K extends keyof AgentRecord>(key: K, value: AgentRecord[K]) => setForm((current) => ({ ...current, [key]: value }));

  const save = () => {
    if (!form.nome.trim()) { showAppToast('Informe o nome do agente.', 'warning'); return; }
    const next = { ...form, id: `AGT-${String(agents.length + 1).padStart(3, '0')}`, saudacao: form.saudacao || `Olá, eu sou ${form.nome}. Como posso ajudar?` };
    setAgents((current) => [next, ...current]);
    setSelected(next);
    setOpen(false);
    setForm(emptyAgent);
    showAppToast('Agente criado para configuração.', 'success');
  };

  const remove = (agent: AgentRecord) => {
    showAppConfirm({ title: 'Excluir agente', description: `Excluir o agente "${agent.nome}"?`, confirmLabel: 'Excluir agente', tone: 'danger', onConfirm: () => { setAgents((current) => current.filter((item) => item.id !== agent.id)); showAppToast('Agente excluído.', 'info'); } });
  };

  return (
    <>
      <PageHeader title="Agentes" action={<button className="primary-small" onClick={() => setOpen(true)}><Plus size={16} /> Novo agente</button>} />

      <section className="agent-grid-page refined">
        <section className="card agent-main-card">
          <div className="section-title-row"><div><h3>Agentes configurados</h3><p className="section-description">Identidade, prompt, fluxos e pontos de uso do agente dentro da operação do cliente.</p></div><span className="small-muted">{filtered.length} agentes</span></div>
          <div className="smart-search agent-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar agente, papel, fluxo ou ponto de uso..." /></div>
          <div className="agent-card-list">{filtered.map((agent) => <button key={agent.id} className={selected.id === agent.id ? 'active' : ''} onClick={() => setSelected(agent)}><span className="agent-avatar"><Bot size={22} /></span><span><strong>{agent.nome}</strong><small>{agent.papel} • {agent.descricao}</small><em>{agent.fluxos.length} fluxos • {agent.pontosUso.length} pontos de uso</em></span><Badge tone={statusTone(agent.status)}>{agent.status}</Badge></button>)}</div>
        </section>

        <aside className="card agent-detail-card">
          <div className="agent-detail-header"><div className="agent-avatar large"><Bot size={28} /></div><div><h3>{selected.nome}</h3><p>{selected.descricao}</p></div><Badge tone={statusTone(selected.status)}>{selected.status}</Badge></div>
          <div className="agent-detail-actions"><button onClick={() => showAppToast(`Teste iniciado para ${selected.nome}.`, 'success')}><PlayCircle size={16} /> Testar</button><button onClick={() => showAppToast('Edição completa será ligada ao backend na próxima etapa.', 'info')}><Edit3 size={16} /> Editar</button><button onClick={() => remove(selected)}><Trash2 size={16} /> Excluir</button></div>
          <div className="agent-info-grid"><div><Sparkles size={18} /><strong>Papel</strong><span>{selected.papel}</span></div><div><Workflow size={18} /><strong>Autonomia</strong><span>{selected.autonomia}</span></div><div><Clock size={18} /><strong>Horário</strong><span>{selected.horario || 'Sob demanda'}</span></div><div><CheckCircle2 size={18} /><strong>Aprovação</strong><span>{selected.exigeAprovacao ? 'Exige aprovação humana' : 'Executa ações permitidas'}</span></div></div>
          <div className="agent-section-block"><h4><FileText size={18} /> Prompt / contexto</h4><p className="agent-context-text">{selected.promptContexto}</p></div>
          <div className="agent-section-block"><h4><GitBranch size={18} /> Fluxos vinculados</h4><div className="chip-list">{selected.fluxos.map((item) => <span key={item}>{item}</span>)}</div></div>
          <div className="agent-section-block"><h4><MessageSquareText size={18} /> Pontos de uso</h4><div className="chip-list">{selected.pontosUso.map((item) => <span key={item}>{item}</span>)}</div></div>
          <div className="agent-meter-list"><div><span>Tokens hoje</span><strong>{selected.tokensHoje.toLocaleString('pt-BR')} / {selected.limiteTokens.toLocaleString('pt-BR')}</strong><i style={{ width: `${Math.min(100, selected.tokensHoje / selected.limiteTokens * 100)}%` }} /></div><div><span>Execuções hoje</span><strong>{selected.execucoesHoje.toLocaleString('pt-BR')} / {selected.limiteExecucoes.toLocaleString('pt-BR')}</strong><i style={{ width: `${Math.min(100, selected.execucoesHoje / selected.limiteExecucoes * 100)}%` }} /></div></div>
        </aside>
      </section>

      {open && <div className="modal-backdrop cadastro-modal-backdrop"><div className="agent-modal"><div className="cadastro-modal-header"><strong>Novo agente</strong><button className="icon-btn" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="cadastro-modal-content"><section className="cadastro-form-section"><h3>Identidade e prompt</h3><div className="cadastro-form-grid"><label><span>Nome *</span><input value={form.nome} onChange={(event) => update('nome', event.target.value)} /></label><label><span>Papel</span><select value={form.papel} onChange={(event) => update('papel', event.target.value)}>{agentRoles.map((item) => <option key={item}>{item}</option>)}</select></label><label className="span-2"><span>Descrição</span><input value={form.descricao} onChange={(event) => update('descricao', event.target.value)} /></label><label><span>Tom de voz</span><input value={form.tomVoz} onChange={(event) => update('tomVoz', event.target.value)} /></label><label><span>Autonomia</span><select value={form.autonomia} onChange={(event) => update('autonomia', event.target.value as AutonomyLevel)}><option>Responde e orienta</option><option>Sugere ações</option><option>Cria rascunhos</option><option>Executa ações permitidas</option><option>Executa com aprovação</option></select></label><label className="span-2"><span>Prompt / contexto base</span><textarea value={form.promptContexto} onChange={(event) => update('promptContexto', event.target.value)} placeholder="Descreva o comportamento base do agente neste ambiente." /></label></div></section><section className="cadastro-form-section"><h3>Fluxos e uso operacional</h3><div className="option-columns two"><div><strong>Fluxos vinculados</strong>{flowOptions.map((item) => <label key={item}><input type="checkbox" checked={form.fluxos.includes(item)} onChange={() => update('fluxos', toggle(item, form.fluxos))} /> {item}</label>)}</div><div><strong>Pontos de uso</strong>{usePoints.map((item) => <label key={item}><input type="checkbox" checked={form.pontosUso.includes(item)} onChange={() => update('pontosUso', toggle(item, form.pontosUso))} /> {item}</label>)}</div></div></section><section className="cadastro-form-section"><h3>Limites</h3><div className="cadastro-form-grid"><label><span>Limite de tokens</span><input type="number" value={form.limiteTokens} onChange={(event) => update('limiteTokens', Number(event.target.value))} /></label><label><span>Limite de execuções</span><input type="number" value={form.limiteExecucoes} onChange={(event) => update('limiteExecucoes', Number(event.target.value))} /></label><label><span>Horário</span><input value={form.horario} onChange={(event) => update('horario', event.target.value)} /></label><label className="inline-check"><input type="checkbox" checked={form.exigeAprovacao} onChange={(event) => update('exigeAprovacao', event.target.checked)} /> Exige aprovação humana</label></div></section></div><div className="cadastro-modal-footer"><button onClick={() => setOpen(false)}>Cancelar</button><button className="primary" onClick={save}>Salvar agente</button></div></div></div>}
    </>
  );
}

export default Agentes;
