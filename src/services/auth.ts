import { universoSupabase } from '../lib/supabase';

export type TipoAcesso = 'suporte' | 'admin_operadora' | 'admin_cliente' | 'operacional';

export type PlatformClient = {
  id: string;
  name: string;
  tradeName: string | null;
  marketSegment: string | null;
  planoId: string | null;
  planoCodigo: string | null;
  planoNome: string | null;
};

export type SessionUser = {
  authUserId: string;
  email: string;
  displayName: string;
  kind: 'sistema' | 'cliente';
  registroId: string;
  tipoAcesso: TipoAcesso;
  /** Cliente ao qual o usuário pertence de fato (null para staff da operadora). */
  homeClientId: string | null;
};

export type SessionData = {
  user: SessionUser;
  /** Cliente cujo contexto está ativo na tela (pode ser diferente do homeClientId quando é suporte). */
  activeClientId: string | null;
  permissoes: Set<string>;
};

function requireClient() {
  if (!universoSupabase) {
    throw new Error('Supabase (universo-conectasus) não configurado.');
  }
  return universoSupabase;
}

export async function signIn(email: string, password: string) {
  const supabase = requireClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = requireClient();
  await supabase.auth.signOut();
}

/**
 * Dispara o e-mail de recuperação (link tipo `recovery`, consumido em /confirmar-acesso).
 * `returnPath` é pra onde a pessoa volta depois de definir a senha nova -- o app principal
 * usa `/` (padrão), o Portal do Cliente passa o próprio path (`/portal/:clienteId`), já que
 * é a mesma conta Supabase Auth pros dois, só telas diferentes.
 */
export async function requestPasswordReset(email: string, returnPath = '/') {
  const supabase = requireClient();
  // `type=recovery` vai explícito na nossa própria query string -- o link real do Supabase
  // (template padrão) só entrega a sessão no fragmento da URL (#access_token=...), que o
  // supabase-js pode já ter consumido (e removido da URL) antes deste componente montar.
  // Não dá pra confiar em ler isso do hash; a query que a gente mesmo controla é o sinal
  // confiável de que este é, de fato, um retorno de link de recuperação.
  const redirectTo = `${window.location.origin}/confirmar-acesso?type=recovery&next=${encodeURIComponent(returnPath)}`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

/** Define a nova senha -- só funciona com a sessão temporária criada pelo link de recuperação (via verifyOtp ou auto-detecção, ver ConfirmarAcesso.tsx). */
export async function updatePassword(newPassword: string) {
  const supabase = requireClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export function onAuthStateChange(callback: (authUserId: string | null) => void) {
  const supabase = requireClient();
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user?.id ?? null);
  });
  return () => data.subscription.unsubscribe();
}

