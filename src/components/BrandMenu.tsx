import { useEffect, useRef, useState } from 'react';
import { Building2, Compass, LogOut, Megaphone, Menu, Settings, Upload, UserPlus } from 'lucide-react';
import type { TipoAcesso } from '../services/auth';

function BrandWordmark({ companyName }: { companyName: string }) {
  if (companyName === 'DecidAI') {
    return <span><strong>Decid<span className="brand-wordmark-accent">AI</span></strong></span>;
  }
  return <span><strong>{companyName}</strong></span>;
}

const ROLE_LABELS: Record<TipoAcesso, string> = {
  suporte: 'Suporte',
  admin_operadora: 'Administrador da operadora',
  admin_cliente: 'Administrador',
  operacional: 'Operacional',
};

type Props = {
  companyName: string;
  tipoAcesso?: TipoAcesso;
  markSrc: string;
  onNavigateAdmin: () => void;
  onNavigateMarketplace: () => void;
  onRequestNewUser: () => void;
  onRequestImportUsers: () => void;
  onSignOut: () => void | Promise<void>;
};

export function BrandMenu({ companyName, tipoAcesso, markSrc, onNavigateAdmin, onNavigateMarketplace, onRequestNewUser, onRequestImportUsers, onSignOut }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target)) return;
      setIsOpen(false);
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const close = () => setIsOpen(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setSigningOut(false);
    }
  };

  const focusSearch = () => {
    close();
    document.querySelector<HTMLInputElement>('.search-box input')?.focus();
  };

  return (
    <div className="brand-menu-wrap" ref={ref}>
      <button type="button" className="brand" onClick={() => setIsOpen((value) => !value)}>
        <div className="brand-left">
          <Menu size={23} />
          <BrandWordmark companyName={companyName} />
        </div>
        <img className="radar-mark" src={markSrc} alt="" width={30} height={30} />
      </button>

      {isOpen && (
        <div className="brand-menu">
          <div className="brand-menu-columns">
            <div className="brand-menu-col">
              <span className="brand-menu-col-title">Conta</span>
              <button type="button" onClick={() => { close(); onRequestImportUsers(); }}><Upload size={15} /> Importar dados</button>
              <button type="button" onClick={() => { close(); onNavigateAdmin(); }}><Settings size={15} /> Administração</button>
              <button type="button" className="danger" disabled={signingOut} onClick={() => void handleSignOut()}>
                <LogOut size={15} /> {signingOut ? 'Saindo...' : 'Sair'}
              </button>
            </div>
            <div className="brand-menu-col">
              <span className="brand-menu-col-title">Descubra</span>
              <button type="button" onClick={() => { close(); onNavigateMarketplace(); }}><Megaphone size={15} /> Marketplace</button>
              <button type="button" onClick={focusSearch}><Compass size={15} /> Atalhos</button>
              <button type="button" onClick={() => { close(); onRequestNewUser(); }}><UserPlus size={15} /> Convidar</button>
            </div>
          </div>
          <div className="brand-menu-footer">
            <Building2 size={13} />
            <span>{tipoAcesso ? ROLE_LABELS[tipoAcesso] : 'Operacional'} · {companyName}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrandMenu;
