import { useEffect, useRef, useState } from 'react';
import {
  Archive,
  ArrowRightCircle,
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
import {
  deleteKnowledgeEntry,
  transitionKnowledgeEntry,
  KNOWLEDGE_LIFECYCLE_LABELS,
  KNOWLEDGE_LIFECYCLE_NEXT,
  type KnowledgeLifecycleState,
} from '../services/baseConhecimento';

const KNOWLEDGE_LIFECYCLE_STATES = new Set<string>([
  'CANDIDATE', 'PRIVATE', 'PENDING_APPROVAL', 'VALIDATED', 'SHARED', 'SUPERSEDED', 'ARCHIVED',
]);

const isKnowledgeLifecycleState = (value?: string): value is KnowledgeLifecycleState =>
  !!value && KNOWLEDGE_LIFECYCLE_STATES.has(value);

type Props = {
  id: string;
  title: string;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  align?: 'left' | 'right';
  entryId?: string;
  lifecycleState?: string;
  clienteId?: string | null;
  onDone?: () => void;
  onClosePanel?: () => void;
};

export function KnowledgeActionsMenu({
  id,
  title,
  openMenuId,
  setOpenMenuId,
  align = 'right',
  entryId,
  lifecycleState,
  clienteId,
  onDone,
  onClosePanel,
}: Props) {
  const isOpen = openMenuId === id;
  const [shareOpen, setShareOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');
  const [working, setWorking] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const next = isKnowledgeLifecycleState(lifecycleState) ? KNOWLEDGE_LIFECYCLE_NEXT[lifecycleState] : undefined;
  const canArchive = !!entryId && lifecycleState !== 'ARCHIVED';

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

  const advance = async () => {
    if (!entryId || !next) return;
    setWorking(true);
    try {
      await transitionKnowledgeEntry(entryId, next.state, clienteId);
      showAppToast(`Estado atualizado para "${KNOWLEDGE_LIFECYCLE_LABELS[next.state]}".`, 'success');
      setOpenMenuId(null);
      onDone?.();
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível atualizar o estado.', 'error');
    } finally {
      setWorking(false);
    }
  };

  const archive = async () => {
    if (!entryId) return;
    const confirmed = await confirmApp({
      title: 'Arquivar conhecimento',
      description: `Arquivar "${title}"? O agente para de citar isso como resposta. Não existe ação de desarquivar por aqui ainda.`,
      confirmLabel: 'Arquivar',
      tone: 'warning',
    });
    if (!confirmed) return;

    setWorking(true);
    try {
      await transitionKnowledgeEntry(entryId, 'ARCHIVED', clienteId);
      showAppToast('Conhecimento arquivado.', 'info');
      setOpenMenuId(null);
      onDone?.();
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível arquivar.', 'error');
    } finally {
      setWorking(false);
    }
  };

  const remove = async () => {
    if (!entryId) {
      const confirmed = await confirmApp({
        title: 'Excluir',
        description: `Excluir "${title}"? Esta ação ainda não está disponível para este item.`,
        confirmLabel: 'Entendi',
        tone: 'danger',
      });
      setOpenMenuId(null);
      if (confirmed) showAppToast('Exclusão ainda não está disponível para este item.', 'info');
      return;
    }

    const confirmed = await confirmApp({
      title: 'Excluir conhecimento',
      description: `Excluir "${title}"? Esta ação apaga o registro de verdade — o agente deixa de encontrar essa solução em buscas futuras.`,
      confirmLabel: 'Excluir conhecimento',
      tone: 'danger',
    });
    if (!confirmed) return;

    setWorking(true);
    try {
      await deleteKnowledgeEntry(entryId, clienteId);
      showAppToast('Conhecimento excluído.', 'info');
      setOpenMenuId(null);
      onDone?.();
      onClosePanel?.();
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível excluir.', 'error');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="knowledge-actions-wrap" ref={menuRef}>
      <button className="row-icon-btn" title="Mais opções" onClick={toggleMenu}>•••</button>

      {isOpen && !shareOpen && (
        <div className={`knowledge-more-menu align-${align}`}>
          {entryId && next ? (
            <button disabled={working} onClick={() => void advance()}><ArrowRightCircle size={15} /> {next.label}</button>
          ) : (
            <button onClick={() => notAvailable('Ativar conhecimento')}><CheckCircle2 size={15} /> Ativar conhecimento</button>
          )}
          <button onClick={() => notAvailable('Cancelar conhecimento')}><X size={15} /> Cancelar conhecimento</button>
          {canArchive ? (
            <button disabled={working} onClick={() => void archive()}><Archive size={15} /> Arquivar</button>
          ) : (
            <button onClick={() => notAvailable('Arquivar')}><Archive size={15} /> Arquivar</button>
          )}
          <button onClick={print}><Printer size={15} /> Imprimir</button>
          <button onClick={() => notAvailable('Exportar PDF')}><FileDown size={15} /> Exportar PDF</button>
          <button onClick={() => notAvailable('Exportar XLS')}><FileSpreadsheet size={15} /> Exportar XLS</button>
          <button onClick={() => notAvailable('Exportar DOC')}><FileText size={15} /> Exportar DOC</button>
          <button onClick={() => notAvailable('Exportar XML')}><FileText size={15} /> Exportar XML</button>
          <button onClick={() => notAvailable('Exportar CSV')}><FileText size={15} /> Exportar CSV</button>
          <button onClick={openShare}><Share2 size={15} /> Compartilhar</button>
          <button className="danger" disabled={working} onClick={() => void remove()}><Trash2 size={15} /> Excluir</button>
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
