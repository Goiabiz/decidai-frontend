import { useEffect, useRef, useState } from 'react';
import { Bot, ChevronDown, Loader2, Maximize2, Mic, Minimize2, Send, Square, User, Waves, X } from 'lucide-react';
import { useSession } from '../contexts/SessionContext';
import { runAgent, runAgentStream, runAgentVoice } from '../services/agentClient';
import { startVoiceActivityDetector, type VoiceActivityHandle } from '../services/voiceActivityDetector';
import { VoiceWaveVisualizer } from './VoiceWaveVisualizer';
import assistantIcon from '../assets/assistant-icon.png';

// Missão "voz mais natural" (28/08/2026): preferência de animação de ondas de voz é por
// navegador/usuário (localStorage), não por tenant -- cada pessoa decide se quer ver, sem
// precisar de schema/backend novo pra uma preferência puramente visual.
const VOICE_WAVE_PREFERENCE_KEY = 'assistant-voice-wave-enabled';

// Missão "assistente flutuante de verdade" (29/08/2026, madrugada, pedido direto do usuário):
// posição arrastável persistida por navegador -- cada pessoa decide onde a Imya fica na tela
// dela, sem precisar de schema/backend novo (mesmo raciocínio já usado pra
// VOICE_WAVE_PREFERENCE_KEY).
const FAB_POSITION_KEY = 'assistant-fab-position';
const FAB_SIZE = 60;
const FAB_MARGIN = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// 2 instâncias podem estar montadas ao mesmo tempo (widget real da Imya, sempre presente no
// Layout + o widget de teste do agente de cliente em Agentes.tsx). Achado real testando (29/08,
// pedido do usuário via screenshot): sem posição salva ainda, as duas nascem no canto padrão
// idêntico (right/bottom do CSS) e ficam uma em cima da outra. A instância "extra" (instanceId
// não vazio) recebe uma posição inicial computada, deslocada 1 FAB + respiro pra esquerda do
// canto padrão -- a Imya (instanceId vazio) nunca muda de comportamento.
function defaultOffsetPosition(instanceId: string): { x: number; y: number } | null {
  if (!instanceId) return null;
  const gap = FAB_SIZE + 16;
  return {
    x: clamp(window.innerWidth - FAB_MARGIN - FAB_SIZE - gap, FAB_MARGIN, window.innerWidth - FAB_SIZE - FAB_MARGIN),
    y: window.innerHeight - FAB_MARGIN - FAB_SIZE,
  };
}

// Evita as duas instâncias ficando abertas (ou uma expandida) ao mesmo tempo -- sem isso o
// painel de uma cobre o da outra por completo. Pub/sub simples via window (mesmo documento,
// sem precisar de Context/Provider novo em Layout.tsx, arquivo compartilhado por muitas
// frentes). Quem abre/expande por último "ganha"; a outra instância fecha sozinha.
const ASSISTANT_ACTIVATE_EVENT = 'v363-assistant-activate';

// Ativação/primeiro contato (29/08/2026, item 5 das prioridades pro teste ao vivo -- v0 do
// corte da Imya). Chave por usuário (não global) pra não suprimir a saudação de outra pessoa
// numa máquina compartilhada, e pra sobreviver a troca de aba/reload sem repetir. Guardado no
// navegador (mesmo padrão de VOICE_WAVE_PREFERENCE_KEY/tour) -- v0 não justifica migration
// nova só pra isso; se algum dia precisar sobreviver a limpar o navegador, vira coluna real.
const FIRST_CONTACT_KEY_PREFIX = 'imya-first-contact-seen-';

function loadFabPosition(storageKey: string): { x: number; y: number } | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') return parsed;
  } catch {
    // localStorage corrompido/indisponível -- cai no posicionamento padrão (canto inferior
    // direito, via CSS), sem quebrar o widget por causa de uma preferência de posição.
  }
  return null;
}

