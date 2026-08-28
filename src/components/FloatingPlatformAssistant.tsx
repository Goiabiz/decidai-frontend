import { useEffect, useRef, useState } from 'react';
import { Bot, ChevronDown, Loader2, Maximize2, Mic, Minimize2, Send, Sparkles, Square, User, X } from 'lucide-react';
import { useSession } from '../contexts/SessionContext';
import { runAgent, runAgentVoice } from '../services/agentClient';
import { startVoiceActivityDetector, type VoiceActivityHandle } from '../services/voiceActivityDetector';

const AGENT_UNAVAILABLE_MESSAGE = 'Ainda não consigo processar isso de verdade — o serviço de IA da plataforma está sendo publicado. Assim que estiver no ar, passo a responder com o motor real.';

// Onda L (§55-56 emenda "Imya", frente G). v1 (23/08/2026) era push-to-talk manual;
// v2 (24/08/2026, ainda um-falante-por-vez, sem diarização/endereçamento) troca isso por
// escuta contínua real: VAD (voiceActivityDetector.ts) detecta sozinho quando a fala começa e
// termina -- não precisa mais segurar/clicar o botão pra cada frase -- e barge-in interrompe o
// TTS na hora que o usuário começa a falar por cima da resposta. Corte de duração evita
// estourar o limite de corpo HTTP do runtime (AGENT_HTTP_MAX_BODY_BYTES, 1MB por padrão) -- 60s
// de webm/opus fica bem abaixo disso mesmo em base64.
const MAX_RECORDING_MS = 60_000;
// Falsos positivos do VAD (ruído breve cruzando o limiar) viram gravações muito curtas --
// descarta sem nem chamar o backend em vez de gastar uma chamada de STT numa transcrição vazia.
const MIN_UTTERANCE_MS = 350;

// 'processing' -- achado real testando ao vivo (usuário, 28/08): sem esse estado, o ícone
// ficava vermelho ("gravando") do fim da fala até a resposta chegar (pode passar de 20-60s),
// sem diferenciar "ainda te escutando" de "já ouvi, estou pensando" -- parecia travado.
type VoiceMode = 'off' | 'listening' | 'recording' | 'processing' | 'speaking';

function pickSupportedAudioMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  for (const candidate of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(candidate)) return candidate;
  }
  return 'audio/webm';
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // data:audio/webm;base64,AAAA... -- só a parte depois da vírgula interessa.
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler áudio gravado.'));
    reader.readAsDataURL(blob);
  });
}

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
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('off');
  const voiceModeRef = useRef<VoiceMode>('off');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<number | undefined>(undefined);
  const recordingStartedAtRef = useRef<number>(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const vadHandleRef = useRef<VoiceActivityHandle | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const updateVoiceMode = (mode: VoiceMode) => {
    voiceModeRef.current = mode;
    setVoiceMode(mode);
  };

  const [context, setContext] = useState('tela atual');

  // A escuta contínua (VAD) fica ligada por vários turnos seguidos sem recriar o listener --
  // os callbacks passados pro VAD na 1a chamada de startListening() ficam presos aos valores
  // de conversationId/context/session daquele render específico (closure), então sem essas
  // refs cada turno de voz perderia a conversa (conversationId sempre undefined) ou o
  // contexto de tela certo depois do 1o turno. sendMessage (texto) não sofre disso porque é
  // religado a cada render via o próprio JSX.
  const conversationIdRef = useRef(conversationId);
  const contextRef = useRef(context);
  const sessionRef = useRef(session);
  useEffect(() => { conversationIdRef.current = conversationId; }, [conversationId]);
  useEffect(() => { contextRef.current = context; }, [context]);
  useEffect(() => { sessionRef.current = session; }, [session]);

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

  // Interrompe a fala do assistente na hora (barge-in) -- chamado tanto quando o usuário
  // clica pra desligar a escuta quanto quando o VAD detecta que ele começou a falar por cima.
  const stopSpeaking = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
  };

  const sendVoiceMessage = async (audioBlob: Blob, mimeType: string) => {
    if (sending) return;

    const activeSession = sessionRef.current;
    if (!activeSession?.activeClientId) {
      setMessages((current) => [...current, { role: 'assistant', text: AGENT_UNAVAILABLE_MESSAGE }]);
      return;
    }

    if (voiceModeRef.current !== 'off') updateVoiceMode('processing');
    setSending(true);
    try {
      const audioBase64 = await blobToBase64(audioBlob);

      const result = await runAgentVoice({
        audioBase64,
        audioMimeType: mimeType,
        clienteId: activeSession.activeClientId,
        userId: activeSession.user.authUserId,
        conversationId: conversationIdRef.current,
        context: { screen: contextRef.current },
      });

      if (result.ok && result.conversationId) {
        setConversationId(result.conversationId);
      }

      const transcript = result.response?.transcript;
      setMessages((current) => [...current, { role: 'user', text: transcript || '(áudio enviado)' }]);

      if (!result.ok) {
        setMessages((current) => [...current, { role: 'assistant', text: result.error || AGENT_UNAVAILABLE_MESSAGE }]);
        return;
      }

      const answer = result.response?.answer ? result.response.answer : AGENT_UNAVAILABLE_MESSAGE;
      const text = result.response?.fallbackUsed
        ? `${answer}\n\n(Resposta gerada em modo de contingência — motor principal indisponível no momento.)`
        : answer;
      setMessages((current) => [...current, { role: 'assistant', text }]);

      // Escuta contínua (VAD): só entra em "falando" (e só toca o áudio) se o usuário não
      // desligou a escuta enquanto a resposta processava -- senão fica tocando por cima do
      // silêncio que ele já pediu.
      if (result.response?.answerAudioBase64 && voiceModeRef.current !== 'off') {
        const audio = new Audio(`data:${result.response.answerAudioMimeType || 'audio/mpeg'};base64,${result.response.answerAudioBase64}`);
        currentAudioRef.current = audio;
        audio.onended = () => {
          if (currentAudioRef.current === audio) currentAudioRef.current = null;
          if (voiceModeRef.current === 'speaking') updateVoiceMode('listening');
        };
        updateVoiceMode('speaking');
        void audio.play().catch(() => {});
      } else if (voiceModeRef.current !== 'off') {
        updateVoiceMode('listening');
      }
    } finally {
      setSending(false);
    }
  };

  // VAD detectou início de fala -- se o assistente estava falando, isso é barge-in (interrompe
  // a resposta na hora); em seguida (ou já em escuta normal) começa a gravar o novo turno.
  const handleSpeechStart = () => {
    if (voiceModeRef.current === 'recording' || voiceModeRef.current === 'processing' || voiceModeRef.current === 'off') return;

    if (voiceModeRef.current === 'speaking') stopSpeaking();

    const stream = micStreamRef.current;
    if (!stream) return;

    const mimeType = mimeTypeRef.current;
    const recorder = new MediaRecorder(stream, { mimeType });
    audioChunksRef.current = [];
    recordingStartedAtRef.current = Date.now();

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      window.clearTimeout(recordingTimeoutRef.current);
      const elapsedMs = Date.now() - recordingStartedAtRef.current;
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      audioChunksRef.current = [];
      // Ruído breve confundido com fala pelo VAD -- descarta sem chamar o backend.
      if (blob.size > 0 && elapsedMs >= MIN_UTTERANCE_MS) {
        void sendVoiceMessage(blob, mimeType);
      } else if (voiceModeRef.current === 'recording') {
        updateVoiceMode('listening');
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    updateVoiceMode('recording');
    recordingTimeoutRef.current = window.setTimeout(() => mediaRecorderRef.current?.stop(), MAX_RECORDING_MS);
  };

  // VAD detectou silêncio suficiente pra considerar a fala encerrada -- fecha a gravação
  // deste turno (o próprio onstop decide se manda pro backend ou descarta por ser curto demais).
  const handleSpeechEnd = () => {
    if (voiceModeRef.current !== 'recording') return;
    mediaRecorderRef.current?.stop();
  };

  const stopListening = () => {
    vadHandleRef.current?.stop();
    vadHandleRef.current = null;
    window.clearTimeout(recordingTimeoutRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    stopSpeaking();
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
    updateVoiceMode('off');
  };

  const startListening = async () => {
    if (voiceModeRef.current !== 'off') return;

    try {
      // echoCancellation: essencial pro barge-in não confundir o próprio TTS tocando nos
      // alto-falantes com o usuário falando -- sem isso o microfone captaria a resposta do
      // assistente de volta e o VAD interpretaria como o usuário interrompendo a si mesmo.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      micStreamRef.current = stream;
      mimeTypeRef.current = pickSupportedAudioMimeType();
      updateVoiceMode('listening');
      vadHandleRef.current = startVoiceActivityDetector(stream, {
        onSpeechStart: handleSpeechStart,
        onSpeechEnd: handleSpeechEnd,
      });
    } catch {
      setMessages((current) => [...current, { role: 'assistant', text: 'Não consegui acessar o microfone — verifique a permissão do navegador pra este site.' }]);
    }
  };

  const toggleVoiceMode = () => {
    if (voiceMode === 'off') {
      void startListening();
    } else {
      stopListening();
    }
  };

  useEffect(() => () => stopListening(), []);

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
              placeholder={
                voiceMode === 'recording' ? 'Ouvindo você...'
                : voiceMode === 'processing' ? 'Pensando...'
                : voiceMode === 'speaking' ? 'Respondendo (fale para interromper)...'
                : voiceMode === 'listening' ? 'Escutando...'
                : 'Pergunte ao assistente...'
              }
            />
            <button
              className={`v363-assistant-mic ${voiceMode !== 'off' ? voiceMode : ''}`}
              onClick={toggleVoiceMode}
              aria-label={voiceMode === 'off' ? 'Falar com o assistente' : 'Parar escuta de voz'}
              title={voiceMode === 'off' ? 'Falar com o assistente' : 'Parar escuta de voz'}
            >
              {voiceMode === 'off' ? <Mic size={16} /> : voiceMode === 'processing' ? <Loader2 size={16} className="v363-spin" /> : <Square size={16} />}
            </button>
            <button className="v363-assistant-send" disabled={sending} onClick={() => void sendMessage(message)} aria-label="Enviar"><Send size={16} /></button>
          </footer>
        </div>
      )}
    </aside>
  );
}

export default FloatingPlatformAssistant;
