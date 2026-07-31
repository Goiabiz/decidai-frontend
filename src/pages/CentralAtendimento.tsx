import { useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  FilePlus2,
  Mail,
  Maximize2,
  MessageCircle,
  Paperclip,
  Phone,
  PlusCircle,
  Send,
  Sparkles,
  Ticket,
  Workflow
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { CollapsibleKpiSection } from '../components/CollapsibleKpiSection';
import { Badge } from '../components/Badge';
import { DataSourceNotice } from '../components/DataSourceNotice';
import { useAsyncData } from '../hooks/useAsyncData';
import { fetchAtendimentos } from '../services/radarApi';
import { atendimentos as mockAtendimentos } from '../data/mock';
import type { PageProps } from '../App';

type OrigemTipo = 'WhatsApp' | 'E-mail' | 'API' | 'Ticket externo' | 'Portal' | 'Telefone';

type AtendimentoChat = {
  id: string;
  canal: OrigemTipo;
  origem: string;
  cliente: string;
  assunto: string;
  resumo: string;
  prioridade: string;
  status: string;
  responsavel: string;
  fila: string;
  recebidoEm: string;
  ultimaInteracao: string;
  naoLidas: number;
  slaResposta: string;
  slaResolucao: string;
  anexos: number;
  vinculados: number;
  origemDados: Array<{ label: string; value: string | number }>;
  mensagens: Array<{
    tipo: 'entrada' | 'saida' | 'interno' | 'sistema';
    autor: string;
    texto: string;
    data: string;
  }>;
};

const origemIcon = {
  WhatsApp: MessageCircle,
  'E-mail': Mail,
  API: Workflow,
  'Ticket externo': Ticket,
  Portal: FilePlus2,
  Telefone: Phone
} satisfies Record<OrigemTipo, typeof MessageCircle>;

const statusOptions = ['Novo', 'Em andamento', 'Aguardando resposta', 'ConcluÃ­do', 'Cancelado'];
const prioridadeOptions = ['Baixa', 'MÃ©dia', 'Alta', 'CrÃ­tica'];
const responsaveis = ['Moises Mattos', 'Bruno Oliveira', 'Juliana Costa', 'Mariana Lima'];

const atendimentoSeed: AtendimentoChat[] = [
  {
    id: 'ATD-20260720-0001',
    canal: 'Portal',
    origem: 'Liliane Maria Bolla Polonio',
    cliente: 'Barra Bonita - Conectasus',
    assunto: 'Consulta nÃ£o encontrada no histÃ³rico',
    resumo: 'Paciente passou por consulta e nÃ£o aparece no histÃ³rico do atendimento mÃ©dico.',
    prioridade: 'Alta',
    status: 'Em andamento',
    responsavel: 'Moises Mattos',
    fila: 'Atendimento NÃ­vel 1',
    recebidoEm: '20/07/2026 03:10',
    ultimaInteracao: 'Hoje 15:12',
    naoLidas: 2,
    slaResposta: 'Respondido',
    slaResolucao: '27/07/2026 10:10',
    anexos: 3,
    vinculados: 2,
    origemDados: [
      { label: 'Canal', value: 'Portal' },
      { label: 'Solicitante', value: 'Liliane Maria Bolla Polonio' },
      { label: 'OrganizaÃ§Ã£o', value: 'Barra Bonita - Conectasus' },
      { label: 'Sistema', value: 'Conectasus - 2.0' },
      { label: 'VersÃ£o afetada', value: '2.58.6' },
      { label: 'MÃ³dulo', value: 'AmbulatÃ³rio' },
      { label: 'Funcionalidade', value: 'HistÃ³rico de Atendimento' }
    ],
    mensagens: [
      { tipo: 'entrada', autor: 'Liliane Maria Bolla Polonio', texto: 'O paciente passou por consulta em 22/06/26, no PAS Vila Habitacional e nÃ£o aparece no HistÃ³rico do Atendimento mÃ©dico.', data: '20/07/2026 03:10' },
      { tipo: 'entrada', autor: 'Liliane Maria Bolla Polonio', texto: 'O mÃ©dico precisa consultar o histÃ³rico do paciente. Unidade: PAS Vila Habitacional. Paciente: Leonardo Meschiato. Profissional: Dr. Renan.', data: '20/07/2026 03:11' },
      { tipo: 'sistema', autor: 'Sistema', texto: 'SolicitaÃ§Ã£o registrada pelo Portal e classificada para Atendimento NÃ­vel 1.', data: '20/07/2026 03:12' },
      { tipo: 'interno', autor: 'Moises Mattos', texto: 'Validar se existe vÃ­nculo com agenda, atendimento mÃ©dico e histÃ³rico antes de encaminhar para desenvolvimento.', data: 'Hoje 15:12' }
    ]
  },
  {
    id: 'EMAIL-2026-0719',
    canal: 'E-mail',
    origem: 'financeiro@prefeitura.gov.br',
    cliente: 'Prefeitura de MairiporÃ£',
    assunto: 'Erro na geraÃ§Ã£o do BPA competÃªncia 07/2026',
    resumo: 'E-mail recebido com relato de inconsistÃªncia na geraÃ§Ã£o do arquivo BPA.',
    prioridade: 'Alta',
    status: 'Novo',
    responsavel: 'Bruno Oliveira',
    fila: 'Suporte Faturamento',
    recebidoEm: 'Hoje 09:18',
    ultimaInteracao: 'Hoje 09:18',
    naoLidas: 1,
    slaResposta: 'Vence hoje 17:18',
    slaResolucao: '22/07/2026 09:18',
    anexos: 2,
    vinculados: 1,
    origemDados: [
      { label: 'Canal', value: 'E-mail' },
      { label: 'Remetente', value: 'financeiro@prefeitura.gov.br' },
      { label: 'Conta recebida', value: 'suporte@empresa.com' },
      { label: 'Thread ID', value: 'thread-20260719-001' },
      { label: 'Message ID', value: 'msg-48922' },
      { label: 'Anexos', value: 2 },
      { label: 'Cliente', value: 'Prefeitura de MairiporÃ£' }
    ],
    mensagens: [
      { tipo: 'entrada', autor: 'financeiro@prefeitura.gov.br', texto: 'Estamos com erro na geraÃ§Ã£o do BPA da competÃªncia 07/2026. Seguem prints e arquivo TXT para anÃ¡lise.', data: 'Hoje 09:18' },
      { tipo: 'sistema', autor: 'Sistema', texto: 'E-mail capturado pela integraÃ§Ã£o e associado ao cliente Prefeitura de MairiporÃ£.', data: 'Hoje 09:19' }
    ]
  },
  {
    id: 'WPP-8831',
    canal: 'WhatsApp',
    origem: 'Maria Silva',
    cliente: 'Prefeitura de MairiporÃ£',
    assunto: 'DÃºvida sobre confirmaÃ§Ã£o de vaga',
    resumo: 'UsuÃ¡ria questiona regra de confirmaÃ§Ã£o e perda de vaga.',
    prioridade: 'MÃ©dia',
    status: 'Aguardando resposta',
    responsavel: 'Juliana Costa',
    fila: 'Atendimento CidadÃ£o',
    recebidoEm: 'Hoje 10:42',
    ultimaInteracao: 'HÃ¡ 12 min',
    naoLidas: 3,
    slaResposta: 'Aguardando retorno',
    slaResolucao: 'Hoje 18:00',
    anexos: 0,
    vinculados: 0,
    origemDados: [
      { label: 'Canal', value: 'WhatsApp' },
      { label: 'Contato', value: 'Maria Silva' },
      { label: 'Telefone', value: '(11) 99999-9999' },
      { label: 'NÃºmero conectado', value: 'Atendimento SaÃºde' },
      { label: 'Cliente', value: 'Prefeitura de MairiporÃ£' },
      { label: 'Opt-in', value: 'Registrado' }
    ],
    mensagens: [
      { tipo: 'entrada', autor: 'Maria Silva', texto: 'NÃ£o consigo confirmar minha vaga pelo aplicativo.', data: 'Hoje 10:42' },
      { tipo: 'saida', autor: 'Atendente', texto: 'Pode me informar seu CPF ou CNS para localizarmos a solicitaÃ§Ã£o?', data: 'Hoje 10:44' },
      { tipo: 'entrada', autor: 'Maria Silva', texto: 'Enviei no atendimento anterior, mas nÃ£o recebi retorno.', data: 'HÃ¡ 12 min' }
    ]
  },
  {
    id: 'API-7710',
    canal: 'API',
    origem: 'IntegraÃ§Ã£o Cliente X',
    cliente: 'Cliente X',
    assunto: 'Falha recorrente na consulta de procedimento',
    resumo: 'Evento automÃ¡tico recebido por API com repetiÃ§Ã£o acima do limite configurado.',
    prioridade: 'CrÃ­tica',
    status: 'Em andamento',
    responsavel: 'Mariana Lima',
    fila: 'IntegraÃ§Ãµes',
    recebidoEm: 'Hoje 08:55',
    ultimaInteracao: 'Hoje 09:05',
    naoLidas: 0,
    slaResposta: 'NÃ£o aplicÃ¡vel',
    slaResolucao: 'Hoje 16:55',
    anexos: 1,
    vinculados: 4,
    origemDados: [
      { label: 'Canal', value: 'API' },
      { label: 'Sistema de origem', value: 'IntegraÃ§Ã£o Cliente X' },
      { label: 'Evento', value: 'Falha recorrente' },
      { label: 'Identificador externo', value: 'evt-000123' },
      { label: 'Capturado em', value: 'Hoje 08:55' },
      { label: 'Payload', value: 'Resumo disponÃ­vel' }
    ],
    mensagens: [
      { tipo: 'sistema', autor: 'API', texto: 'Evento capturado: falha recorrente na consulta de procedimento. OcorrÃªncias: 18 em 30 minutos.', data: 'Hoje 08:55' },
      { tipo: 'interno', autor: 'Mariana Lima', texto: 'Gerar aÃ§Ã£o para avaliaÃ§Ã£o da integraÃ§Ã£o e comunicaÃ§Ã£o da equipe.', data: 'Hoje 09:05' }
    ]
  }
];

const actionTypes = [
  'Gerar tarefa',
  'Gerar alerta',
  'Cadastrar conhecimento',
  'Criar solicitaÃ§Ã£o',
  'Analisar impacto',
  'Registrar orientaÃ§Ã£o',
  'Acionar agente'
];

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function CentralAtendimento({ onOpenDetail }: PageProps) {
  const result = useAsyncData(fetchAtendimentos as any, mockAtendimentos as any);
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState(atendimentoSeed[0].id);
  const [activeTab, setActiveTab] = useState<'conversa' | 'anexos'>('conversa');
  const [inboxStatus, setInboxStatus] = useState<'Novo' | 'Em andamento'>('Novo');
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  const filtered = atendimentoSeed.filter((item) => {
    const text = normalize([item.id, item.origem, item.canal, item.cliente, item.assunto, item.resumo, item.status, item.prioridade].join(' '));
    const matchesSearch = !search || text.includes(normalize(search));
    const matchesStatus = inboxStatus === 'Novo'
      ? item.status === 'Novo'
      : item.status === 'Em andamento' || item.status === 'Aguardando resposta';

    return matchesSearch && matchesStatus;
  });

  const active = filtered.find((item) => item.id === activeId) ?? filtered[0] ?? atendimentoSeed.find((item) => item.id === activeId) ?? atendimentoSeed[0];
  const Icon = origemIcon[active.canal];

  const abertas = atendimentoSeed.filter((item) => !['ConcluÃ­do', 'Cancelado'].includes(item.status)).length;
  const novas = atendimentoSeed.filter((item) => item.status === 'Novo').length;
  const aguardando = atendimentoSeed.filter((item) => item.status === 'Aguardando resposta').length;
  const andamento = atendimentoSeed.filter((item) => item.status === 'Em andamento').length;
  const concluidas = atendimentoSeed.filter((item) => item.status === 'ConcluÃ­do').length;

  const openModal = () => {
    onOpenDetail?.({
      title: active.assunto,
      subtitle: `${active.id} Â· ${active.cliente}`,
      badge: active.status,
      badgeTone: active.prioridade,
      description: active.resumo,
      meta: [
        { label: 'Canal', value: active.canal },
        { label: 'Origem', value: active.origem },
        { label: 'ResponsÃ¡vel', value: active.responsavel },
        { label: 'Fila', value: active.fila },
        { label: 'SLA resoluÃ§Ã£o', value: active.slaResolucao }
      ],
      actions: ['Responder', 'Gerar aÃ§Ã£o', 'Acionar agente']
    });
  };

  const renderConversation = () => (
    <div className="service-conversation">
      {active.mensagens.map((message, index) => (
        <div key={`${message.autor}-${index}`} className={`service-message message-${message.tipo}`}>
          <div className="message-avatar">{message.tipo === 'sistema' ? <Workflow size={15} /> : message.autor.slice(0, 2).toUpperCase()}</div>
          <div className="message-bubble">
            <div className="message-meta"><strong>{message.autor}</strong><span>{message.data}</span></div>
            <p>{message.texto}</p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTab = () => {
    if (activeTab === 'anexos') {
      return (
        <div className="attachment-grid">
          {Array.from({ length: Math.max(active.anexos, 1) }).map((_, index) => (
            <div className="attachment-card" key={index}><Paperclip size={18} /><strong>{active.anexos ? `Anexo ${index + 1}` : 'Sem anexos'}</strong><span>{active.anexos ? 'Arquivo recebido no atendimento' : 'Nenhum anexo recebido'}</span></div>
          ))}
        </div>
      );
    }

    return renderConversation();
  };

  return (
    <>
      <PageHeader
        title="Atendimentos"
        action={<button className="secondary-btn"><PlusCircle size={16} /> Novo atendimento</button>}
      />
      <DataSourceNotice source={result.source} loading={result.loading} error={result.error} connectionState={result.connectionState} />

      <CollapsibleKpiSection>
        <div className="kpi-grid five service-kpis">
          <KpiCard label="Conversas abertas" value={abertas} tone="green" tooltip="Atendimentos ainda nÃ£o concluÃ­dos ou cancelados." />
          <KpiCard label="Novos atendimentos" value={novas} tone="blue" tooltip="Demandas recebidas recentemente e ainda sem tratamento." />
          <KpiCard label="Aguardando resposta" value={aguardando} tone="orange" tooltip="Atendimentos que dependem de retorno da equipe ou do solicitante." />
          <KpiCard label="Em andamento" value={andamento} tone="cyan" tooltip="Atendimentos que jÃ¡ estÃ£o sendo tratados." />
          <KpiCard label="ConcluÃ­das hoje" value={concluidas} tone="green" tooltip="Atendimentos finalizados no dia." />
        </div>
      </CollapsibleKpiSection>

      <div className="service-desk-shell">
        <aside className="service-inbox card">
          <div className="service-inbox-header">
            <h3>Atendimentos</h3>
            <span>{filtered.length}</span>
          </div>
          <div className="service-search">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar atendimento, origem ou cliente..." />
          </div>
          <div className="service-mini-tabs">
            <button className={inboxStatus === 'Novo' ? 'active' : ''} onClick={() => setInboxStatus('Novo')}>Novos</button>
            <button className={inboxStatus === 'Em andamento' ? 'active' : ''} onClick={() => setInboxStatus('Em andamento')}>Em andamento</button>
          </div>
          <p className="service-operational-note">ConcluÃ­dos e cancelados ficam para relatÃ³rios e consultas.</p>
          <div className="service-list">
            {filtered.map((item) => {
              const ItemIcon = origemIcon[item.canal];
              return (
                <button key={item.id} className={`service-list-item ${item.id === active.id ? 'active' : ''}`} onClick={() => setActiveId(item.id)}>
                  <span className="channel-avatar"><ItemIcon size={17} /></span>
                  <span className="service-list-main">
                    <strong>{item.origem}</strong>
                    <em>{item.canal} Â· {item.cliente}</em>
                    <small>{item.resumo}</small>
                  </span>
                  <span className="service-list-side">
                    <small>{item.ultimaInteracao}</small>
                    {item.naoLidas > 0 && <b>{item.naoLidas}</b>}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="service-ticket card">
          <div className="service-ticket-header">
            <div>
              <span className="ticket-code">{active.id}</span>
              <h2>{active.assunto}</h2>
              <p><Icon size={15} /> {active.canal} Â· {active.origem} Â· {active.cliente}</p>
            </div>
            <div className="service-ticket-actions">
              <Badge tone={active.prioridade.toLowerCase()}>Prioridade {active.prioridade}</Badge>
              <button className="row-icon-btn" title="Expandir em modal" onClick={openModal}><Maximize2 size={16} /></button>
            </div>
          </div>

          <div className="service-tabs service-tabs-compact">
            {[
              ['conversa', 'Conversa'],
              ['anexos', 'Anexos']
            ].map(([key, label]) => <button key={key} className={activeTab === key ? 'active' : ''} onClick={() => setActiveTab(key as typeof activeTab)}>{label}</button>)}
          </div>

          <div className="service-tab-content">
            {renderTab()}
          </div>

          <div className="service-composer">
            <div className="composer-tabs">
              <button className="active">{active.canal === 'API' ? 'Registrar anÃ¡lise' : active.canal === 'E-mail' ? 'Responder e-mail' : active.canal === 'WhatsApp' ? 'Responder WhatsApp' : 'Responder'}</button>
              <button>ObservaÃ§Ã£o interna</button>
            </div>
            <div className="composer-box">
              <textarea placeholder={active.canal === 'API' ? 'Registre a anÃ¡lise do evento automÃ¡tico...' : 'Escreva uma resposta ou orientaÃ§Ã£o...'} />
              <div>
                <button><Paperclip size={16} /> Anexar</button>
                <button><Bot size={16} /> Acionar agente</button>
                <button onClick={() => setIsActionModalOpen(true)}><PlusCircle size={16} /> Gerar aÃ§Ã£o</button>
                <button className="primary"><Send size={16} /> Enviar</button>
              </div>
            </div>
          </div>
        </main>

        <aside className="service-context card">
          <section>
            <h3>Resumo</h3>
            <label>Status<select defaultValue={active.status}>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>Prioridade do atendimento<select defaultValue={active.prioridade}>{prioridadeOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>ResponsÃ¡vel<select defaultValue={active.responsavel}>{responsaveis.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>Fila<select defaultValue={active.fila}><option>{active.fila}</option><option>Atendimento NÃ­vel 1</option><option>Suporte Faturamento</option><option>IntegraÃ§Ãµes</option></select></label>
          </section>

          <section>
            <h3>SLA</h3>
            <div className="sla-row"><Clock3 size={16} /><span>Primeira resposta</span><strong>{active.slaResposta}</strong></div>
            <div className="sla-row"><Clock3 size={16} /><span>ResoluÃ§Ã£o</span><strong>{active.slaResolucao}</strong></div>
          </section>

          <section>
            <h3>Origem da demanda</h3>
            {active.origemDados.slice(0, 6).map((item) => <div className="context-row" key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}
            <div className="context-row"><span>AÃ§Ãµes vinculadas</span><strong>{active.vinculados}</strong></div>
          </section>

          <section>
            <h3>AÃ§Ãµes rÃ¡pidas</h3>
            <div className="quick-actions">
              <button><Send size={16} /> {active.canal === 'API' ? 'Registrar anÃ¡lise' : 'Responder'}</button>
              <button onClick={() => setIsActionModalOpen(true)}><PlusCircle size={16} /> Gerar aÃ§Ã£o</button>
              <button><Sparkles size={16} /> Acionar agente</button>
              <button>Transferir responsÃ¡vel</button>
              <button className="danger">Concluir atendimento</button>
            </div>
          </section>
        </aside>
      </div>

      {isActionModalOpen && (
        <div className="action-modal-backdrop" onClick={() => setIsActionModalOpen(false)}>
          <div className="action-modal" onClick={(event) => event.stopPropagation()}>
            <div className="action-modal-header">
              <div>
                <h3>Gerar aÃ§Ã£o</h3>
                <p>Crie uma aÃ§Ã£o vinculada a este atendimento sem sair da conversa.</p>
              </div>
              <button className="row-icon-btn" onClick={() => setIsActionModalOpen(false)}>Ã—</button>
            </div>

            <div className="action-type-grid">
              {actionTypes.map((type) => (
                <button key={type}>
                  <PlusCircle size={17} />
                  <span>{type}</span>
                </button>
              ))}
            </div>

            <label className="action-modal-field">
              Resumo sugerido
              <textarea defaultValue={active.resumo} />
            </label>

            <div className="action-modal-row">
              <label>ResponsÃ¡vel<select defaultValue={active.responsavel}>{responsaveis.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label>Prioridade do atendimento<select defaultValue={active.prioridade}>{prioridadeOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
            </div>

            <div className="action-modal-footer">
              <button onClick={() => setIsActionModalOpen(false)}>Cancelar</button>
              <button className="primary" onClick={() => setIsActionModalOpen(false)}>Gerar aÃ§Ã£o vinculada</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

