import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

type ConfirmTone = 'default' | 'danger' | 'warning';

type ConfirmRequest = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onConfirm?: () => void;
};

export function AppConfirmModal() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<ConfirmRequest>;
      setRequest(customEvent.detail);
    };

    window.addEventListener('app-confirm', handler);
    return () => window.removeEventListener('app-confirm', handler);
  }, []);

  if (!request) return null;

  const confirm = () => {
    request.onConfirm?.();
    setRequest(null);
  };

  return (
    <div className="modal-backdrop cadastro-modal-backdrop app-confirm-backdrop">
      <section className={`app-confirm-modal ${request.tone || 'default'}`}>
        <header>
          <strong>{request.title}</strong>
          <button className="icon-btn" onClick={() => setRequest(null)} aria-label="Fechar confirmação"><X size={18} /></button>
        </header>
        <p>{request.description}</p>
        <footer>
          <button onClick={() => setRequest(null)}>{request.cancelLabel || 'Cancelar'}</button>
          <button className={request.tone === 'danger' ? 'danger' : 'primary'} onClick={confirm}>{request.confirmLabel || 'Confirmar'}</button>
        </footer>
      </section>
    </div>
  );
}
