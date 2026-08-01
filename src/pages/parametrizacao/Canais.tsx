import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Copy,
  Globe2,
  KeyRound,
  Link2,
  Lock,
  Mail,
  MessageCircle,
  MessagesSquare,
  PhoneCall,
  Plug,
  Plus,
  Radio,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  Webhook,
  X,
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/Badge';
import { normalizeFilterText } from '../../components/SmartFilters';
import { showAppToast } from '../../lib/appToast';

type ChannelStatus = 'Conectado' | 'Disponível' | 'Bloqueado pelo plano' | 'Planejado' | 'Erro';
type ChannelKind = 'Web' | 'Mensageria' | 'E-mail' | 'Interno' | 'Voz';

type ChannelRecord = {
  id: string;
  nome: string;
  codigo: string;
  tipo: ChannelKind;
  descricao: string;
  status: ChannelStatus;
  agentePadrao: string;
  planoMinimo: string;
  suportaAudio: boolean;
  suportaAnexo: boolean;
  suportaTemplate: boolean;
  webhook: string;
  callback: string;
  mensagensMes: number;
  limiteMensagens: number;
  observacao: string;
};

const initialChannels: ChannelRecord[] = [
  {
    id: 'CH-001',
    nome: 'Widget Web',
    codigo: 'widget_web',
    tipo: 'Web',
    descricao: 'Canal contextual embarcado em sistema, portal ou site.',
    status: 'Conectado',
    agentePadrao: 'SUSi',
    planoMinimo: 'Básico',
    suportaAudio: false,
    suportaAnexo: true,
    suportaTemplate: true,
    webhook: 'https://api.radar-sus.local/webhook/widget',
    callback: 'https://cliente.local/callback/widget',
    mensagensMes: 1240,
    limiteMensagens: 10000,
    observacao: 'Recebe contexto estruturado da tela.',
  },
  {
    id: 'CH-002',
    nome: 'WhatsApp',
    codigo: 'whatsapp',
    tipo: 'Mensageria',
    descricao: 'Canal externo para atendimento, confirmação e dúvidas rápidas.',
    status: 'Disponível',
    agentePadrao: 'SUSi',
    planoMinimo: 'Student',
    suportaAudio: true,
    suportaAnexo: true,
    suportaTemplate: true,
    webhook: '',
    callback: '',
    mensagensMes: 0,
    limiteMensagens: 3000,
    observacao: 'Exige provedor e validação de identidade para dados sensíveis.',
  },
  {
    id: 'CH-003',
    nome: 'Discord',
    codigo: 'discord',
    tipo: 'Mensageria',
    descricao: 'Canal para comunidades, times técnicos e operação interna.',
    status: 'Bloqueado pelo plano',
    agentePadrao: 'Biel',
    planoMinimo: 'Pro',
    suportaAudio: false,
    suportaAnexo: true,
    suportaTemplate: false,
    webhook: '',
    callback: '',
    mensagensMes: 0,
    limiteMensagens: 0,
    observacao: 'Disponível a partir do plano Pro.',
  },
  {
    id: 'CH-004',
    nome: 'Voz/Telefone',
    codigo: 'voice_phone',
    tipo: 'Voz',
    descricao: 'Canal futuro para voz, transcrição e atendimento telefônico.',
    status: 'Planejado',
    agentePadrao: '',
    planoMinimo: 'Enterprise',
    suportaAudio: true,
    suportaAnexo: false,
    suportaTemplate: false,
    webhook: '',
    callback: '',
    mensagensMes: 0,
    limiteMensagens: 0,
    observacao: 'Fase futura, fora do MVP.',
  },
];

const channelTypes: ChannelKind[] = ['Web', 'Mensageria', 'E-mail', 'Interno', 'Voz'];
const plans = ['Básico', 'Student', 'Pro', 'Enterprise'];
const agents = ['SUSi', 'Biel', 'Bel', 'Kinho'];

const emptyChannel: ChannelRecord = {
  id: '',
  nome: '',
  codigo: '',
  tipo: 'Mensageria',
  descricao: '',
  status: 'Disponível',
  agentePadrao: '',
  planoMinimo: 'Básico',
  suportaAudio: false,
  suportaAnexo: true,
  suportaTemplate: false,
  webhook: '',
  callback: '',
  mensagensMes: 0,
  limiteMensagens: 1000,
  observacao: '',
};

function channelIcon(tipo: ChannelKind) {
  if (tipo === 'Web') return <Globe2 size={22} />;
  if (tipo === 'E-mail') return <Mail size={22} />;
  if (tipo === 'Interno') return <MessagesSquare size={22} />;
  if (tipo === 'Voz') return <PhoneCall size={22} />;
  return <Smartphone size={22} />;
}

