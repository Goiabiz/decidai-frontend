import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  getCurrentAuthUserId,
  loadSession,
  logSupportAccess,
  onAuthStateChange,
  signIn as authSignIn,
  signOut as authSignOut,
  type SessionData,
} from '../services/auth';

type SessionContextValue = {
  loading: boolean;
  session: SessionData | null;
  isSupport: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Suporte/admin da operadora "entra" na instância de um cliente. Só grava log, nunca vínculo. */
  accessClient: (clientId: string) => Promise<void>;
  /** Suporte sai da instância do cliente e volta ao contexto "sem cliente ativo". */
  releaseClient: () => Promise<void>;
  hasPermission: (chave: string) => boolean;
  /** Reflete a própria foto recém-enviada sem precisar recarregar a sessão inteira. */
  updateOwnPhoto: (fotoUrl: string) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionData | null>(null);

  const refresh = useCallback(async (authUserId: string | null) => {
    if (!authUserId) {
      setSession(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await loadSession(authUserId);
      setSession(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getCurrentAuthUserId()
      .then((id) => {
        if (active) refresh(id);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChange((id) => refresh(id));
    } catch {
      // Supabase não configurado neste ambiente: segue sem sessão.
    }
    return () => {
      active = false;
      unsubscribe();
    };
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    await authSignIn(email, password);
    const id = await getCurrentAuthUserId();
    await refresh(id);
  }, [refresh]);

  const signOut = useCallback(async () => {
    if (session?.user.tipoAcesso && ['suporte', 'admin_operadora'].includes(session.user.tipoAcesso) && session.activeClientId) {
      await logSupportAccess({
        usuarioNome: session.user.displayName,
        usuarioEmail: session.user.email,
        clienteAcessadoId: session.activeClientId,
        acao: 'acesso_suporte_encerrado',
      });
    }
    await authSignOut();
    setSession(null);
  }, [session]);

  const accessClient = useCallback(async (clientId: string) => {
    if (!session) return;
    if (session.activeClientId && session.activeClientId !== clientId) {
      await logSupportAccess({
        usuarioNome: session.user.displayName,
        usuarioEmail: session.user.email,
        clienteAcessadoId: session.activeClientId,
        acao: 'acesso_suporte_encerrado',
      });
    }
    await logSupportAccess({
      usuarioNome: session.user.displayName,
      usuarioEmail: session.user.email,
      clienteAcessadoId: clientId,
      acao: 'acesso_suporte_iniciado',
    });
    setSession({ ...session, activeClientId: clientId });
  }, [session]);

  const releaseClient = useCallback(async () => {
    if (!session || !session.activeClientId) return;
    await logSupportAccess({
      usuarioNome: session.user.displayName,
      usuarioEmail: session.user.email,
      clienteAcessadoId: session.activeClientId,
      acao: 'acesso_suporte_encerrado',
    });
    setSession({ ...session, activeClientId: null });
  }, [session]);

  const hasPermission = useCallback(
    (chave: string) => session?.permissoes.has(chave) ?? false,
    [session],
  );

  const updateOwnPhoto = useCallback((fotoUrl: string) => {
    setSession((current) => current && ({ ...current, user: { ...current.user, fotoUrl } }));
  }, []);

  const value = useMemo<SessionContextValue>(() => ({
    loading,
    session,
    isSupport: session?.user.tipoAcesso === 'suporte' || session?.user.tipoAcesso === 'admin_operadora',
    signIn,
    signOut,
    accessClient,
    releaseClient,
    hasPermission,
    updateOwnPhoto,
  }), [loading, session, signIn, signOut, accessClient, releaseClient, hasPermission, updateOwnPhoto]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession precisa estar dentro de <SessionProvider>.');
  return ctx;
}

export function usePermission(chave: string) {
  const { hasPermission } = useSession();
  return hasPermission(chave);
}
