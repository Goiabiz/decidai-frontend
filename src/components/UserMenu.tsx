import { useEffect, useRef, useState } from 'react';
import { CreditCard, LogOut, Monitor, Moon, Sun, UserRound } from 'lucide-react';
import { getBrandingConfig, saveBrandingConfig } from '../lib/branding';

type ThemeMode = 'system' | 'light' | 'dark';

type Props = {
  name: string;
  email: string;
  photoUrl?: string;
  onNavigateAccount: () => void;
  onSignOut: () => void | Promise<void>;
};

const THEME_OPTIONS: Array<{ mode: ThemeMode; label: string; icon: typeof Sun }> = [
  { mode: 'light', label: 'Claro', icon: Sun },
  { mode: 'dark', label: 'Escuro', icon: Moon },
  { mode: 'system', label: 'Automático', icon: Monitor },
];

export function UserMenu({ name, email, photoUrl, onNavigateAccount, onSignOut }: Props) {
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

  return (
    <div className="user-menu-wrap" ref={ref}>
      <button className="user-area" type="button" onClick={() => setIsOpen((value) => !value)}>
        <div className="avatar">{photoUrl ? <img src={photoUrl} alt={name} /> : <UserRound size={18} />}</div>
        <div><strong>{name}</strong><small>{email}</small></div>
      </button>

      {isOpen && (
        <div className="user-menu align-right">
          <div className="user-menu-header">
            <strong>{name}</strong>
            <small>{email}</small>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              onNavigateAccount();
            }}
          >
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

          <button
            className="danger"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
          >
            <LogOut size={15} /> {signingOut ? 'Saindo...' : 'Sair'}
          </button>
        </div>
      )}
    </div>
  );
}
