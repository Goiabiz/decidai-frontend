import { useEffect, useRef, useState } from 'react';
import { Building2, Compass, CreditCard, LogOut, Megaphone, Monitor, Moon, Settings, Sun, Upload, UserPlus, UserRound } from 'lucide-react';
import { getBrandingConfig, saveBrandingConfig } from '../lib/branding';
import type { TipoAcesso } from '../services/auth';

type ThemeMode = 'system' | 'light' | 'dark';

const ROLE_LABELS: Record<TipoAcesso, string> = {
  suporte: 'Suporte',
  admin_operadora: 'Administrador da operadora',
  admin_cliente: 'Administrador',
  operacional: 'Operacional',
};

type Props = {
  name: string;
  email: string;
  photoUrl?: string;
  companyName: string;
  tipoAcesso?: TipoAcesso;
  onNavigateAccount: () => void;
  onNavigateAdmin: () => void;
  onNavigateMarketplace: () => void;
  onRequestNewUser: () => void;
  onRequestImportUsers: () => void;
  onSignOut: () => void | Promise<void>;
};

const THEME_OPTIONS: Array<{ mode: ThemeMode; label: string; icon: typeof Sun }> = [
  { mode: 'light', label: 'Claro', icon: Sun },
  { mode: 'dark', label: 'Escuro', icon: Moon },
  { mode: 'system', label: 'Automático', icon: Monitor },
];

/**
 * Um único menu de conta, gatilho só aqui (topo-direito) -- até 28/08 existia um segundo
 * menu duplicado no logo da sidebar (topo-esquerdo, "Perfil"/"Administração"/"Marketplace"),
 * repetindo opção em dois lugares. Mesclado a pedido do usuário, mesmo padrão do menu de
 * conta do Jira/Rovo: estado compacto só com o avatar (sem nome/e-mail poluindo a topbar),
 * nome+e-mail aparecem só dentro do dropdown já aberto.
 */
export function UserMenu({ name, email, photoUrl, companyName, tipoAcesso, onNavigateAccount, onNavigateAdmin, onNavigateMarketplace, onRequestNewUser, onRequestImportUsers, onSignOut }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getBrandingConfig().themeMode);
  const ref = useRef<HTMLDivElement | null>(null);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setSigningOut(false);
    }
  };

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveBrandingConfig({ themeMode: mode });
  };

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

  const focusSearch = () => {
    close();
    document.querySelector<HTMLInputElement>('.search-box input')?.focus();
  };

  return (
    <div className="user-menu-wrap" ref={ref}>
      <button className="user-area user-area-compact" type="button" onClick={() => setIsOpen((value) => !value)} title={name}>
        <div className="avatar">{photoUrl ? <img src={photoUrl} alt={name} /> : <UserRound size={18} />}</div>
      </button>

      {isOpen && (
        <div className="user-menu align-right">
          <div className="user-menu-header">
            <strong>{name}</strong>
            <small>{email}</small>
          </div>

          <button onClick={() => { close(); onNavigateAccount(); }}>
            <CreditCard size={15} /> Minha Conta
          </button>

          <div className="user-menu-theme">
            <span>Tema</span>
            <div className="user-menu-theme-options">
              {THEME_OPTIONS.map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  type="button"
                  className={themeMode === mode ? 'active' : ''}
                  title={label}
                  onClick={() => handleThemeChange(mode)}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="user-menu-divider" />

          <button onClick={() => { close(); onNavigateAdmin(); }}><Settings size={15} /> Administração</button>
          <button onClick={() => { close(); onNavigateMarketplace(); }}><Megaphone size={15} /> Marketplace</button>
          <button onClick={focusSearch}><Compass size={15} /> Atalhos</button>
          <button onClick={() => { close(); onRequestNewUser(); }}><UserPlus size={15} /> Convidar</button>
          <button onClick={() => { close(); onRequestImportUsers(); }}><Upload size={15} /> Importar dados</button>

          <div className="user-menu-divider" />

          <button
            className="danger"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
          >
            <LogOut size={15} /> {signingOut ? 'Saindo...' : 'Sair'}
          </button>

          <div className="user-menu-footer">
            <Building2 size={13} />
            <span>{tipoAcesso ? ROLE_LABELS[tipoAcesso] : 'Operacional'} · {companyName}</span>
          </div>
        </div>
      )}
    </div>
  );
}
