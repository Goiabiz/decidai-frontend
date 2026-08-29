import { useEffect, useRef, useState } from 'react';
import {
  BellPlus,
  CheckCircle2,
  Link2,
  Send,
  Share2,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';

type Props = {
  id: string;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  align?: 'left' | 'right';
};

export function AlertActionsMenu({ id, openMenuId, setOpenMenuId, align = 'right' }: Props) {
  const isOpen = openMenuId === id;
  const ref = useRef<HTMLDivElement | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target)) return;
      setOpenMenuId(null);
      setFeedback('');
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen, setOpenMenuId]);

  const closeWithFeedback = (label: string) => {
    setFeedback(`"${label}" ainda não está disponível para este item.`);
    window.setTimeout(() => {
      setOpenMenuId(null);
      setFeedback('');
    }, 1600);
  };

  return (
    <div className="alert-actions-menu-wrap" ref={ref}>
      <button
        className="row-icon-btn"
        title="Mais opções"
        type="button"
        onClick={() => setOpenMenuId(isOpen ? null : id)}
      >
        •••
      </button>

      {isOpen && (
        <div className={`alert-actions-menu align-${align}`}>
          <button onClick={() => closeWithFeedback('Divulgar alerta')}><Send size={15} /> Divulgar alerta</button>
          <button onClick={() => closeWithFeedback('Encaminhar para tarefa')}><BellPlus size={15} /> Encaminhar para tarefa</button>
          <button onClick={() => closeWithFeedback('Vincular tarefa existente')}><Link2 size={15} /> Vincular tarefa existente</button>
          <button onClick={() => closeWithFeedback('Gerar orientação')}><Sparkles size={15} /> Gerar orientação</button>
          <button onClick={() => closeWithFeedback('Acionar agente')}><Sparkles size={15} /> Acionar agente</button>
          <button onClick={() => closeWithFeedback('Compartilhar')}><Share2 size={15} /> Compartilhar</button>
          <button onClick={() => closeWithFeedback('Concluir alerta')}><CheckCircle2 size={15} /> Concluir alerta</button>
          <button className="danger" onClick={() => closeWithFeedback('Cancelar')}><X size={15} /> Cancelar</button>
          <button className="danger" onClick={() => closeWithFeedback('Excluir')}><Trash2 size={15} /> Excluir</button>
          {feedback && <span className="menu-feedback">{feedback}</span>}
        </div>
      )}
    </div>
  );
}