export async function getCurrentAuthUserId(): Promise<string | null> {
  const supabase = requireClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

async function loadPermissoes(perfilIds: string[]): Promise<Set<string>> {
  if (perfilIds.length === 0) return new Set();
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('perfis_permissoes')
    .select('permitido, permissao:permissoes_funcionalidade(chave_permissao)')
    .in('perfil_acesso_id', perfilIds)
    .eq('permitido', true);
  if (error) throw error;
  const chaves = new Set<string>();
  for (const row of data ?? []) {
    const chave = (row as { permissao?: { chave_permissao?: string } }).permissao?.chave_permissao;
    if (chave) chaves.add(chave);
  }
  return chaves;
}

/**
 * Resolve a sessão completa a partir do usuário autenticado no Supabase Auth:
 * localiza o registro correspondente em usuarios_sistema OU usuarios_cliente,
 * carrega os perfis vinculados e as permissões resultantes.
 */
export async function loadSession(authUserId: string): Promise<SessionData | null> {
  const supabase = requireClient();

  const { data: sistemaRows, error: sistemaError } = await supabase
    .from('usuarios_sistema')
    .select('id, nome, email_principal, tipo_usuario_sistema, platform_client_id')
    .eq('auth_user_id', authUserId)
    .is('excluido_em', null)
    .limit(1);
  if (sistemaError) throw sistemaError;

  if (sistemaRows && sistemaRows.length > 0) {
    const row = sistemaRows[0];
    const { data: perfilRows, error: perfilError } = await supabase
      .from('usuarios_perfis')
      .select('perfil_acesso_id')
      .eq('usuario_sistema_id', row.id)
      .eq('status', 'ativo');
    if (perfilError) throw perfilError;
    const perfilIds = (perfilRows ?? []).map((p) => p.perfil_acesso_id as string);
    const permissoes = await loadPermissoes(perfilIds);

    const user: SessionUser = {
      authUserId,
      email: row.email_principal,
      displayName: row.nome,
      kind: 'sistema',
      registroId: row.id,
      tipoAcesso: row.tipo_usuario_sistema as TipoAcesso,
      homeClientId: row.platform_client_id,
    };

    return { user, activeClientId: row.platform_client_id, permissoes };
  }

  let { data: clienteRows, error: clienteError } = await supabase
    .from('usuarios_cliente')
    .select('id, nome, email_principal, platform_client_id')
    .eq('auth_user_id', authUserId)
    .is('excluido_em', null)
    .limit(1);
  if (clienteError) throw clienteError;

  if (!clienteRows || clienteRows.length === 0) {
    // Primeiro login real após convite por magic link: ainda não há usuarios_cliente.auth_user_id
    // ligado. fn_claim_pending_usuario_cliente() liga pelo e-mail do próprio JWT (auth.email()),
    // nunca por um id vindo do cliente -- depois tenta a leitura de novo.
    const { error: claimError } = await supabase.rpc('fn_claim_pending_usuario_cliente');
    if (!claimError) {
      const retry = await supabase
        .from('usuarios_cliente')
        .select('id, nome, email_principal, platform_client_id')
        .eq('auth_user_id', authUserId)
        .is('excluido_em', null)
        .limit(1);
      clienteRows = retry.data;
    }
  }

  if (clienteRows && clienteRows.length > 0) {
    const row = clienteRows[0];
    const { data: perfilRows, error: perfilError } = await supabase
      .from('usuarios_perfis')
      .select('perfil_acesso_id')
      .eq('usuario_cliente_id', row.id)
      .eq('status', 'ativo');
    if (perfilError) throw perfilError;
    const perfilIds = (perfilRows ?? []).map((p) => p.perfil_acesso_id as string);
    const permissoes = await loadPermissoes(perfilIds);

    const user: SessionUser = {
      authUserId,
      email: row.email_principal,
      displayName: row.nome,
      kind: 'cliente',
      registroId: row.id,
      tipoAcesso: 'operacional',
      homeClientId: row.platform_client_id,
    };

    return { user, activeClientId: row.platform_client_id, permissoes };
  }

  return null;
}

/** Ordem dos planos comerciais (menor a maior). Mantido em código pois é pequeno e estável. */
export const PLAN_RANK: Record<string, number> = { basic: 1, pro: 2, enterprise: 3 };

export function planRank(code: string | null | undefined): number {
  if (!code) return 0;
  return PLAN_RANK[code.toLowerCase()] ?? 0;
}

export async function getClientPlanCode(clientId: string): Promise<string | null> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('platform_clients')
    .select('planos:platform_plans(code)')
    .eq('id', clientId)
    .maybeSingle();
  if (error) throw error;
  const planoRel = (data as { planos?: { code?: string } | { code?: string }[] } | null)?.planos;
  const plano = Array.isArray(planoRel) ? planoRel[0] : planoRel;
  return plano?.code ?? null;
}

export async function listPlatformClients(): Promise<PlatformClient[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('platform_clients')
    .select('id, name, trade_name, market_segment, plano_id, planos:platform_plans(codigo:code, nome:name)')
    .eq('status', 'active')
    .order('trade_name');
  if (error) throw error;
  return (data ?? []).map((row) => {
    const planoRel = (row as { planos?: { codigo?: string; nome?: string } | { codigo?: string; nome?: string }[] }).planos;
    const plano = Array.isArray(planoRel) ? planoRel[0] : planoRel;
    return {
      id: row.id,
      name: row.name,
      tradeName: row.trade_name,
      marketSegment: row.market_segment,
      planoId: row.plano_id,
      planoCodigo: plano?.codigo ?? null,
      planoNome: plano?.nome ?? null,
    };
  });
}

export type UsuarioCliente = {
  id: string;
  nome: string;
  email: string;
};

/** Lista as pessoas cadastradas em usuarios_cliente para o cliente ativo — usado em seletores de "Responsável". */
export async function listUsuariosCliente(clienteId: string): Promise<UsuarioCliente[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('usuarios_cliente')
    .select('id, nome, email_principal')
    .eq('platform_client_id', clienteId)
    .is('excluido_em', null)
    .order('nome');
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, nome: row.nome, email: row.email_principal }));
}

/** Cadastro rápido de uma pessoa em usuarios_cliente, sem convite de login (auth_user_id fica null). */
export async function createUsuarioClienteQuick(clienteId: string, input: { nome: string; email: string }): Promise<UsuarioCliente> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('usuarios_cliente')
    .insert({ platform_client_id: clienteId, nome: input.nome, email_principal: input.email })
    .select('id, nome, email_principal')
    .single();
  if (error) throw error;
  return { id: data.id, nome: data.nome, email: data.email_principal };
}

