import { useMemo, useState } from 'react';
import { Bot, Clock, Edit3, MessageCircle, Plus, Search, Settings2, Trash2, Workflow, X } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/Badge';
import { normalizeFilterText } from '../../components/SmartFilters';
import { showAppToast } from '../../lib/appToast';
import { showAppConfirm } from '../../lib/appConfirm';

type ChannelStatus = 'Ativo' | 'Pausado' | 'Em configuração';
type ServiceChannel = { id: string; nome: string; tipo: string; integracao: string; agente: string; fluxo: string; fila: string; sla: string; status: ChannelStatus; descricao: string; };

const integrations = ['Widget Web nativo', 'WhatsApp Business', 'E-mail', 'Discord', 'Telegram', 'Microsoft Teams', 'API personalizada'];
const agents = ['SUSi', 'Biel', 'Bel', 'Kinho'];
const flows = ['Fluxo de atendimento padrão', 'Fluxo de triagem', 'Fluxo de comunidade', 'Fluxo de API guiada'];
const initialChannels: ServiceChannel[] = [
  { id: 'CAN-001', nome: 'Atendimento via Widget', tipo: 'Canal nativo', integracao: 'Widget Web nativo', agente: 'SUSi', fluxo: 'Fluxo de atendimento padrão', fila: 'Suporte', sla: '4h', status: 'Ativo', descricao: 'Canal operacional usado dentro do produto ou portal.' },
  { id: 'CAN-002', nome: 'Atendimento via WhatsApp', tipo: 'Mensageria', integracao: 'WhatsApp Business', agente: 'SUSi', fluxo: 'Fluxo de atendimento padrão', fila: 'Atendimento', sla: '4h', status: 'Em configuração', descricao: 'Canal operacional que usa integração WhatsApp para entrada e saída de mensagens.' },
  { id: 'CAN-003', nome: 'Monitoramento de comunidade', tipo: 'Comunidade', integracao: 'Discord', agente: 'Biel', fluxo: 'Fluxo de comunidade', fila: 'Produto', sla: '8h', status: 'Pausado', descricao: 'Canal para monitorar comunidades, dúvidas e sinais de produto.' },
];
const empty: ServiceChannel = { id: '', nome: '', tipo: 'Mensageria', integracao: 'WhatsApp Business', agente: 'SUSi', fluxo: 'Fluxo de atendimento padrão', fila: '', sla: '4h', status: 'Em configuração', descricao: '' };
function statusTone(status: ChannelStatus) { return status === 'Ativo' ? 'green' : status === 'Pausado' ? 'blue' : 'orange'; }

export function Canais() {
  const [items, setItems] = useState(initialChannels);
  const [selected, setSelected] = useState(initialChannels[0]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ServiceChannel>(empty);

  const filtered = useMemo(() => { const q = normalizeFilterText(query); return !q ? items : items.filter((item) => normalizeFilterText(Object.values(item).join(' ')).includes(q)); }, [items, query]);
  const update = <K extends keyof ServiceChannel>(key: K, value: ServiceChannel[K]) => setForm((current) => ({ ...current, [key]: value }));
  const save = () => { if (!form.nome.trim()) { showAppToast('Informe o nome do canal.', 'warning'); return; } const next = { ...form, id: `CAN-${String(items.length + 1).padStart(3, '0')}` }; setItems((current) => [next, ...current]); setSelected(next); setOpen(false); setForm(empty); showAppToast('Canal de atendimento criado.', 'success'); };
  const remove = (item: ServiceChannel) => showAppConfirm({ title: 'Excluir canal', description: `Excluir o canal "${item.nome}"?`, confirmLabel: 'Excluir canal', tone: 'danger', onConfirm: () => { setItems((current) => current.filter((channel) => channel.id !== item.id)); showAppToast('Canal excluído.', 'info'); } });

  return <><PageHeader title="Canais de Atendimento" action={<button className="primary-small" onClick={() => setOpen(true)}><Plus size={16} /> Novo canal</button>} />
  <section className="channel-grid-page"><section className="card channel-main-card"><div className="section-title-row"><div><h3>Canais operacionais</h3><p className="section-description">Um canal representa o uso operacional de uma integração, agente, fluxo, fila e SLA.</p></div><span className="small-muted">{filtered.length} canais</span></div><div className="smart-search agent-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar canal, integração, agente, fluxo ou fila..." /></div><div className="channel-card-grid operational">{filtered.map((item) => <button key={item.id} className={selected.id === item.id ? 'active' : ''} onClick={() => setSelected(item)}><span className="channel-icon"><MessageCircle size={22} /></span><strong>{item.nome}</strong><small>{item.descricao}</small><div><Badge tone={statusTone(item.status)}>{item.status}</Badge><em>{item.integracao}</em></div></button>)}</div></section><aside className="card channel-detail-card"><div className="agent-detail-header"><div className="channel-icon large"><MessageCircle size={26} /></div><div><h3>{selected.nome}</h3><p>{selected.descricao}</p></div><Badge tone={statusTone(selected.status)}>{selected.status}</Badge></div><div className="agent-detail-actions"><button onClick={() => showAppToast('Configuração será ligada ao backend.', 'info')}><Settings2 size={16} /> Configurar</button><button onClick={() => remove(selected)}><Trash2 size={16} /> Excluir</button></div><div className="agent-info-grid"><div><Workflow size={18} /><strong>Integração usada</strong><span>{selected.integracao}</span></div><div><Bot size={18} /><strong>Agente padrão</strong><span>{selected.agente}</span></div><div><Workflow size={18} /><strong>Fluxo</strong><span>{selected.fluxo}</span></div><div><Clock size={18} /><strong>SLA</strong><span>{selected.sla}</span></div></div><div className="agent-section-block"><h4><Workflow size={18} /> Fluxo dentro da Central</h4><p className="agent-context-text">Atendimento → acionar agente → executar fluxo → sugerir resposta/alerta/tarefa/conhecimento → registrar log → continuar atendimento.</p></div></aside></section>
  {open && <div className="modal-backdrop cadastro-modal-backdrop"><div className="agent-modal"><div className="cadastro-modal-header"><strong>Novo canal de atendimento</strong><button className="icon-btn" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="cadastro-modal-content"><section className="cadastro-form-section"><h3>Canal operacional</h3><div className="cadastro-form-grid"><label><span>Nome *</span><input value={form.nome} onChange={(event) => update('nome', event.target.value)} placeholder="Ex.: Atendimento via WhatsApp" /></label><label><span>Tipo</span><input value={form.tipo} onChange={(event) => update('tipo', event.target.value)} /></label><label><span>Integração usada</span><select value={form.integracao} onChange={(event) => update('integracao', event.target.value)}>{integrations.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Agente padrão</span><select value={form.agente} onChange={(event) => update('agente', event.target.value)}>{agents.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Fluxo</span><select value={form.fluxo} onChange={(event) => update('fluxo', event.target.value)}>{flows.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Fila</span><input value={form.fila} onChange={(event) => update('fila', event.target.value)} placeholder="Ex.: Suporte" /></label><label><span>SLA</span><input value={form.sla} onChange={(event) => update('sla', event.target.value)} /></label><label className="span-2"><span>Descrição</span><input value={form.descricao} onChange={(event) => update('descricao', event.target.value)} /></label></div></section></div><div className="cadastro-modal-footer"><button onClick={() => setOpen(false)}>Cancelar</button><button className="primary" onClick={save}>Salvar canal</button></div></div></div>}</>;
}

export default Canais;
