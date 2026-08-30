import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Bot, Loader2, Plus, Send, User, Volume2 } from 'lucide-react';
import { useSession } from '../contexts/SessionContext';
import { runAgent, runAgentStream, type AgentMode } from '../services/agentClient';
import { listConversations, loadConversationMessages, type AgentConversationSummary } from '../services/agentConversations';
import { getClientAgentThatAnswers, type AgentRecord } from '../services/canaisAgentes';
import assistantIcon from '../assets/assistant-icon.png';

// Tela de chat de página inteira (design-chat-tela-cheia-v1.md, aprovado pelo usuário em
// 30/08/2026). Complementa o widget flutuante, não substitui: o widget manda
// `context.telaAtual` e serve pra pergunta situada ("me explica este campo aqui"); esta tela é
// pra conversa que É o trabalho -- ler resposta longa, voltar numa conversa de ontem.
// Numa tela cheia não existe "tela atual", então esta tela deliberadamente NÃO manda telaAtual.
//
// Voz: V1 é texto + botão "ouvir" por mensagem (ver comentário em PlayAnswerButton). A escuta
// contínua (VAD/barge-in) continua só no widget -- duplicar aquelas ~400 linhas aqui seria
// dívida garantida; se a voz completa fizer falta nesta tela, o caminho certo é extrair aquilo
// pra um hook compartilhado, não copiar.

type ChatMessage = {
  role: 'user' | 'agent';
  content: string;
};

const AGENT_UNAVAILABLE_MESSAGE = 'Não consegui responder agora — o serviço de IA não respondeu. Tente de novo em instantes.';

export function ChatAgente() {
  const { session } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // O app não declara <Route> por página (a conversão da frente B manteve correspondência por
  // pathname no App.tsx), então `useParams` não teria match aqui -- o id sai do próprio path.
  const routeConversationId = location.pathname.replace(/^\/chat\/?/, '').split('/')[0] || undefined;

  // O backend resolve o agente de cliente pelo TENANT (resolveActiveClientAgent por
  // cliente_id), não por id de agente -- então a URL carrega só a intenção ("falar com o
  // agente do cliente"), não um id que daria falsa precisão.
  const comoAgenteDoCliente = searchParams.get('agente') === 'cliente';
  const mode: AgentMode = comoAgenteDoCliente ? 'usuario-cliente' : 'administrador-cliente';

  const clienteId = session?.activeClientId ?? null;
  const userId = session?.user.authUserId ?? null;

  const [conversations, setConversations] = useState<AgentConversationSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(routeConversationId);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [clientAgent, setClientAgent] = useState<AgentRecord | null>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const agentName = comoAgenteDoCliente ? (clientAgent?.name || 'Agente') : 'Imya';
  const agentIconUrl = comoAgenteDoCliente ? clientAgent?.avatarUrl : '';
  const agentColor = comoAgenteDoCliente ? clientAgent?.color : '';

  useEffect(() => {
    if (!comoAgenteDoCliente || !clienteId) return;
    void getClientAgentThatAnswers(clienteId).then(setClientAgent);
  }, [comoAgenteDoCliente, clienteId]);

  const refreshConversations = () => {
    if (!clienteId || !userId) return;
    void listConversations(clienteId, userId).then(setConversations);
  };

  useEffect(refreshConversations, [clienteId, userId]);

  // Abrir /chat/:id carrega os turnos reais e CONTINUA aquela conversa (mesmo conversationId),
  // em vez de começar uma nova por baixo dos panos.
  useEffect(() => {
    setConversationId(routeConversationId);
    if (!routeConversationId || !clienteId) {
      setMessages([]);
      return;
    }
    setLoadingHistory(true);
    void loadConversationMessages(routeConversationId, clienteId)
      .then((turns) => setMessages(turns.map((t) => ({ role: t.role, content: t.content }))))
      .finally(() => setLoadingHistory(false));
  }, [routeConversationId, clienteId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const novaConversa = () => {
    setMessages([]);
    setConversationId(undefined);
    setMessage('');
    navigate(comoAgenteDoCliente ? '/chat?agente=cliente' : '/chat');
  };

  const abrirConversa = (id: string) => {
    navigate(comoAgenteDoCliente ? `/chat/${id}?agente=cliente` : `/chat/${id}`);
  };

  const enviar = async (texto: string) => {
    const pergunta = texto.trim();
    if (!pergunta || sending || !clienteId) return;

    setMessages((atual) => [...atual, { role: 'user', content: pergunta }]);
    setMessage('');
    setSending(true);

    let indiceResposta = -1;
    setMessages((atual) => {
      indiceResposta = atual.length;
      return [...atual, { role: 'agent', content: '' }];
    });

    const anexarPedaco = (delta: string) => {
      setMessages((atual) => {
        const alvo = atual[indiceResposta];
        if (!alvo) return atual;
        const proximo = [...atual];
        proximo[indiceResposta] = { ...alvo, content: alvo.content + delta };
        return proximo;
      });
    };

    let recebeuAlgo = false;
    try {
      let resultado = await runAgentStream(
        { question: pergunta, clienteId, userId: userId ?? undefined, conversationId, mode },
        (delta) => { recebeuAlgo = true; anexarPedaco(delta); },
      );

      // Streaming indisponível e nada chegou ainda -- cai pro caminho não-streaming, mesmo
      // padrão já usado pelo widget.
      if (!resultado.ok && !recebeuAlgo) {
        resultado = await runAgent({ question: pergunta, clienteId, userId: userId ?? undefined, conversationId, mode });
      }

      const novoConversationId = resultado.conversationId;
      if (resultado.ok && novoConversationId) {
        setConversationId(novoConversationId);
        // Conversa nova ganha URL própria sem recarregar a tela -- `replace` pra não empilhar
        // uma entrada de histórico do navegador por conversa criada.
        if (!conversationId) {
          navigate(comoAgenteDoCliente ? `/chat/${novoConversationId}?agente=cliente` : `/chat/${novoConversationId}`, { replace: true });
        }
        refreshConversations();
      }

      setMessages((atual) => {
        const alvo = atual[indiceResposta];
        if (!alvo) return atual;
        const proximo = [...atual];
        proximo[indiceResposta] = {
          ...alvo,
          content: resultado.ok ? (resultado.response?.answer ?? alvo.content) : (alvo.content || resultado.error || AGENT_UNAVAILABLE_MESSAGE),
        };
        return proximo;
      });
    } finally {
      setSending(false);
    }
  };

  if (!clienteId) {
    return (
      <div className="chat-page-empty">
        <p>Acesse o contexto de um cliente para conversar com o agente.</p>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <aside className="chat-sidebar">
        <button className="chat-nova-conversa" onClick={novaConversa}><Plus size={16} /> Nova conversa</button>
        <nav className="chat-historico">
          {conversations.length === 0 ? (
            <p className="chat-historico-vazio">Suas conversas aparecem aqui.</p>
          ) : conversations.map((conversa) => (
            <button
              key={conversa.id}
              className={conversa.id === conversationId ? 'active' : ''}
              onClick={() => abrirConversa(conversa.id)}
              title={conversa.title}
            >
              {conversa.title}
            </button>
          ))}
        </nav>
      </aside>

      <section className="chat-principal">
        <header className="chat-topo">
          <button className="chat-voltar" onClick={() => navigate('/dashboard')} title="Voltar para a plataforma"><ArrowLeft size={18} /></button>
          <AgentAvatar name={agentName} iconUrl={agentIconUrl} color={agentColor} />
          <div>
            <strong>{agentName}</strong>
            <small>{comoAgenteDoCliente ? 'Agente do seu ambiente' : 'Assistente da DecidAI'}</small>
          </div>
        </header>

        <div className="chat-thread">
          {loadingHistory ? (
            <p className="chat-thread-status"><Loader2 size={16} className="v363-spin" /> Carregando conversa...</p>
          ) : messages.length === 0 ? (
            <div className="chat-thread-vazio">
              <AgentAvatar name={agentName} iconUrl={agentIconUrl} color={agentColor} size={44} />
              <h2>Em que posso ajudar?</h2>
              <p>Pergunte, peça uma análise ou continue uma conversa anterior pelo histórico ao lado.</p>
            </div>
          ) : messages.map((item, indice) => (
            <article key={indice} className={`chat-bolha ${item.role}`}>
              <div className="chat-bolha-autor">
                {item.role === 'agent'
                  ? <AgentAvatar name={agentName} iconUrl={agentIconUrl} color={agentColor} size={26} />
                  : <span className="chat-avatar-usuario"><User size={15} /></span>}
                <strong>{item.role === 'agent' ? agentName : 'Você'}</strong>
                {item.role === 'agent' && item.content ? <PlayAnswerButton /> : null}
              </div>
              <div className="chat-bolha-corpo">
                {item.role === 'agent' && !item.content
                  ? <span className="chat-pensando"><Loader2 size={15} className="v363-spin" /> Pensando...</span>
                  : <ReactMarkdown>{item.content}</ReactMarkdown>}
              </div>
            </article>
          ))}
          <div ref={threadEndRef} />
        </div>

        <footer className="chat-composer">
          <textarea
            value={message}
            disabled={sending}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              // Enter envia, Shift+Enter quebra linha -- convenção que as pessoas já trazem de
              // outros chats; sem isso, escrever um parágrafo aqui seria impossível.
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void enviar(message);
              }
            }}
            placeholder={`Pergunte para ${agentName}...`}
            rows={1}
          />
          <button className="chat-enviar" disabled={sending || !message.trim()} onClick={() => void enviar(message)} aria-label="Enviar">
            {sending ? <Loader2 size={18} className="v363-spin" /> : <Send size={18} />}
          </button>
        </footer>
      </section>
    </div>
  );
}

