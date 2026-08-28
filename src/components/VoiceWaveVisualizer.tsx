import { useEffect, useRef } from 'react';

// Missão "voz mais natural" (28/08/2026, pedido direto do usuário): animação de ondas de voz
// enquanto o assistente fala/ouve, reagindo à amplitude REAL do áudio (não um loop decorativo
// genérico) -- é o que faz a pessoa sentir "está me ouvindo de verdade", não só "tem uma
// animação bonita". Canvas + requestAnimationFrame (leve, sem lib nova) em vez de re-renderizar
// React a cada frame. Só roda o loop de desenho quando de fato há um AnalyserNode conectado a
// um sinal real (mic ou TTS) -- estado "processing" (sem áudio) usa um pulso CSS parado, sem
// custo de rAF/canvas nenhum.

export type VoiceWaveState = 'idle' | 'listening' | 'recording' | 'processing' | 'speaking';

export type VoiceWaveVisualizerProps = {
  /** Nó de análise já conectado a um sinal real (mic durante escuta, TTS durante fala). Ausente = sem sinal pra reagir. */
  analyser: AnalyserNode | null;
  state: VoiceWaveState;
  /** Preferência do usuário (persistida por quem usa este componente) -- false desmonta tudo, zero custo. */
  enabled: boolean;
};

// Mesma paleta de .v363-voice-legend-item (v36_3_cleanup.css) -- a onda reforça visualmente
// o mesmo código de cor que a legenda de texto já usa, não inventa um novo.
const STATE_COLOR: Record<VoiceWaveState, string> = {
  idle: '#94a3b8',
  listening: '#3b82f6',
  recording: '#d64545',
  processing: '#7c5cff',
  speaking: '#16a34a',
};

const BAR_COUNT = 24;

export function VoiceWaveVisualizer({ analyser, state, enabled }: VoiceWaveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Respeita a preferência do sistema por menos movimento -- desenha 1 frame estático em
    // vez de animar continuamente, sem precisar de outro caminho de código.
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const widthCss = canvas.clientWidth || 120;
    const heightCss = canvas.clientHeight || 28;
    canvas.width = widthCss * dpr;
    canvas.height = heightCss * dpr;
    ctx.scale(dpr, dpr);

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    const color = STATE_COLOR[state];
    const barGap = 2;
    const barWidth = (widthCss - barGap * (BAR_COUNT - 1)) / BAR_COUNT;

    const drawFrame = () => {
      analyser.getByteFrequencyData(freqData);
      ctx.clearRect(0, 0, widthCss, heightCss);

      // Agrupa os bins de frequência reais em BAR_COUNT baldes (média) -- não é 1 barra por
      // bin bruto, ficaria denso demais visualmente pra uma faixa deste tamanho.
      const binsPerBar = Math.max(1, Math.floor(freqData.length / BAR_COUNT));
      for (let i = 0; i < BAR_COUNT; i += 1) {
        let sum = 0;
        for (let j = 0; j < binsPerBar; j += 1) sum += freqData[i * binsPerBar + j] ?? 0;
        const amplitude = sum / binsPerBar / 255;
        const barHeight = Math.max(2, amplitude * heightCss);
        const x = i * (barWidth + barGap);
        const y = (heightCss - barHeight) / 2;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.35 + amplitude * 0.65;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      if (!reducedMotion) rafRef.current = requestAnimationFrame(drawFrame);
    };

    drawFrame();

    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
    };
  }, [analyser, enabled, state]);

  if (!enabled) return null;

  if (!analyser) {
    // Sem sinal real pra reagir (ex.: "processing") -- pulso CSS simples em vez de canvas
    // vazio ou barra falsa que fingiria reagir a áudio que não existe.
    return (
      <div className="v363-voice-wave-pill" aria-hidden="true">
        <div className="v363-voice-wave-pulse">
          <i style={{ background: STATE_COLOR[state] }} />
          <i style={{ background: STATE_COLOR[state] }} />
          <i style={{ background: STATE_COLOR[state] }} />
        </div>
      </div>
    );
  }

  return (
    <div className="v363-voice-wave-pill">
      <canvas
        ref={canvasRef}
        className="v363-voice-wave-canvas"
        width={140}
        height={28}
        aria-hidden="true"
      />
    </div>
  );
}

export default VoiceWaveVisualizer;