export type PerfilAcesso = { id: string; nome: string; chave: string };

/** Perfis disponíveis pro cliente: os globais da plataforma (platform_client_id null) + eventuais próprios do tenant. */
export async function listPerfisAcesso(clienteId: string): Promise<PerfilAcesso[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('perfis_acesso')
    .select('id, nome_perfil, chave_perfil, platform_client_id')
    .eq('status', 'ativo')
    .or(`platform_client_id.is.null,platform_client_id.eq.${clienteId}`)
    .order('nome_perfil');
  if (error) throw error;
  return (data ?? [])
    .filter((row) => row.chave_perfil !== 'suporte' && row.chave_perfil !== 'admin_operadora')
    .map((row) => ({ id: row.id, nome: row.nome_perfil, chave: row.chave_perfil }));
}

export type UsuarioClienteFull = {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  telefoneIso: string;
  cargo: string;
  status: string;
  sexo: string;
  nascimento: string;
  fotoUrl: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  unidade: string;
  perfilAcessoId: string | null;
  perfilNome: string;
  criadoEm: string;
};

type UsuarioClienteRow = {
  id: string;
  nome: string;
  email_principal: string;
  cpf: string | null;
  telefone_principal: string | null;
  telefone_pais_iso: string;
  cargo_funcao: string | null;
  status: string;
  sexo: string | null;
  data_nascimento: string | null;
  foto_url: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  unidade: string | null;
  criado_em: string;
  usuarios_perfis: Array<{ perfil_acesso_id: string; perfis_acesso: { nome_perfil: string } | null }> | null;
};

function mapUsuarioClienteFull(row: UsuarioClienteRow): UsuarioClienteFull {
  const perfilVinculo = row.usuarios_perfis?.[0];
  return {
    id: row.id,
    nome: row.nome,
    email: row.email_principal,
    cpf: row.cpf || '',
    telefone: row.telefone_principal || '',
    telefoneIso: row.telefone_pais_iso || 'br',
    cargo: row.cargo_funcao || '',
    status: row.status,
    sexo: row.sexo || '',
    nascimento: row.data_nascimento || '',
    fotoUrl: row.foto_url || '',
    cep: row.cep || '',
    logradouro: row.logradouro || '',
    numero: row.numero || '',
    complemento: row.complemento || '',
    bairro: row.bairro || '',
    cidade: row.cidade || '',
    uf: row.uf || '',
    unidade: row.unidade || '',
    perfilAcessoId: perfilVinculo?.perfil_acesso_id ?? null,
    perfilNome: perfilVinculo?.perfis_acesso?.nome_perfil ?? '',
    criadoEm: row.criado_em,
  };
}

const USUARIO_CLIENTE_FULL_SELECT = `
  id, nome, email_principal, cpf, telefone_principal, telefone_pais_iso, cargo_funcao, status,
  sexo, data_nascimento, foto_url, cep, logradouro, numero, complemento, bairro, cidade, uf, unidade,
  criado_em,
  usuarios_perfis(perfil_acesso_id, perfis_acesso(nome_perfil))
`;

export async function listUsuariosClienteFull(clienteId: string): Promise<UsuarioClienteFull[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('usuarios_cliente')
    .select(USUARIO_CLIENTE_FULL_SELECT)
    .eq('platform_client_id', clienteId)
    .is('excluido_em', null)
    .order('nome');
  if (error) throw error;
  return (data ?? []).map((row) => mapUsuarioClienteFull(row as unknown as UsuarioClienteRow));
}

export type UsuarioClienteInput = {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  telefoneIso: string;
  cargo: string;
  sexo: string;
  nascimento: string;
  fotoUrl: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  unidade: string;
  perfilAcessoId: string;
};

function usuarioClienteColumns(input: UsuarioClienteInput) {
  return {
    nome: input.nome,
    email_principal: input.email,
    cpf: input.cpf || null,
    telefone_principal: input.telefone || null,
    telefone_pais_iso: input.telefoneIso || 'br',
    cargo_funcao: input.cargo || null,
    sexo: input.sexo || null,
    data_nascimento: input.nascimento || null,
    foto_url: input.fotoUrl || null,
    cep: input.cep || null,
    logradouro: input.logradouro || null,
    numero: input.numero || null,
    complemento: input.complemento || null,
    bairro: input.bairro || null,
    cidade: input.cidade || null,
    uf: input.uf || null,
    unidade: input.unidade || null,
  };
}

