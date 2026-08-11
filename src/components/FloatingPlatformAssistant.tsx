import { useEffect, useState } from 'react';
import { Bot, ChevronDown, Maximize2, Minimize2, Send, Sparkles, User, X } from 'lucide-react';
import { useSession } from '../contexts/SessionContext';
import { runAgent } from '../services/agentClient';

const AGENT_UNAVAILABLE_MESSAGE = 'Ainda não consigo processar isso de verdade — o serviço de IA da plataforma está sendo publicado. Assim que estiver no ar, passo a responder com o motor real.';

type FloatingPlatformAssistantProps = {
  pageTitle?: string;
};

type AssistantMessage = {
  role: 'user' | 'assistant';
  text: string;
};

const DIACRITICS_PATTERN = new RegExp(String.fromCharCode(0x5b, 0x5c, 0x75, 0x30, 0x33, 0x30, 0x30, 0x2d, 0x5c, 0x75, 0x30, 0x33, 0x36, 0x66, 0x5d), 'g');

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_PATTERN, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function FloatingPlatformAssistant({ pageTitle }: FloatingPlatformAssistantProps) {
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [showTour, setShowTour] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);

  const [context, setContext] = useState('tela atual');

  useEffect(() => {
    const readContext = () => {
      const heading = document.querySelector('h1')?.textContent?.trim();
      const title = pageTitle || heading || 'tela atual';
      setContext((current) => (title === current ? current : title));
    };

    readContext();

    // O widget é montado uma única vez no shell do app (não por rota), então a
    // navegação entre telas não remonta o componente — observar o <h1> é como
    // detectamos a troca de tela pra atualizar o contexto e reabilitar o tour.
    const observer = new MutationObserver(readContext);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [pageTitle]);

  useEffect(() => {
    setMessages([]);
    setConversationId(undefined);
    if (open) return;

    const tourKey = `assistant-tour-seen-${slugify(context)}`;
    const alreadySeen = window.localStorage.getItem(tourKey) === '1';
    if (alreadySeen) {
      setShowTour(false);
      return;
    }

    const timer = window.setTimeout(() => setShowTour(true), 900);
    return () => window.clearTimeout(timer);
  }, [context]);

  const dismissTour = () => {
    setShowTour(false);
    window.localStorage.setItem(`assistant-tour-seen-${slugify(context)}`, '1');
  };

  const suggestions = [
    'Explique os campos desta tela',
    'O que devo configurar primeiro?',
    'Quais filtros devo usar?',
  ];

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setMessages((current) => [...current, { role: 'user', text: trimmed }]);
    setMessage('');
    setSending(true);

    try {
      if (!session?.activeClientId) {
        setMessages((current) => [...current, { role: 'assistant', text: AGENT_UNAVAILABLE_MESSAGE }]);
        return;
      }

      const result = await runAgent({
        question: trimmed,
        clienteId: session.activeClientId,
        userId: session.user.authUserId,
        conversationId,
        context: { screen: context },
      });

      if (result.ok && result.conversationId) {
        setConversationId(result.conversationId);
      }

      const answer = result.ok && result.response?.answer ? result.response.answer : AGENT_UNAVAILABLE_MESSAGE;
      const text = result.response?.fallbackUsed
        ? `${answer}\n\n(Resposta gerada em modo de contingência — motor principal indisponível no momento.)`
        : answer;
      setMessages((current) => [...current, { role: 'assistant', text }]);
    } finally {
      setSending(false);
    }
  };

  const openAssistant = () => {
    dismissTour();
    setOpen(true);
  };

  return (
    <aside className={`v363-assistant ${open ? 'open' : ''} ${expanded ? 'expanded' : ''}`} aria-label="Assistente da plataforma">
      {!open && (
        <div className="v363-assistant-fab-wrap">
          {showTour && (
            <div className="v363-assistant-tour" role="status">
              <p>Esse é o assistente da plataforma — clique se precisar de ajuda com esta tela.</p>
              <button onClick={dismissTour}>Entendi</button>
            </div>
          )}
          <button className="v363-assistant-fab" onClick={openAssistant} aria-label="Abrir assistente">
            <Sparkles size={24} />
          </button>
        </div>
      )}

      {open && (
        <div className="v363-assistant-panel">
          <header>
            <div>
              <strong><Bot size={18} /> Assistente</strong>
              <small>Lendo: {context}</small>
            </div>
            <div>
              <button onClick={() => setExpanded((value) => !value)} aria-label={expanded ? 'Reduzir' : 'Expandir'}>{expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
              <button onClick={() => setOpen(false)} aria-label="Fechar"><X size={16} /></button>
            </div>
          </header>

          <section className="v363-assistant-body">
            {messages.length === 0 ? (
              <p>Posso orientar o uso desta tela, explicar campos, sugerir filtros ou indicar o próximo passo sem bloquear seu trabalho.</p>
            ) : (
              <div className="v363-assistant-thread">
                {messages.map((item, index) => (
                  <div key={index} className={`v363-assistant-bubble ${item.role}`}>
                    {item.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                    <span>{item.text}</span>
                  </div>
                ))}
                {sending && (
                  <div className="v363-assistant-bubble assistant">
                    <Bot size={14} />
                    <span>Pensando...</span>
                  </div>
                )}
              </div>
            )}
            <div className="v363-assistant-suggestions">
              {suggestions.map((item) => (
                <button key={item} disabled={sending} onClick={() => void sendMessage(item)}>{item}</button>
              ))}
            </div>
          </section>

          <footer>
            <button className="v363-assistant-plus" aria-label="Mais opções"><ChevronDown size={16} /></button>
            <input
              value={message}
              disabled={sending}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') void sendMessage(message); }}
              placeholder="Pergunte ao assistente..."
            />
            <button className="v363-assistant-send" disabled={sending} onClick={() => void sendMessage(message)} aria-label="Enviar"><Send size={16} /></button>
          </footer>
        </div>
      )}
    </aside>
  );
}

export default FloatingPlatformAssistant;
