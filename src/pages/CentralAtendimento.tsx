import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, CheckCircle2, Clock, Inbox, Lock, MessageSquare, PackagePlus, Plus, Search, Send } from 'lucide-react';
import { ConversationThread, type ThreadMessage } from '../components/ConversationThread';
import { useSession } from '../contexts/SessionContext';
import { showAppToast } from '../lib/appToast';
import { categorizeStatusLabel, STATUS_CATEGORY_TONE, type StatusCategory } from '../lib/statusCategory';
import {
  createAtendimentoManual,
  formatProtocolo,
  listAtendimentosAdmin,
  listMensagensAdmin,
  postMensagemAdmin,
  prioridadesAtendimento,
  updateAtendimentoStatus,
  type Atendimento,
  type AtendimentoMensagem,
  type AtendimentoStatus,
} from '../services/atendimentos';
import { listServicos, type ServicoRecord } from '../services/servicosFilas';
import type { PanelDetail } from '../components/RightPanel';

export type CentralAtendimentoProps = {
  onSelectDetail?: (detail: PanelDetail) => void;
  onOpenDetail?: (detail: PanelDetail) => void;
};

type ListaAtendimentos = Awaited<ReturnType<typeof listAtendimentosAdmin>>;

const statusList: AtendimentoStatus[] = ['Novo', 'Em andamento', 'Aguardando resposta', 'Concluído', 'Cancelado'];
const canais = ['E-mail', 'WhatsApp', 'Widget', 'API', 'Manual', 'Telegram', 'Instagram', 'Messenger', 'SMS'];

function buildDetail(atendimento: Atendimento): PanelDetail {
  const categoria: StatusCategory = categorizeStatusLabel(atendimento.status);
  return {
    title: atendimento.assunto,
    subtitle: `${atendimento.canal} • ${atendimento.solicitante_nome || 'Solicitante não informado'}`,
    badge: atendimento.status,
    badgeTone: STATUS_CATEGORY_TONE[categoria],
    meta: [
      { label: 'Status', value: atendimento.status },
      { label: 'Prioridade', value: atendimento.prioridade },
      { label: 'Protocolo', value: formatProtocolo(atendimento) },
      { label: 'Origem', value: `${atendimento.canal} • ${atendimento.solicitante_nome || '-'}` },
    ],
  };
}