function statusTone(status: ChannelStatus) {
  if (status === 'Conectado') return 'green';
  if (status === 'Disponível') return 'blue';
  if (status === 'Bloqueado pelo plano') return 'orange';
  if (status === 'Erro') return 'red';
  return 'gray';
}

export function Canais() {
  const [channels, setChannels] = useState(initialChannels);
  const [selected, setSelected] = useState<ChannelRecord>(initialChannels[0]);
  const [form, setForm] = useState<ChannelRecord>(emptyChannel);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = normalizeFilterText(query);
    if (!normalized) return channels;

    return channels.filter((channel) => normalizeFilterText([
      channel.nome,
      channel.codigo,
      channel.tipo,
      channel.status,
      channel.agentePadrao,
      channel.planoMinimo,
      channel.descricao,
    ].join(' ')).includes(normalized));
  }, [channels, query]);

  const update = <K extends keyof ChannelRecord>(key: K, value: ChannelRecord[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = () => {
    if (!form.nome.trim()) {
      showAppToast('Informe o nome do canal.', 'warning');
      return;
    }

    const next: ChannelRecord = {
      ...form,
      id: `CH-${String(channels.length + 1).padStart(3, '0')}`,
      codigo: form.codigo || normalizeFilterText(form.nome).split(' ').join('_'),
    };

    setChannels((current) => [next, ...current]);
    setSelected(next);
    setForm(emptyChannel);
    setOpen(false);
    showAppToast('Canal criado em modo de configuração.', 'success');
  };

  const connectChannel = (channel: ChannelRecord) => {
    if (channel.status === 'Bloqueado pelo plano') {
      showAppToast('Canal bloqueado pelo plano atual.', 'warning');
      return;
    }

    if (channel.status === 'Planejado') {
      showAppToast('Canal planejado para fase futura.', 'info');
      return;
    }

    setChannels((current) => current.map((item) => item.id === channel.id ? { ...item, status: 'Conectado' } : item));
    setSelected((current) => current.id === channel.id ? { ...current, status: 'Conectado' } : current);
    showAppToast('Canal conectado em modo simulado.', 'success');
  };

  const copyWebhook = async (text: string) => {
    if (!text) {
      showAppToast('Webhook ainda não configurado.', 'info');
      return;
    }

    await navigator.clipboard.writeText(text);
    showAppToast('Webhook copiado.', 'success');
  };

  return (
    <>
      <PageHeader
        title="Canais"
        action={<button className="primary-small" onClick={() => setOpen(true)}><Plus size={16} /> Novo canal</button>}
      />

      <section className="channel-grid-page">
        <section className="card channel-main-card">
          <div className="section-title-row">
            <div>
              <h3>Canais do ambiente</h3>
              <p className="section-description">Configure canais disponíveis para agentes, atendimento e automações do cliente.</p>
            </div>
            <span className="small-muted">{filtered.length} canais</span>
          </div>

          <div className="smart-search agent-search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar canal, plano, status, agente ou tipo..." />
          </div>

          <div className="channel-card-grid">
            {filtered.map((channel) => (
              <button key={channel.id} className={selected.id === channel.id ? 'active' : ''} onClick={() => setSelected(channel)}>
                <span className="channel-icon">{channelIcon(channel.tipo)}</span>
                <strong>{channel.nome}</strong>
                <small>{channel.descricao}</small>
                <div>
                  <Badge tone={statusTone(channel.status)}>{channel.status}</Badge>
                  <em>{channel.planoMinimo}</em>
                </div>
              </button>
            ))}
          </div>
        </section>

        <aside className="card channel-detail-card">
          <div className="agent-detail-header">
            <div className="channel-icon large">{channelIcon(selected.tipo)}</div>
            <div>
              <h3>{selected.nome}</h3>
              <p>{selected.descricao}</p>
            </div>
            <Badge tone={statusTone(selected.status)}>{selected.status}</Badge>
          </div>

          <div className="agent-detail-actions">
            <button onClick={() => connectChannel(selected)}><Plug size={16} /> Conectar/Testar</button>
            <button onClick={() => copyWebhook(selected.webhook)}><Copy size={16} /> Copiar webhook</button>
          </div>

          <div className="agent-info-grid">
            <div><ShieldCheck size={18} /><strong>Plano mínimo</strong><span>{selected.planoMinimo}</span></div>
            <div><Bot size={18} /><strong>Agente padrão</strong><span>{selected.agentePadrao || 'Não definido'}</span></div>
            <div><Webhook size={18} /><strong>Webhook</strong><span>{selected.webhook || 'Não configurado'}</span></div>
            <div><Link2 size={18} /><strong>Callback</strong><span>{selected.callback || 'Não configurado'}</span></div>
          </div>

          <div className="agent-meter-list">
            <div>
              <span>Mensagens no mês</span>
              <strong>{selected.mensagensMes.toLocaleString('pt-BR')} / {selected.limiteMensagens.toLocaleString('pt-BR')}</strong>
              <i style={{ width: selected.limiteMensagens ? `${Math.min(100, selected.mensagensMes / selected.limiteMensagens * 100)}%` : '0%' }} />
            </div>
          </div>

          <div className="agent-section-block">
            <h4><Settings2 size={18} /> Capacidades</h4>
            <div className="capability-list">
              <span className={selected.suportaAudio ? 'enabled' : ''}><Radio size={16} /> Áudio</span>
              <span className={selected.suportaAnexo ? 'enabled' : ''}><MessageCircle size={16} /> Anexos</span>
              <span className={selected.suportaTemplate ? 'enabled' : ''}><CheckCircle2 size={16} /> Templates</span>
            </div>
          </div>

          {selected.status === 'Bloqueado pelo plano' && (
            <div className="plan-warning">
              <Lock size={18} />
              <div>
                <strong>Canal bloqueado pelo plano atual</strong>
                <span>Este canal será liberado automaticamente quando o cliente contratar um plano compatível.</span>
              </div>
            </div>
          )}

          {selected.status === 'Planejado' && (
            <div className="plan-warning">
              <AlertTriangle size={18} />
              <div>
                <strong>Canal planejado</strong>
                <span>Disponível em fase futura. Mantido no cadastro para visão de roadmap.</span>
              </div>
            </div>
          )}
        </aside>
      </section>

      {open && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="agent-modal">
            <div className="cadastro-modal-header">
              <strong>Novo canal</strong>
              <button className="icon-btn" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>

            <div className="cadastro-modal-content">
              <section className="cadastro-form-section">
                <h3>Identificação</h3>
                <div className="cadastro-form-grid">
                  <label><span>Nome do canal *</span><input value={form.nome} onChange={(event) => update('nome', event.target.value)} placeholder="Ex.: WhatsApp, Widget Web..." /></label>
                  <label><span>Código</span><input value={form.codigo} onChange={(event) => update('codigo', event.target.value)} placeholder="whatsapp, widget_web..." /></label>
                  <label><span>Tipo</span><select value={form.tipo} onChange={(event) => update('tipo', event.target.value as ChannelKind)}>{channelTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label><span>Plano mínimo</span><select value={form.planoMinimo} onChange={(event) => update('planoMinimo', event.target.value)}>{plans.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label className="span-2"><span>Descrição</span><input value={form.descricao} onChange={(event) => update('descricao', event.target.value)} placeholder="Explique como este canal será usado." /></label>
                </div>
              </section>

              <section className="cadastro-form-section">
                <h3>Configuração</h3>
                <div className="cadastro-form-grid">
                  <label><span>Agente padrão</span><select value={form.agentePadrao} onChange={(event) => update('agentePadrao', event.target.value)}><option value="">Selecione</option>{agents.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label><span>Limite de mensagens/mês</span><input type="number" value={form.limiteMensagens} onChange={(event) => update('limiteMensagens', Number(event.target.value))} /></label>
                  <label><span>Webhook</span><input value={form.webhook} onChange={(event) => update('webhook', event.target.value)} placeholder="https://..." /></label>
                  <label><span>Callback</span><input value={form.callback} onChange={(event) => update('callback', event.target.value)} placeholder="https://..." /></label>
                  <label className="span-2"><span>Observação</span><input value={form.observacao} onChange={(event) => update('observacao', event.target.value)} placeholder="Regras, dependências ou restrições." /></label>
                </div>

                <div className="capability-config">
                  <label><input type="checkbox" checked={form.suportaAudio} onChange={() => update('suportaAudio', !form.suportaAudio)} /> Suporta áudio</label>
                  <label><input type="checkbox" checked={form.suportaAnexo} onChange={() => update('suportaAnexo', !form.suportaAnexo)} /> Suporta anexos</label>
                  <label><input type="checkbox" checked={form.suportaTemplate} onChange={() => update('suportaTemplate', !form.suportaTemplate)} /> Suporta templates</label>
                </div>
              </section>
            </div>

            <div className="cadastro-modal-footer">
              <button onClick={() => setOpen(false)}>Cancelar</button>
              <button className="primary" onClick={save}>Salvar canal</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Canais;
