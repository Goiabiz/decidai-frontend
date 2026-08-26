// Voice Activity Detection (Onda L, §55-56 emenda "Imya", frente G — v2 além do push-to-talk
// do v1). Detecta início/fim de fala por energia do sinal (RMS), 100% local via Web Audio
// API — sem modelo/dependência nova, sem credencial, conforme decisão do usuário (23/08/2026).
// Limiar não é fixo: calibra o piso de ruído do ambiente nos primeiros instantes de escuta,
// já que microfone/ambiente variam demais pra um número único funcionar em todo lugar.

export type VoiceActivityCallbacks = {
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
};

export type VoiceActivityHandle = {
  stop: () => void;
};

export type VoiceActivityOptions = {
  /** Silêncio contínuo necessário pra considerar a fala encerrada (fim do turno). */
  silenceTimeoutMs?: number;
  /** Janela inicial só pra medir o ruído de fundo, antes de armar a detecção de verdade. */
  calibrationMs?: number;
  /** Intervalo entre leituras do analisador. */
  checkIntervalMs?: number;
};

const DEFAULT_SILENCE_TIMEOUT_MS = 700;
const DEFAULT_CALIBRATION_MS = 500;
const DEFAULT_CHECK_INTERVAL_MS = 50;
const SPEECH_THRESHOLD_MULTIPLIER = 2.5;
const MIN_SPEECH_THRESHOLD = 0.015;

function computeRms(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

/**
 * Começa a monitorar um MediaStream (microfone) e chama onSpeechStart/onSpeechEnd conforme a
 * energia do sinal cruza o limiar calibrado. Quem chama é dono do MediaStream (não para as
 * tracks aqui) — só o AudioContext/analyser criados internamente são liberados em stop().
 */
export function startVoiceActivityDetector(
  stream: MediaStream,
  callbacks: VoiceActivityCallbacks,
  options: VoiceActivityOptions = {},
): VoiceActivityHandle {
  const silenceTimeoutMs = options.silenceTimeoutMs ?? DEFAULT_SILENCE_TIMEOUT_MS;
  const calibrationMs = options.calibrationMs ?? DEFAULT_CALIBRATION_MS;
  const checkIntervalMs = options.checkIntervalMs ?? DEFAULT_CHECK_INTERVAL_MS;

  const AudioContextCtor = window.AudioContext
    || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioContextCtor();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 1024;
  // Nunca conectar analyser -> destination: isso rotearia o próprio microfone pros
  // alto-falantes (feedback/eco) -- a análise não precisa de saída de áudio nenhuma.
  source.connect(analyser);

  const buffer = new Float32Array(analyser.fftSize);
  const startedAt = Date.now();
  let noiseFloor = 0;
  let calibrationSamples = 0;
  let calibrated = false;
  let speechThreshold = MIN_SPEECH_THRESHOLD;
  let speaking = false;
  let silenceStartedAt: number | null = null;

  const intervalId = window.setInterval(() => {
    analyser.getFloatTimeDomainData(buffer);
    const rms = computeRms(buffer);

    if (!calibrated) {
      noiseFloor = (noiseFloor * calibrationSamples + rms) / (calibrationSamples + 1);
      calibrationSamples += 1;
      if (Date.now() - startedAt >= calibrationMs) {
        calibrated = true;
        speechThreshold = Math.max(noiseFloor * SPEECH_THRESHOLD_MULTIPLIER, MIN_SPEECH_THRESHOLD);
      }
      return;
    }

    if (rms > speechThreshold) {
      silenceStartedAt = null;
      if (!speaking) {
        speaking = true;
        callbacks.onSpeechStart();
      }
      return;
    }

    if (!speaking) return;

    if (silenceStartedAt === null) {
      silenceStartedAt = Date.now();
    } else if (Date.now() - silenceStartedAt >= silenceTimeoutMs) {
      speaking = false;
      silenceStartedAt = null;
      callbacks.onSpeechEnd();
    }
  }, checkIntervalMs);

  return {
    stop: () => {
      window.clearInterval(intervalId);
      try {
        source.disconnect();
        analyser.disconnect();
      } catch {
        // já desconectado -- sem problema.
      }
      void audioContext.close().catch(() => {});
    },
  };
}
