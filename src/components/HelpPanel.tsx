import { CircleHelp, Lightbulb, X } from 'lucide-react';
import type { PageKey } from '../App';
import { getHelpEntry } from '../data/helpContent';

type HelpPanelProps = {
  open: boolean;
  onClose: () => void;
  page: PageKey;
  pageTitle: string;
  onOpenCentralAjuda: () => void;
};

export function HelpPanel({ open, onClose, page, pageTitle, onOpenCentralAjuda }: HelpPanelProps) {
  if (!open) return null;

  const entry = getHelpEntry(page);

  return (
    <div className="help-panel-backdrop" onClick={onClose}>
      <aside className="help-panel" onClick={(event) => event.stopPropagation()} aria-label="Ajuda desta tela">
        <header>
          <div>
            <CircleHelp size={18} />
            <div>
              <strong>{entry.title || pageTitle}</strong>
              <small>Ajuda desta tela</small>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar ajuda"><X size={18} /></button>
        </header>

        <section className="help-panel-body">
          <p className="help-panel-summary">{entry.summary}</p>

          {entry.tips.length > 0 && (
            <div className="help-panel-tips">
              <h4><Lightbulb size={14} /> Dicas</h4>
              <ul>
                {entry.tips.map((tip, index) => <li key={index}>{tip}</li>)}
              </ul>
            </div>
          )}
        </section>

        <footer>
          <button className="help-panel-central-link" onClick={onOpenCentralAjuda}>Ver Central de Ajuda completa →</button>
          <span>Precisa de mais? Use o assistente flutuante para perguntar sobre esta tela.</span>
        </footer>
      </aside>
    </div>
  );
}

export default HelpPanel;
