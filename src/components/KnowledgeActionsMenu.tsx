import { useEffect, useRef, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  Copy,
  FileDown,
  FileSpreadsheet,
  FileText,
  Mail,
  Printer,
  Share2,
  Trash2,
  X
} from 'lucide-react';
import { confirmApp } from '../lib/appConfirm';
import { showAppToast } from '../lib/appToast';

type Props = {
  id: string;
  title: string;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  align?: 'left' | 'right';
};

export function KnowledgeActionsMenu({ id, title, openMenuId, setOpenMenuId, align = 'right' }: Props) {
  const isOpen = openMenuId === id;
  const [shareOpen, setShareOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen && !shareOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      setOpenMenuId(null);
      setShareOpen(false);
      setShareFeedback('');
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen, shareOpen, setOpenMenuId]);

  const toggleMenu = () => {
    setShareOpen(false);
    setShareFeedback('');
    setOpenMenuId(isOpen ? null : id);
  };

  const openShare = () => {
    setOpenMenuId(id);
    setShareOpen(true);
    setShareFeedback('');
  };

  const copyShareLink = async () => {
    const link = `${window.location.origin}/?detail=${encodeURIComponent(title)}`;
    try {
      await navigator.clipboard.writeText(link);
      setShareFeedback('Link copiado.');
    } catch {
      setShareFeedback('Não foi possível copiar automaticamente. Copie pela barra do navegador.');
    }
  };

  const sendByEmail = () => {
    setShareFeedback('Para enviar por e-mail, conecte uma conta em Parametrização > Integrações.');
  };

  const notAvailable = (label: string) => {
    setOpenMenuId(null);
    showAppToast(`"${label}" ainda não está disponível para este item.`, 'info');
  };

  const print = () => {
    setOpenMenuId(null);
    window.print();
  };

  const remove = async () => {
    const confirmed = await confirmApp({
      title: 'Excluir',
      description: `Excluir "${title}"? Esta ação ainda não está disponível para este item.`,
      confirmLabel: 'Entendi',
      tone: 'danger',
    });
    setOpenMenuId(null);
    if (confirmed) showAppToast('Exclusão ainda não está disponível para este item.', 'info');
  };

  return (
    <div className="knowledge-actions-wrap" ref={menuRef}>
      <button className="row-icon-btn" title="Mais opções" onClick={toggleMenu}>•••</button>

      {isOpen && !shareOpen && (
        <div className={`knowledge-more-menu align-${align}`}>
          <button onClick={() => notAvailable('Ativar conhecimento')}><CheckCircle2 size={15} /> Ativar conhecimento</button>
          <button onClick={() => notAvailable('Cancelar conhecimento')}><X size={15} /> Cancelar conhecimento</button>
          <button onClick={() => notAvailable('Arquivar')}><Archive size={15} /> Arquivar</button>
          <button onClick={print}><Printer size={15} /> Imprimir</button>
          <button onClick={() => notAvailable('Exportar PDF')}><FileDown size={15} /> Exportar PDF</button>
          <button onClick={() => notAvailable('Exportar XLS')}><FileSpreadsheet size={15} /> Exportar XLS</button>
          <button onClick={() => notAvailable('Exportar DOC')}><FileText size={15} /> Exportar DOC</button>
          <button onClick={() => notAvailable('Exportar XML')}><FileText size={15} /> Exportar XML</button>
          <button onClick={() => notAvailable('Exportar CSV')}><FileText size={15} /> Exportar CSV</button>
          <button onClick={openShare}><Share2 size={15} /> Compartilhar</button>
          <button className="danger" onClick={remove}><Trash2 size={15} /> Excluir</button>
        </div>
      )}

      {isOpen && shareOpen && (
        <div className={`knowledge-share-popover align-${align}`}>
          <div className="share-popover-header">
            <strong>Compartilhar conhecimento</strong>
            <button className="icon-btn small" onClick={() => setShareOpen(false)}><X size={14} /></button>
          </div>
          <label>
            <span>Nome, equipe ou e-mail</span>
            <input placeholder="Ex.: Maria, equipe suporte, email@cliente.com" />
          </label>
          <label>
            <span>Mensagem opcional</span>
            <textarea placeholder="Inclua uma mensagem para o destinatário..." rows={3} />
          </label>
          <div className="share-actions">
            <button onClick={copyShareLink}><Copy size={15} /> Copiar link</button>
            <button className="primary" onClick={sendByEmail}><Mail size={15} /> Enviar por e-mail</button>
          </div>
          {shareFeedback && <p className="share-feedback">{shareFeedback}</p>}
        </div>
      )}
    </div>
  );
}