function getAudioContextCtor(): typeof AudioContext {
  return window.AudioContext
    || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!;
}

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
// Manter o MediaRecorder sempre "aquecido" (armado antes da fala começar, ver armRecorder())
// resolve o corte de início de fala, mas o blob acumula silêncio de liderança enquanto ninguém
// fala -- sem limite, uma pausa longa vira um áudio desnecessariamente longo (custo de STT e
// latência). Rearma silenciosamente (sem mandar nada) se ninguém falar por esse tempo.
const IDLE_REARM_MS = 8_000;

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
  /** 'administrador-cliente' (padrão) -- widget real da Imya, staff usando o portal.
   * 'usuario-cliente' -- usado só pelo teste embutido em Agentes.tsx, resolve a identidade
   * do agente de cliente configurado (SUSi) em vez da Imya (client-agent-identity.ts,
   * server-side, ver provider-fallback-executor.ts). */
  mode?: 'administrador-cliente' | 'usuario-cliente';
  /** Ícone customizado (ex.: avatar_url do agente de cliente sendo testado). Sem isso, usa o
   * ícone fixo da Imya (assistantIcon), igual sempre foi. */
  iconUrl?: string;
  /** Cor de fundo por trás do ícone customizado (estilo avatar do Discord -- a imagem fica em
   * `object-fit: contain`, não cobre o círculo todo, pra funcionar com imagem de fundo
   * transparente). Só se aplica quando `iconUrl` está setado; o ícone fixo da Imya não usa. */
  iconBackground?: string;
  /** Saudação de 1º contato (localStorage por usuário, "Eu sou a Imya...") só faz sentido pro
   * widget real e único da plataforma -- desligada por padrão em qualquer instância extra
   * (teste de agente de cliente), senão soaria como a Imya se apresentando dentro do teste da
   * SUSi. */
  enableFirstContact?: boolean;
  /** Distingue as chaves de localStorage (posição arrastada, tour visto, onda de voz) entre
   * instâncias -- sem isso, o widget de teste e o widget real da Imya (ambos podem estar
   * montados ao mesmo tempo) brigariam pela mesma posição/preferência salva. */
  instanceId?: string;
  /** Abre o painel já expandido pro chat, sem exigir clique na FAB primeiro -- usado só pela
   * instância de teste (clicar em "Testar agente" já deve mostrar a conversa, não só a FAB). */
  initialOpen?: boolean;
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