function AgentAvatar({ name, iconUrl, color, size = 30 }: { name: string; iconUrl?: string; color?: string; size?: number }) {
  // Agente de cliente usa o ícone/cor que o tenant configurou (estilo Discord: imagem por cima
  // da cor, `contain` pra não cortar); a Imya usa a marca fixa dela.
  if (iconUrl) {
    return (
      <span className="chat-avatar-agente" style={{ width: size, height: size, background: color || '#64748b' }}>
        <img src={iconUrl} alt={name} />
      </span>
    );
  }
  return <img src={assistantIcon} alt={name} className="chat-avatar-agente-marca" style={{ width: size, height: size }} />;
}

// Botão "ouvir" por mensagem -- desenhado contando com a saída estruturada que a frente B está
// construindo (design-chat-tela-cheia-v1.md). Quando `spokenText` existir de verdade, este
// botão toca a versão FALADA (curta, conversacional) enquanto a tela mostra a versão exibida
// (rica, com lista/tabela) -- numa tela cheia os dois papéis coexistindo é o comportamento
// certo, não um bug. Enquanto a frente B não entrega, o contrato de resposta não traz
// `spokenText` nem áudio pro caminho de texto, então o botão fica desabilitado e explica o
// porquê -- em vez de fingir que funciona lendo o markdown cru em voz alta.
function PlayAnswerButton() {
  return (
    <button
      className="chat-ouvir"
      disabled
      title="Ouvir a resposta -- disponível quando a separação entre texto exibido e texto falado entrar (em construção pela frente B)"
      aria-label="Ouvir a resposta (em breve)"
    >
      <Volume2 size={14} />
    </button>
  );
}

export default ChatAgente;