export function CentralAtendimento({ onOpenDetail }: CentralAtendimentoProps) {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;

  const queryClient = useQueryClient();

  const [modal, setModal] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resposta, setResposta] = useState('');
  const [tipoResposta, setTipoResposta] = useState<'publica' | 'interna'>('publica');
  const [activeTab, setActiveTab] = useState<'comentarios' | 'atividade'>('comentarios');
  const [novoForm, setNovoForm] = useState({ canal: canais[0], solicitante: '', resumo: '', servico: '', prioridade: 'Média' as (typeof prioridadesAtendimento)[number] });

  const atendimentosKey = ['central-atendimento', 'atendimentos', clienteId];
  const servicosKey = ['central-atendimento', 'servicos', clienteId];
  const mensagensKey = (atendimentoId: string | null) => ['central-atendimento', 'mensagens', atendimentoId];

  const servicosQuery = useQuery({
    queryKey: servicosKey,
    queryFn: async () => {
      const { items } = await listServicos(clienteId as string);
      return items.filter((item) => item.status === 'Ativo');
    },
    enabled: !!clienteId,
  });
  const servicos: ServicoRecord[] = servicosQuery.data ?? [];

  const demandasQuery = useQuery({
    queryKey: atendimentosKey,
    queryFn: () => listAtendimentosAdmin(clienteId as string),
    enabled: !!clienteId,
  });
  const chamados = demandasQuery.data?.chamados;
  const demandas: Atendimento[] = chamados ?? [];
  const loading = demandasQuery.isLoading;

  // Preserva a seleção quando a lista é revalidada; só cai no primeiro item se o selecionado sumiu.
  useEffect(() => {
    if (!chamados) return;
    setSelectedId((current) => (current && chamados.some((item) => item.id === current) ? current : chamados[0]?.id ?? null));
  }, [chamados]);

  const selected = useMemo(() => demandas.find((item) => item.id === selectedId) || null, [demandas, selectedId]);

  const mensagensQuery = useQuery({
    queryKey: mensagensKey(selectedId),
    queryFn: () => listMensagensAdmin(selectedId as string),
    enabled: !!selectedId,
  });
  const mensagens: AtendimentoMensagem[] = mensagensQuery.data?.mensagens ?? [];
  const loadingMensagens = mensagensQuery.isLoading;

  // Os services de atendimento NUNCA lançam: quando o Supabase falha eles caem no armazenamento
  // local do navegador e devolvem source 'local'. Sem ler esse campo, falha de origem chegaria à
  // tela como "nenhuma demanda" -- ausência de dado virando ausência de negócio, mesma classe dos
  // FIND-QA-BLACK-01/02/03 emendados no Dashboard em ff6613a.
  const origemLocal = demandasQuery.data?.source === 'local';
  const falhaDeOrigem = demandasQuery.isError || origemLocal;
  const dataNotice = demandasQuery.isError
    ? 'Não foi possível carregar os atendimentos do servidor.'
    : origemLocal
      ? 'Não foi possível consultar o servidor — a lista abaixo vem do armazenamento local deste navegador e pode estar desatualizada.'
      : undefined;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return demandas;
    return demandas.filter((item) => `${item.canal} ${item.solicitante_nome ?? ''} ${item.assunto}`.toLowerCase().includes(q));
  }, [demandas, query]);

  const kpis: Array<[string, number, typeof Inbox, string]> = [
    ['Demandas abertas', demandas.filter((d) => categorizeStatusLabel(d.status) !== 'concluido' && categorizeStatusLabel(d.status) !== 'cancelado').length, Inbox, '#00875a'],
    ['Novas demandas', demandas.filter((d) => d.status === 'Novo').length, PackagePlus, '#0f62fe'],
    ['Aguardando resposta', demandas.filter((d) => d.status === 'Aguardando resposta').length, Clock, '#ff8b22'],
    ['Em andamento', demandas.filter((d) => d.status === 'Em andamento').length, Send, '#00a6d6'],
    ['Concluídas', demandas.filter((d) => d.status === 'Concluído').length, CheckCircle2, '#00875a'],
  ];

  const selectDemanda = (demanda: Atendimento) => {
    setSelectedId(demanda.id);
    setActiveTab('comentarios');
  };

  // Otimista com rollback: a fila reage na hora, mas se a escrita falhar a lista volta ao estado
  // anterior em vez de continuar exibindo um status que o banco não tem.
  const statusMutation = useMutation({
    mutationFn: (vars: { id: string; anterior: AtendimentoStatus; novo: AtendimentoStatus }) =>
      updateAtendimentoStatus(vars.id, vars.anterior, vars.novo),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: atendimentosKey });
      const previous = queryClient.getQueryData<ListaAtendimentos>(atendimentosKey);
      if (previous) {
        const now = new Date().toISOString();
        queryClient.setQueryData<ListaAtendimentos>(atendimentosKey, {
          ...previous,
          chamados: previous.chamados.map((item) => (item.id === vars.id ? { ...item, status: vars.novo, atualizado_em: now } : item)),
        });
      }
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(atendimentosKey, context.previous);
      showAppToast(error instanceof Error ? error.message : 'Não foi possível atualizar o status.', 'error');
    },
    onSuccess: (_data, vars) => showAppToast(`Status atualizado para ${vars.novo}.`, 'success'),
    // O evento de sistema na timeline é gravado pelo próprio service; revalidar traz o registro real
    // do banco no lugar da linha temporária que a tela fabricava antes.
    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({ queryKey: atendimentosKey });
      queryClient.invalidateQueries({ queryKey: mensagensKey(vars.id) });
    },
  });

  const changeStatus = (nextStatus: AtendimentoStatus) => {
    if (!selected || nextStatus === selected.status) return;
    statusMutation.mutate({ id: selected.id, anterior: selected.status, novo: nextStatus });
  };

  const respostaMutation = useMutation({
    mutationFn: (vars: { atendimentoId: string; autor: string; tipo: 'publica' | 'interna'; texto: string; autorEquipe?: Parameters<typeof postMensagemAdmin>[4] }) =>
      postMensagemAdmin(vars.atendimentoId, vars.autor, vars.tipo, vars.texto, vars.autorEquipe),
    onSuccess: (_data, vars) => {
      setResposta('');
      queryClient.invalidateQueries({ queryKey: mensagensKey(vars.atendimentoId) });
      showAppToast(vars.tipo === 'interna' ? 'Nota interna registrada.' : 'Resposta enviada.', 'success');
    },
    onError: (error) => showAppToast(error instanceof Error ? error.message : 'Não foi possível enviar a mensagem.', 'error'),
  });
  const enviando = respostaMutation.isPending;

  const enviarResposta = () => {
    const texto = resposta.trim();
    if (!texto || !selected) {
      showAppToast('Escreva uma mensagem antes de enviar.', 'warning');
      return;
    }
    respostaMutation.mutate({
      atendimentoId: selected.id,
      autor: session?.user.displayName || 'Você',
      tipo: tipoResposta,
      texto,
      autorEquipe: session?.user ? { kind: session.user.kind, registroId: session.user.registroId } : undefined,
    });
  };

  const criarMutation = useMutation({
    mutationFn: (vars: Parameters<typeof createAtendimentoManual>[0]) => createAtendimentoManual(vars),
    onSuccess: ({ atendimento }) => {
      queryClient.invalidateQueries({ queryKey: atendimentosKey });
      setSelectedId(atendimento.id);
      setActiveTab('comentarios');
      setNovoForm({ canal: canais[0], solicitante: '', resumo: '', servico: '', prioridade: 'Média' });
      setModal(false);
      showAppToast('Atendimento criado.', 'success');
    },
    onError: (error) => showAppToast(error instanceof Error ? error.message : 'Não foi possível criar o atendimento.', 'error'),
  });
  const salvando = criarMutation.isPending;

  const salvarAtendimento = () => {
    if (!novoForm.solicitante.trim() || !novoForm.resumo.trim() || !clienteId) {
      showAppToast('Informe solicitante e resumo antes de salvar.', 'warning');
      return;
    }
    criarMutation.mutate({
      clienteId,
      canal: novoForm.canal,
      solicitanteNome: novoForm.solicitante.trim(),
      assunto: novoForm.resumo.trim(),
      mensagem: novoForm.resumo.trim(),
      servicoId: novoForm.servico || undefined,
      prioridade: novoForm.prioridade,
    });
  };

  const mensagensPublicas: ThreadMessage[] = mensagens
    .filter((m) => m.tipo !== 'sistema')
    .map((m) => ({
      id: m.id,
      autor: m.autor_nome || 'Desconhecido',
      tipo: m.tipo as 'publica' | 'interna',
      texto: m.texto,
      criadoEm: new Date(m.criado_em).toLocaleString('pt-BR'),
    }));

  if (!clienteId) {
    return (
      <div className="v3464-page">
        <div className="v3464-page-head"><h1>Atendimentos</h1></div>
        <div className="v3464-card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>
          Acesse o contexto de um cliente para ver os atendimentos dele.
        </div>
      </div>
    );
  }

  return (
    <div className="v3464-page">
      <div className="v3464-page-head">
        <h1>Atendimentos</h1>
        <button className="v3464-btn primary" onClick={() => setModal(true)}><Plus size={16} />Novo atendimento</button>
      </div>

      {dataNotice && <p className="atendimento-data-notice" style={{ color: 'var(--v3464-muted)', margin: '0 0 12px' }}>{dataNotice}</p>}

      <div className="v3464-kpis">
        {kpis.map(([title, value, Icon, color]) => (
          <div className="v3464-kpi" key={title}>
            <span className="v3464-kpi-icon" style={{ background: color }}><Icon size={22} /></span>
            <div><strong>{title}</strong><h2>{value}</h2></div>
          </div>
        ))}
      </div>

      <div className="atendimento-layout">
        <section className="v3464-card atendimento-queue">
          <div className="v3464-search" style={{ margin: '0 0 10px' }}>
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar demanda, canal ou solicitante..." />
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {loading && <p style={{ color: 'var(--v3464-muted)' }}>Carregando...</p>}
            {!loading && filtered.map((item) => {
              const categoria = categorizeStatusLabel(item.status);
              return (
                <button
                  key={item.id}
                  className={`atendimento-queue-item ${item.id === selectedId ? 'active' : ''}`}
                  onClick={() => selectDemanda(item)}
                >
                  <small>{formatProtocolo(item)}</small>
                  <strong>{item.assunto}</strong>
                  <span className="atendimento-queue-meta">{item.canal} • {item.solicitante_nome || 'Solicitante não informado'}</span>
                  <span className={`badge badge-status-${categoria}`}>{item.status}</span>
                </button>
              );
            })}
            {!loading && filtered.length === 0 && (
              <p style={{ color: 'var(--v3464-muted)' }}>
                {falhaDeOrigem ? 'Não foi possível carregar as demandas do servidor.' : 'Nenhuma demanda encontrada.'}
              </p>
            )}
          </div>
        </section>

        <section className="v3464-card atendimento-conversation">
          {!selected ? (
            <p style={{ color: 'var(--v3464-muted)', padding: 20 }}>Selecione um atendimento na lista ao lado.</p>
          ) : (
            <>
              <div className="atendimento-conversation-head">
                <h2>{selected.assunto}</h2>
                <p>{selected.canal} • {selected.solicitante_nome || 'Solicitante não informado'}</p>
                <select
                  className="atendimento-status-select"
                  value={selected.status}
                  onChange={(event) => changeStatus(event.target.value as AtendimentoStatus)}
                >
                  {statusList.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <button className="v3464-btn secondary" onClick={() => onOpenDetail?.(buildDetail(selected))}>
                  <MessageSquare size={16} /> Ver detalhes
                </button>
              </div>

              <div className="atendimento-response-toggle atendimento-activity-tabs">
                <button type="button" className={activeTab === 'comentarios' ? 'active' : ''} onClick={() => setActiveTab('comentarios')}>
                  Comentários
                </button>
                <button type="button" className={activeTab === 'atividade' ? 'active' : ''} onClick={() => setActiveTab('atividade')}>
                  Atividade
                </button>
              </div>

              {loadingMensagens ? (
                <p style={{ color: 'var(--v3464-muted)' }}>Carregando mensagens...</p>
              ) : activeTab === 'comentarios' ? (
                <ConversationThread messages={mensagensPublicas} />
              ) : (
                <div className="conversation-thread">
                  {mensagens.map((entry) => (
                    <div key={entry.id} className={`thread-message ${entry.tipo}`}>
                      <div className="thread-message-head">
                        <strong>{entry.autor_nome ?? 'Sistema'}</strong>
                        {entry.tipo === 'interna' && <span className="thread-internal-tag"><Lock size={11} /> Nota interna</span>}
                        <small>{new Date(entry.criado_em).toLocaleString('pt-BR')}</small>
                      </div>
                      <p>{entry.texto}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="atendimento-composer">
                <div className="atendimento-response-toggle">
                  <button type="button" className={tipoResposta === 'publica' ? 'active' : ''} onClick={() => setTipoResposta('publica')}>
                    Resposta pública
                  </button>
                  <button type="button" className={tipoResposta === 'interna' ? 'active' : ''} onClick={() => setTipoResposta('interna')}>
                    <Lock size={13} /> Nota interna
                  </button>
                </div>
                <textarea
                  value={resposta}
                  onChange={(event) => setResposta(event.target.value)}
                  placeholder={tipoResposta === 'interna' ? 'Escreva uma nota interna, visível só pra equipe...' : 'Escreva uma resposta ao solicitante...'}
                  style={{ width: '100%', minHeight: 90 }}
                />
                <footer style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button className="v3464-btn secondary">Anexar</button>
                  <button className="v3464-btn secondary"><Bot size={16} />Acionar agente</button>
                  <button className="v3464-btn secondary"><Plus size={16} />Gerar ação</button>
                  <button className="v3464-btn primary" onClick={enviarResposta} disabled={enviando}>
                    {enviando ? 'Enviando...' : tipoResposta === 'interna' ? 'Registrar nota' : 'Responder'}
                  </button>
                </footer>
              </div>
            </>
          )}
        </section>
      </div>

      {modal && (
        <div className="v3464-modal-backdrop">
          <section className="v3464-system-modal">
            <button className="v3464-modal-x" onClick={() => setModal(false)}>×</button>
            <h2>Novo atendimento</h2>
            <p>Registre uma demanda de e-mail, ticket, API, integração ou atendimento manual.</p>
            <div className="v3464-modal-form">
              <label>Origem
                <select value={novoForm.canal} onChange={(event) => setNovoForm((current) => ({ ...current, canal: event.target.value }))}>
                  {canais.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>Solicitante
                <input value={novoForm.solicitante} onChange={(event) => setNovoForm((current) => ({ ...current, solicitante: event.target.value }))} />
              </label>
              <label>Prioridade
                <select value={novoForm.prioridade} onChange={(event) => setNovoForm((current) => ({ ...current, prioridade: event.target.value as typeof current.prioridade }))}>
                  {prioridadesAtendimento.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>Resumo
                <textarea value={novoForm.resumo} onChange={(event) => setNovoForm((current) => ({ ...current, resumo: event.target.value }))} />
              </label>
              <label>Serviço (opcional)
                <select value={novoForm.servico} onChange={(event) => setNovoForm((current) => ({ ...current, servico: event.target.value }))}>
                  <option value="">Nenhum</option>
                  {servicos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                </select>
              </label>
            </div>
            <footer>
              <button className="v3464-secondary-btn" onClick={() => setModal(false)}>Cancelar</button>
              <button className="v3464-primary-btn" onClick={salvarAtendimento} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar atendimento'}</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

export default CentralAtendimento;