/**
 * Cria a pessoa (status "Pendente", auth_user_id null) e manda o convite real por e-mail
 * (magic link via signInWithOtp -- client-safe, não precisa de Edge Function/service_role).
 * A conta de auth só é ligada de verdade quando a pessoa clicar no link (fn_claim_pending_usuario_cliente,
 * chamada automaticamente no próximo login real via loadSession).
 */
export async function inviteUsuarioCliente(clienteId: string, input: UsuarioClienteInput): Promise<UsuarioClienteFull> {
  const supabase = requireClient();

  const { data, error } = await supabase
    .from('usuarios_cliente')
    .insert({ platform_client_id: clienteId, status: 'Pendente', ...usuarioClienteColumns(input) })
    .select(USUARIO_CLIENTE_FULL_SELECT)
    .single();
  if (error) throw error;

  if (input.perfilAcessoId) {
    const { error: perfilError } = await supabase
      .from('usuarios_perfis')
      .insert({ usuario_cliente_id: data.id, perfil_acesso_id: input.perfilAcessoId, principal: true, status: 'ativo' });
    if (perfilError) throw perfilError;
  }

  const { error: inviteError } = await supabase.auth.signInWithOtp({
    email: input.email,
    options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
  });
  if (inviteError) throw inviteError;

  return mapUsuarioClienteFull({ ...(data as unknown as UsuarioClienteRow), usuarios_perfis: [{ perfil_acesso_id: input.perfilAcessoId, perfis_acesso: null }] });
}

export async function updateUsuarioCliente(id: string, input: UsuarioClienteInput): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.from('usuarios_cliente').update(usuarioClienteColumns(input)).eq('id', id);
  if (error) throw error;

  if (input.perfilAcessoId) {
    const { data: existing, error: existingError } = await supabase
      .from('usuarios_perfis')
      .select('id')
      .eq('usuario_cliente_id', id)
      .eq('principal', true)
      .maybeSingle();
    if (existingError) throw existingError;

    if (existing) {
      const { error: updateError } = await supabase.from('usuarios_perfis').update({ perfil_acesso_id: input.perfilAcessoId }).eq('id', existing.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('usuarios_perfis')
        .insert({ usuario_cliente_id: id, perfil_acesso_id: input.perfilAcessoId, principal: true, status: 'ativo' });
      if (insertError) throw insertError;
    }
  }
}

export async function setUsuarioClienteStatus(id: string, status: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.from('usuarios_cliente').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function softDeleteUsuarioCliente(id: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.from('usuarios_cliente').update({ excluido_em: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

/** Reenvia o convite (mesmo mecanismo do cadastro -- magic link real). */
export async function resendUsuarioClienteInvite(email: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
}

/**
 * Registra o início/fim de um acesso de suporte a um cliente. Nunca cria vínculo
 * do usuário de suporte com o cliente — só grava o log.
 */
export async function logSupportAccess(params: {
  usuarioNome: string;
  usuarioEmail: string;
  clienteAcessadoId: string;
  acao: 'acesso_suporte_iniciado' | 'acesso_suporte_encerrado';
}) {
  const supabase = requireClient();
  const { error } = await supabase.from('auditoria_usuario').insert({
    usuario_nome: params.usuarioNome,
    usuario_email: params.usuarioEmail,
    modulo: 'suporte',
    funcionalidade: 'acesso_cross_tenant',
    operacao: params.acao,
    cliente_acessado_id: params.clienteAcessadoId,
    origem: 'frontend',
  });
  if (error) throw error;
}

export type MfaFactor = { id: string; status: 'verified' | 'unverified' };

/** Fator TOTP verificado do usuário logado, se algum -- fonte de verdade real (Supabase Auth), não uma flag local. */
export async function mfaGetVerifiedFactor(): Promise<MfaFactor | null> {
  const supabase = requireClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  const verified = data.totp.find((factor) => factor.status === 'verified');
  return verified ? { id: verified.id, status: 'verified' } : null;
}

/** Inicia o cadastro de um novo fator TOTP -- devolve o QR code (data URI pronto pra <img>) e o segredo manual. */
export async function mfaEnroll(): Promise<{ factorId: string; qrCode: string; secret: string }> {
  const supabase = requireClient();
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
  if (error) throw error;
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

/** Confirma o cadastro com o código de 6 dígitos gerado pelo aplicativo autenticador. */
export async function mfaConfirmEnrollment(factorId: string, code: string): Promise<void> {
  const supabase = requireClient();
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError) throw challengeError;
  const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
  if (verifyError) throw verifyError;
}

export async function mfaUnenroll(factorId: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
}