export function FloatingPlatformAssistant({
  pageTitle,
  mode = 'administrador-cliente',
  iconUrl,
  iconBackground,
  enableFirstContact = true,
  instanceId = '',
  initialOpen = false,
}: FloatingPlatformAssistantProps) {
  const keySuffix = instanceId ? `-${instanceId}` : '';
  const fabPositionKey = `${FAB_POSITION_KEY}${keySuffix}`;
  const voiceWavePreferenceKey = `${VOICE_WAVE_PREFERENCE_KEY}${keySuffix}`;
  const resolvedIconUrl = iconUrl || assistantIcon;
  // Estilo de avatar do Discord: cor de fundo escolhida pelo tenant atrás da imagem (que pode
  // ter fundo transparente) -- só quando o ícone é customizado, nunca no ícone fixo da Imya.
  const iconStyle = iconUrl && iconBackground
    ? { background: iconBackground, borderRadius: '50%' }
    : undefined;

  const { session } = useSession();
  const [open, setOpen] = useState(initialOpen);
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
  const idleRearmTimeoutRef = useRef<number | undefined>(undefined);
  const recordingStartedAtRef = useRef<number>(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const vadHandleRef = useRef<VoiceActivityHandle | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const micAudioContextRef = useRef<AudioContext | null>(null);
  const ttsAudioContextRef = useRef<AudioContext | null>(null);
  const [micAnalyser, setMicAnalyser] = useState<AnalyserNode | null>(null);
  const [ttsAnalyser, setTtsAnalyser] = useState<AnalyserNode | null>(null);
  const [voiceWaveEnabled, setVoiceWaveEnabled] = useState(() => window.localStorage.getItem(voiceWavePreferenceKey) !== '0');
  const [fabPosition, setFabPosition] = useState<{ x: number; y: number } | null>(() => loadFabPosition(fabPositionKey) ?? defaultOffsetPosition(instanceId));
  const fabDragRef = useRef<{ startX: number; startY: number; originLeft: number; originTop: number; moved: boolean } | null>(null);
  const [firstContactActive, setFirstContactActive] = useState(false);

  // Dispara uma única vez por usuário (não por tela -- por isso não depende de `context`, ao
  // contrário do tour). Marca a chave como vista IMEDIATAMENTE (antes de qualquer escolha) pra
  // não reabrir se a pessoa navegar pra outra tela no meio -- o efeito de troca de tela abaixo
  // limpa `messages`, mas a saudação de 1o contato não mora em `messages` justamente por isso.
  useEffect(() => {
    if (!enableFirstContact) return;
    const authUserId = session?.user.authUserId;
    if (!authUserId) return;
    const key = `${FIRST_CONTACT_KEY_PREFIX}${authUserId}`;
    if (window.localStorage.getItem(key) === '1') return;
    window.localStorage.setItem(key, '1');
    setFirstContactActive(true);
    setOpen(true);
  }, [session?.user.authUserId, enableFirstContact]);

  const firstContactName = session?.user.displayName?.trim().split(/\s+/)[0] || '';

  const dismissFirstContact = () => setFirstContactActive(false);

  const chooseFirstContactVoice = () => {
    dismissFirstContact();
    void startListening();
  };

  const chooseFirstContactText = () => {
    dismissFirstContact();
  };

  const chooseFirstContactExplore = () => {
    dismissFirstContact();
    setOpen(false);
  };

  const toggleVoiceWave = () => {
    setVoiceWaveEnabled((current) => {
      const next = !current;
      window.localStorage.setItem(voiceWavePreferenceKey, next ? '1' : '0');
      return next;
    });
  };

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

  // Streaming real (SSE) do chat por texto, relay H/agent-run-stream (28/08/2026) -- a bolha
  // de resposta nasce vazia e cresce a cada pedaço que chega, em vez de ficar "Pensando..."
  // parada até o texto inteiro estar pronto. `placeholderSendRef` marca que a bolha vazia
  // atual pertence a um streaming em andamento (só o texto path pusha placeholder assim; voz
  // continua sem, ver sendVoiceMessage) -- usado só pra decidir se mostra o indicador
  // "Pensando..." extra no fim da lista (senão duplicaria com a própria bolha vazia).
  const [placeholderSending, setPlaceholderSending] = useState(false);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setMessages((current) => [...current, { role: 'user', text: trimmed }]);
    setMessage('');
    setSending(true);

    if (!session?.activeClientId) {
      setMessages((current) => [...current, { role: 'assistant', text: AGENT_UNAVAILABLE_MESSAGE }]);
      setSending(false);
      return;
    }

    const activeClientId = session.activeClientId;
    const activeUserId = session.user.authUserId;

    let assistantIndex = -1;
    setPlaceholderSending(true);
    setMessages((current) => {
      assistantIndex = current.length;
      return [...current, { role: 'assistant', text: '' }];
    });

    let streamedAnyDelta = false;
    const appendDelta = (delta: string) => {
      streamedAnyDelta = true;
      setMessages((current) => {
        const target = current[assistantIndex];
        if (!target) return current;
        const next = [...current];
        next[assistantIndex] = { ...target, text: target.text + delta };
        return next;
      });
    };

    try {
      // mode vem da prop (padrão 'administrador-cliente' -- widget real, dentro do portal
      // administrativo, nunca acessado por um cliente final do tenant). Achado real (missão
      // "criar a SUSi de verdade", 29-30/08/2026): sem passar mode explicitamente, o caminho
      // real (agent-run/runAgentVoice) caía no default 'usuario-cliente' -- faria qualquer
      // funcionário do ConectaSUS usando este widget receber a identidade do agente de
      // CLIENTE (SUSi), não a Imya interna. Único lugar que passa 'usuario-cliente' de
      // propósito é a instância de teste embutida em Agentes.tsx (testar o agente configurado).
      let result = await runAgentStream(
        {
          question: trimmed,
          clienteId: activeClientId,
          userId: activeUserId,
          conversationId,
          mode,
          // Achado real (missão "foco voz/contexto/aprendizado", 29/08/2026): o backend só lê
          // context.telaAtual (buildPrompt/business-context-resolver.ts) -- nunca existiu
          // nenhum mapeamento de `screen` pra `telaAtual`, então a tela atual nunca chegava
          // no prompt de verdade, mesmo aparecendo certo na legenda "Lendo: ..." da UI.
          context: { telaAtual: context },
        },
        appendDelta,
      );

      // Streaming indisponível (Edge Function ainda não publicada, rede, etc.) e nada chegou
      // ainda -- cai pro caminho não-streaming de sempre em vez de deixar a bolha vazia parada.
      if (!result.ok && !streamedAnyDelta) {
        result = await runAgent({
          question: trimmed,
          clienteId: activeClientId,
          userId: activeUserId,
          conversationId,
          mode,
          // Achado real (missão "foco voz/contexto/aprendizado", 29/08/2026): o backend só lê
          // context.telaAtual (buildPrompt/business-context-resolver.ts) -- nunca existiu
          // nenhum mapeamento de `screen` pra `telaAtual`, então a tela atual nunca chegava
          // no prompt de verdade, mesmo aparecendo certo na legenda "Lendo: ..." da UI.
          context: { telaAtual: context },
        });
      }

      if (result.ok && result.conversationId) {
        setConversationId(result.conversationId);
      }

      setMessages((current) => {
        const target = current[assistantIndex];
        if (!target) return current;
        const next = [...current];

        if (result.ok) {
          const answer = result.response?.answer ?? target.text;
          const finalText = result.response?.fallbackUsed
            ? `${answer}\n\n(Resposta gerada em modo de contingência — motor principal indisponível no momento.)`
            : answer;
          next[assistantIndex] = { ...target, text: finalText };
        } else {
          // Erro depois de já ter chegado texto por streaming: mantém o que a pessoa já viu
          // em vez de apagar; sem texto nenhum ainda, mostra o erro/indisponibilidade normal.
          next[assistantIndex] = { ...target, text: target.text || result.error || AGENT_UNAVAILABLE_MESSAGE };
        }

        return next;
      });
    } finally {
      setPlaceholderSending(false);
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
    setTtsAnalyser(null);
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
        mode,
        // mode nunca muda durante a vida desta instância do widget (prop fixa por uso --
        // real vs teste de agente de cliente), então referenciar direto aqui é seguro mesmo
        // dentro do closure de voz continua (sem precisar de ref, ao contrário de
        // conversationId/context/session, que mudam de verdade turno a turno).
        // Mesmo achado do sendMessage acima -- backend só lê context.telaAtual.
        context: { telaAtual: contextRef.current },
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
          setTtsAnalyser(null);
          if (voiceModeRef.current === 'speaking') updateVoiceMode('listening');
        };

        // Ondas de voz (missão "voz mais natural", 28/08/2026): analisa a amplitude REAL do
        // áudio que vai tocar -- precisa conectar analyser -> destination também, senão o
        // grafo de áudio para no analyser e a resposta fica muda (createMediaElementSource
        // assume o roteamento de saída do elemento por completo). Cria 1 AudioContext e
        // reaproveita entre falas (não pode chamar createMediaElementSource 2x no mesmo
        // elemento, mas cada resposta já cria um <audio> novo, então não colide).
        try {
          if (!ttsAudioContextRef.current) {
            ttsAudioContextRef.current = new (getAudioContextCtor())();
          }
          const audioCtx = ttsAudioContextRef.current;
          const source = audioCtx.createMediaElementSource(audio);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyser.connect(audioCtx.destination);
          setTtsAnalyser(analyser);
        } catch {
          // Degrada bem: sem analyser, a onda simplesmente não anima -- o áudio toca normal.
          setTtsAnalyser(null);
        }

        updateVoiceMode('speaking');
        void audio.play().catch(() => {});
      } else if (voiceModeRef.current !== 'off') {
        updateVoiceMode('listening');
      }
    } finally {
      setSending(false);
    }
  };

  // Achado real (missão "investigar erros de STT em turnos curtos", 29/08/2026): criar e
  // iniciar o MediaRecorder só reativamente, no exato instante em que o VAD detecta fala,
  // perdia ~150ms do início de CADA turno (latência real de start-up do encoder Opus/muxer
  // WebM -- confirmada empiricamente: capturei o áudio real que o navegador mandava pro
  // backend e transcrevi ele isolado -- "Vou te ensinar..." virava "Te ensinar..." sem o
  // "Vou", mesmo com o áudio de origem limpo e correto). Corrigido mantendo o gravador sempre
  // "aquecido": arma um novo assim que o anterior termina (ou ao começar a escutar), em vez de
  // criar um na hora que a fala começa -- silêncio de liderança no início do blob não atrapalha
  // o STT (testado real), só o corte de fala de verdade que atrapalhava.
  const armRecorder = () => {
    const stream = micStreamRef.current;
    if (!stream) return;

    const mimeType = mimeTypeRef.current;
    const recorder = new MediaRecorder(stream, { mimeType });
    audioChunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      window.clearTimeout(recordingTimeoutRef.current);
      window.clearTimeout(idleRearmTimeoutRef.current);
      const elapsedMs = recordingStartedAtRef.current ? Date.now() - recordingStartedAtRef.current : 0;
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      audioChunksRef.current = [];
      recordingStartedAtRef.current = 0;
      const wasRealUtterance = blob.size > 0 && elapsedMs >= MIN_UTTERANCE_MS;

      // Rearma já, antes de decidir o que fazer com o blob -- o próximo turno não deve pagar
      // o custo de start-up de novo, mesmo enquanto esta resposta ainda está sendo processada.
      if (voiceModeRef.current !== 'off') armRecorder();

      // Ruído breve confundido com fala pelo VAD -- descarta sem chamar o backend.
      if (wasRealUtterance) {
        void sendVoiceMessage(blob, mimeType);
      } else if (voiceModeRef.current === 'recording') {
        updateVoiceMode('listening');
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start();

    // Ninguém falou ainda nesta "armada" -- se passar IDLE_REARM_MS sem a fala começar
    // (voiceMode nunca vira 'recording'), rearma silenciosamente pra não deixar o silêncio de
    // liderança crescer sem limite numa pausa longa do usuário.
    idleRearmTimeoutRef.current = window.setTimeout(() => {
      if (voiceModeRef.current === 'listening' && mediaRecorderRef.current === recorder) {
        recorder.stop();
      }
    }, IDLE_REARM_MS);
  };

  // VAD detectou início de fala -- se o assistente estava falando, isso é barge-in (interrompe
  // a resposta na hora). O gravador já está rodando (armado desde startListening ou desde o
  // fim do turno anterior) -- só marca o instante real da fala, pra medir duração de verdade
  // (MIN_UTTERANCE_MS), e liga o teto de segurança.
  const handleSpeechStart = () => {
    if (voiceModeRef.current === 'recording' || voiceModeRef.current === 'processing' || voiceModeRef.current === 'off') return;

    if (voiceModeRef.current === 'speaking') stopSpeaking();

    window.clearTimeout(idleRearmTimeoutRef.current);
    recordingStartedAtRef.current = Date.now();
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
    window.clearTimeout(idleRearmTimeoutRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    stopSpeaking();
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
    setMicAnalyser(null);
    void micAudioContextRef.current?.close().catch(() => {});
    micAudioContextRef.current = null;
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
      // Arma o gravador já de saída (aquecido antes da 1ª fala) -- ver achado real no
      // comentário de armRecorder() acima.
      armRecorder();
      vadHandleRef.current = startVoiceActivityDetector(stream, {
        onSpeechStart: handleSpeechStart,
        onSpeechEnd: handleSpeechEnd,
      });

      // Onda de voz reagindo ao mic de verdade (missão "voz mais natural", 28/08/2026) --
      // tap independente do MESMO stream que o VAD já usa (Web Audio permite múltiplas
      // MediaStreamSource na mesma stream, não disputa/consome). Nunca conecta a
      // destination -- mesma razão do VAD (evitar eco do próprio mic nos alto-falantes).
      try {
        const audioCtx = new (getAudioContextCtor())();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        micAudioContextRef.current = audioCtx;
        setMicAnalyser(analyser);
      } catch {
        setMicAnalyser(null);
      }
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

  // Anuncia "estou aberto" (ou acabei de expandir) pra qualquer outra instância se fechar --
  // ver ASSISTANT_ACTIVATE_EVENT acima.
  useEffect(() => {
    if (!open) return;
    window.dispatchEvent(new CustomEvent(ASSISTANT_ACTIVATE_EVENT, { detail: { instanceId } }));
  }, [open, expanded, instanceId]);

  // Ouve as outras instâncias -- se outra abriu/expandiu, fecha esta pra não sobrepor.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ instanceId?: string }>).detail;
      if (detail?.instanceId === instanceId) return;
      setOpen(false);
      setExpanded(false);
    };
    window.addEventListener(ASSISTANT_ACTIVATE_EVENT, handler);
    return () => window.removeEventListener(ASSISTANT_ACTIVATE_EVENT, handler);
  }, [instanceId]);

  const openAssistant = () => {
    dismissTour();
    setOpen(true);
  };

  // Arrastar a FAB pra qualquer canto da tela (pedido do usuário, 29/08 madrugada) -- o
  // wrapper inteiro (.v363-assistant) é o elemento fixed único que posiciona tanto a FAB
  // recolhida quanto o painel aberto, então mover ele move os dois juntos: o painel sempre
  // abre onde a FAB estiver. Distingue clique de arraste por distância percorrida (limiar de
  // 6px) -- abaixo disso é clique (abre o assistente), acima é arraste (reposiciona, não abre).
  const handleFabPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== undefined && event.button !== 0) return;
    const wrap = event.currentTarget.closest('.v363-assistant') as HTMLElement | null;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    fabDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originLeft: rect.left,
      originTop: rect.top,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleFabPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = fabDragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    drag.moved = true;

    const next = {
      x: clamp(drag.originLeft + dx, FAB_MARGIN, window.innerWidth - FAB_SIZE - FAB_MARGIN),
      y: clamp(drag.originTop + dy, FAB_MARGIN, window.innerHeight - FAB_SIZE - FAB_MARGIN),
    };
    setFabPosition(next);
    window.localStorage.setItem(fabPositionKey, JSON.stringify(next));
  };

  const handleFabPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = fabDragRef.current;
    fabDragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (!drag?.moved) openAssistant();
  };

  // .v363-assistant.open.expanded já tem um dock fixo (tela cheia à direita) via CSS -- nesse
  // caso especial não aplica a posição arrastada por cima (senão o dock "esquece" de ir até a
  // borda).
  const dockedFullScreen = open && expanded;

  // Achado real testando (Playwright, 29/08 madrugada): usar o mesmo canto (x,y) da FAB como
  // canto do painel aberto empurra o painel pra fora da tela sempre que a FAB é arrastada perto
  // de uma borda (painel é bem maior que a FAB, 360x620 contra 60x60). Em vez de fixar sempre
  // top-left, o painel cresce em direção ao CENTRO da tela a partir de onde a FAB estiver --
  // mesmo princípio de um tooltip/popover que nunca deixa o próprio conteúdo vazar da viewport.
  const assistantPositionStyle = (() => {
    if (!fabPosition || dockedFullScreen) return undefined;
    if (!open) return { left: fabPosition.x, top: fabPosition.y, right: 'auto', bottom: 'auto' };

    const fabCenterX = fabPosition.x + FAB_SIZE / 2;
    const fabCenterY = fabPosition.y + FAB_SIZE / 2;
    const style: Record<string, string | number> = {};

    if (fabCenterX > window.innerWidth / 2) {
      style.right = Math.max(FAB_MARGIN, window.innerWidth - (fabPosition.x + FAB_SIZE));
      style.left = 'auto';
    } else {
      style.left = Math.max(FAB_MARGIN, fabPosition.x);
      style.right = 'auto';
    }

    if (fabCenterY > window.innerHeight / 2) {
      style.bottom = Math.max(FAB_MARGIN, window.innerHeight - (fabPosition.y + FAB_SIZE));
      style.top = 'auto';
    } else {
      style.top = Math.max(FAB_MARGIN, fabPosition.y);
      style.bottom = 'auto';
    }

    return style;
  })();

  return (
    <aside
      className={`v363-assistant ${open ? 'open' : ''} ${expanded ? 'expanded' : ''}`}
      aria-label="Assistente da plataforma"
      style={assistantPositionStyle}
    >
      {!open && (
        <div className={`v363-assistant-fab-wrap ${voiceMode !== 'off' ? `voice-${voiceMode}` : ''}`}>
          {showTour && (
            <div className="v363-assistant-tour" role="status">
              <p>Esse é o assistente da plataforma — clique, ou arraste pra outro canto da tela se preferir.</p>
              <button onClick={dismissTour}>Entendi</button>
            </div>
          )}
          <button
            className="v363-assistant-fab"
            onPointerDown={handleFabPointerDown}
            onPointerMove={handleFabPointerMove}
            onPointerUp={handleFabPointerUp}
            aria-label="Abrir assistente (arraste pra reposicionar)"
          >
            <img src={resolvedIconUrl} alt="" className="v363-assistant-mark" style={iconStyle} />
          </button>
          {/* Escuta contínua sem precisar abrir o painel (pedido do usuário, 29/08 madrugada) --
              fechar o painel nunca desliga o VAD (stopListening só roda no unmount ou aqui),
              então este badge é a única forma de ligar/desligar a escuta com a FAB recolhida. */}
          <button
            type="button"
            className={`v363-assistant-fab-mic ${voiceMode !== 'off' ? voiceMode : ''}`}
            onClick={(event) => { event.stopPropagation(); toggleVoiceMode(); }}
            aria-label={voiceMode === 'off' ? 'Ativar escuta de voz' : 'Desativar escuta de voz'}
            title={voiceMode === 'off' ? 'Ativar escuta de voz' : `Escutando (${voiceMode}) — clique pra parar`}
          >
            {voiceMode === 'off' ? <Mic size={12} /> : voiceMode === 'processing' ? <Loader2 size={12} className="v363-spin" /> : <Square size={12} />}
          </button>
        </div>
      )}

      {open && (
        <div className="v363-assistant-panel">
          <header>
            <div>
              <strong><img src={resolvedIconUrl} alt="" className="v363-assistant-mark v363-assistant-mark-small" style={iconStyle} /> Assistente</strong>
              <small>Lendo: {context}</small>
            </div>
            <div>
              <button onClick={() => setExpanded((value) => !value)} aria-label={expanded ? 'Reduzir' : 'Expandir'}>{expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
              <button onClick={() => setOpen(false)} aria-label="Fechar"><X size={16} /></button>
            </div>
          </header>

          <section className="v363-assistant-body">
            {firstContactActive ? (
              <div className="v363-assistant-first-contact">
                <div className="v363-assistant-bubble assistant">
                  <img src={resolvedIconUrl} alt="" className="v363-assistant-mark v363-assistant-mark-small" style={iconStyle} />
                  <span>
                    {firstContactName ? `Oi, ${firstContactName}! ` : 'Oi! '}
                    Eu sou a Imya, a assistente da DecidAI. Posso te acompanhar por aqui, ou você
                    pode explorar sozinho e me chamar quando quiser.
                  </span>
                </div>
                <div className="v363-assistant-first-contact-actions">
                  <button onClick={chooseFirstContactVoice}>Falar por voz</button>
                  <button onClick={chooseFirstContactText}>Prefiro digitar</button>
                  <button onClick={chooseFirstContactExplore}>Vou explorar sozinho</button>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <p>Posso orientar o uso desta tela, explicar campos, sugerir filtros ou indicar o próximo passo sem bloquear seu trabalho.</p>
            ) : (
              <div className="v363-assistant-thread">
                {messages.map((item, index) => (
                  <div key={index} className={`v363-assistant-bubble ${item.role}`}>
                    {item.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                    <span>{item.role === 'assistant' && !item.text ? 'Pensando...' : item.text}</span>
                  </div>
                ))}
                {sending && !placeholderSending && (
                  <div className="v363-assistant-bubble assistant">
                    <Bot size={14} />
                    <span>Pensando...</span>
                  </div>
                )}
              </div>
            )}
            {!firstContactActive && (
              <div className="v363-assistant-suggestions">
                {suggestions.map((item) => (
                  <button key={item} disabled={sending} onClick={() => void sendMessage(item)}>{item}</button>
                ))}
              </div>
            )}
          </section>

          {voiceMode !== 'off' && (
            <div className="v363-voice-legend" role="status">
              <span className={`v363-voice-legend-item listening ${voiceMode === 'listening' ? 'active' : ''}`}><i /> Pode falar</span>
              <span className={`v363-voice-legend-item recording ${voiceMode === 'recording' ? 'active' : ''}`}><i /> Ouvindo você</span>
              <span className={`v363-voice-legend-item processing ${voiceMode === 'processing' ? 'active' : ''}`}><i /> Pensando</span>
              <span className={`v363-voice-legend-item speaking ${voiceMode === 'speaking' ? 'active' : ''}`}><i /> Respondendo</span>
              <button
                type="button"
                className={`v363-voice-wave-toggle ${voiceWaveEnabled ? 'active' : ''}`}
                onClick={toggleVoiceWave}
                aria-pressed={voiceWaveEnabled}
                aria-label={voiceWaveEnabled ? 'Desativar animação de ondas de voz' : 'Ativar animação de ondas de voz'}
                title={voiceWaveEnabled ? 'Desativar animação de ondas de voz' : 'Ativar animação de ondas de voz'}
              >
                <Waves size={14} />
              </button>
            </div>
          )}

          {voiceMode !== 'off' && voiceWaveEnabled && (
            <div className="v363-voice-wave-row">
              <VoiceWaveVisualizer
                analyser={voiceMode === 'speaking' ? ttsAnalyser : micAnalyser}
                state={voiceMode}
                enabled={voiceWaveEnabled}
              />
            </div>
          )}

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
