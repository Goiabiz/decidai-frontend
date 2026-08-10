import { universoSupabase } from '../lib/supabase';

export type PortalUser = {
  id: string;
  clienteId: string;
  nome: string;
  email: string;
};

export type PortalAuthOutcome = {
  user: PortalUser | null;
  source: 'supabase' | 'local';
  /** true quando o Supabase Auth exige confirmação por e-mail antes de liberar sessão. */
  pendingEmailConfirmation?: boolean;
};

/**
 * Portal do Cliente exige conta real (e-mail + senha via Supabase Auth) -- ver migration
 * 028_usuarios_portal_login_real.sql. As tabelas ainda podem não existir no ambiente atual
 * (migration escrita, não aplicada), então cada função tenta o Supabase real primeiro e cai
 * para um fallback local (localStorage) sem erro visível, mesmo padrão de atendimentos.ts.
 * O fallback local NÃO é seguro (senha em texto puro) -- serve só para demonstrar o fluxo
 * sem backend real disponível, nunca para produção.
 */
function getClient() {
  return universoSupabase;
}

const LOCAL_KEY = 'radar-sus-portal-auth-fallback';

type LocalPortalUser = PortalUser & { senha: string };
type LocalAuthStore = { usuarios: LocalPortalUser[]; sessaoUsuarioId: string | null };

function loadLocalStore(): LocalAuthStore {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return { usuarios: [], sessaoUsuarioId: null };
    return JSON.parse(raw) as LocalAuthStore;
  } catch {
    return { usuarios: [], sessaoUsuarioId: null };
  }
}

function saveLocalStore(store: LocalAuthStore) {
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(store));
}

export type PortalSignUpInput = { clienteId: string; nome: string; email: string; senha: string };

export async function portalSignUp(input: PortalSignUpInput): Promise<PortalAuthOutcome> {
  const client = getClient();
  const email = input.email.trim().toLowerCase();

  if (client) {
    const { data, error } = await client.auth.signUp({ email, password: input.senha });
    if (!error && data.user) {
      if (!data.session) {
        return { user: null, source: 'supabase', pendingEmailConfirmation: true };
      }
      const { data: perfil, error: perfilError } = await client
        .from('usuarios_portal')
        .insert({ auth_user_id: data.user.id, platform_client_id: input.clienteId, nome: input.nome, email_principal: email })
        .select('*')
        .single();
      if (!perfilError && perfil) {
        return {
          user: { id: perfil.id, clienteId: input.clienteId, nome: input.nome, email },
          source: 'supabase',
        };
      }
    }
  }

  const store = loadLocalStore();
  if (store.usuarios.some((u) => u.clienteId === input.clienteId && u.email === email)) {
    throw new Error('Já existe uma conta com esse e-mail neste portal.');
  }
  const user: LocalPortalUser = { id: `local-${Date.now()}`, clienteId: input.clienteId, nome: input.nome, email, senha: input.senha };
  store.usuarios.push(user);
  store.sessaoUsuarioId = user.id;
  saveLocalStore(store);
  const { senha: _senha, ...publicUser } = user;
  return { user: publicUser, source: 'local' };
}

export type PortalSignInInput = { clienteId: string; email: string; senha: string };

export async function portalSignIn(input: PortalSignInInput): Promise<PortalAuthOutcome> {
  const client = getClient();
  const email = input.email.trim().toLowerCase();

  if (client) {
    const { data, error } = await client.auth.signInWithPassword({ email, password: input.senha });
    if (!error && data.user) {
      const { data: perfil, error: perfilError } = await client
        .from('usuarios_portal')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .eq('platform_client_id', input.clienteId)
        .maybeSingle();
      if (!perfilError && perfil) {
        return {
          user: { id: perfil.id, clienteId: perfil.platform_client_id, nome: perfil.nome, email: perfil.email_principal },
          source: 'supabase',
        };
      }
    }
  }

  const store = loadLocalStore();
  const found = store.usuarios.find((u) => u.clienteId === input.clienteId && u.email === email && u.senha === input.senha);
  if (!found) throw new Error('E-mail ou senha inválidos.');
  store.sessaoUsuarioId = found.id;
  saveLocalStore(store);
  const { senha: _senha, ...publicUser } = found;
  return { user: publicUser, source: 'local' };
}

export async function portalSignOut(): Promise<void> {
  const client = getClient();
  if (client) await client.auth.signOut();
  const store = loadLocalStore();
  store.sessaoUsuarioId = null;
  saveLocalStore(store);
}

export async function getCurrentPortalUser(clienteId: string): Promise<PortalUser | null> {
  const client = getClient();
  if (client) {
    const { data: sessionData } = await client.auth.getSession();
    const authUserId = sessionData.session?.user?.id;
    if (authUserId) {
      const { data: perfil, error } = await client
        .from('usuarios_portal')
        .select('*')
        .eq('auth_user_id', authUserId)
        .eq('platform_client_id', clienteId)
        .maybeSingle();
      if (!error && perfil) {
        return { id: perfil.id, clienteId: perfil.platform_client_id, nome: perfil.nome, email: perfil.email_principal };
      }
      if (!error) return null;
    }
  }

  const store = loadLocalStore();
  if (!store.sessaoUsuarioId) return null;
  const found = store.usuarios.find((u) => u.id === store.sessaoUsuarioId && u.clienteId === clienteId);
  if (!found) return null;
  const { senha: _senha, ...publicUser } = found;
  return publicUser;
}
