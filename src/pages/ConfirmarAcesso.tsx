import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { universoSupabase } from '../lib/supabase';
import { updatePassword } from '../services/auth';
import markArrowLight from '../assets/brand/mark-arrow-light.svg';

type VerifyType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email';

/**
 * Os templates de e-mail em produção (confirmados ao vivo via Management API) são todos os
 * padrão do Supabase, com {{ .ConfirmationURL }} -- não {{ .TokenHash }} (esse último exigiria
 * o template customizado, desenhado mas nunca aplicado, bloqueado pelo plano free). O link real
 * abre o /verify do próprio Supabase, que confirma no servidor e só *depois* redireciona pra cá
 * com a sessão dentro do fragmento da URL (#access_token=...), nunca como ?token_hash= na
 * query -- o supabase-js já consome esse fragmento sozinho ao inicializar (detectSessionInUrl,
 * ligado por padrão) e emite PASSWORD_RECOVERY/SIGNED_IN via onAuthStateChange, que é o
 * mecanismo documentado pra esse fluxo. ?token_hash= continua suportado como fallback, pro caso
 * de algum link ser gerado manualmente (ex.: convite via admin API) nesse formato.
 */
export function ConfirmarAcesso() {
  const params = new URLSearchParams(window.location.search);
  const tokenHash = params.get('token_hash');
  const typeParam = params.get('type');
  const type = (typeParam || 'signup') as VerifyType;
  const isRecovery = type === 'recovery';
  // Portal do Cliente manda o próprio path aqui (ver requestPasswordReset) pra voltar pro
  // portal certo em vez do app principal -- mesma conta Supabase Auth, telas diferentes.
  const nextPath = params.get('next') || '/';
  // Sinal de que isso é, de fato, um retorno de link de e-mail em andamento (recovery/signup
  // com auto-detecção via fragmento) -- vem da NOSSA própria query (ver requestPasswordReset/
  // portalSignUp), não do fragmento da URL, que o supabase-js pode já ter consumido e removido
  // antes deste componente montar.
  const hasAutoFlow = Boolean(typeParam);

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'set-password'>(() => {
    if (!universoSupabase) return 'error';
    if (tokenHash) return 'idle';
    if (hasAutoFlow) return 'loading';
    return 'error';
  });
  const [errorMessage, setErrorMessage] = useState(() => {
    if (!universoSupabase) return 'Supabase não configurado.';
    if (!tokenHash && !hasAutoFlow) return 'Link inválido. Peça um novo convite.';
    return '';
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const settledRef = useRef(false);

  useEffect(() => {
    if (!universoSupabase || tokenHash || !hasAutoFlow) return; // sem client, fluxo manual (fallback) ou sem sinal de link válido

    const { data: subscription } = universoSupabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        settledRef.current = true;
        setStatus('set-password');
        return;
      }
      if (event === 'SIGNED_IN' && session) {
        settledRef.current = true;
        setStatus('success');
        window.location.href = nextPath;
      }
    });

    // Link expirado/já usado (ex.: consumido por um scanner de e-mail antes do clique real) --
    // nenhum evento chega, então nenhum estado muda sozinho. Timeout curto evita deixar a
    // pessoa presa numa tela de carregando indefinidamente.
    const timeout = window.setTimeout(() => {
      if (!settledRef.current) {
        setStatus('error');
        setErrorMessage('Este link expirou ou já foi usado. Peça um novo link.');
      }
    }, 5000);

    return () => {
      subscription.subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenHash]);

  const handleConfirm = async () => {
    if (!tokenHash || !universoSupabase) {
      setStatus('error');
      setErrorMessage('Link inválido. Peça um novo convite.');
      return;
    }
    setStatus('loading');
    const { error } = await universoSupabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      setStatus('error');
      setErrorMessage('Este link expirou ou já foi usado. Peça um novo link.');
      return;
    }
    if (isRecovery) {
      setStatus('set-password');
      return;
    }
    setStatus('success');
    window.location.href = nextPath;
  };

  const handleSavePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    if (newPassword.length < 6) {
      setErrorMessage('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword(newPassword);
      setStatus('success');
      window.location.href = nextPath;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível salvar a nova senha.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="confirm-access-screen">
      <div className="confirm-access-card">
        <div className="confirm-access-brand">
          <img src={markArrowLight} alt="DecidAI" width={44} height={44} />
          <span>Decid<span className="ai">AI</span></span>
        </div>

        {status === 'error' ? (
          <>
            <h1>Não foi possível confirmar</h1>
            <p>{errorMessage}</p>
          </>
        ) : status === 'set-password' ? (
          <>
            <h1>Defina sua nova senha</h1>
            <p>Escolha uma nova senha para sua conta DecidAI.</p>
            <form className="confirm-access-password-form" onSubmit={handleSavePassword}>
              <label className="login-field">
                <span>Nova senha</span>
                <div className="login-input-icon login-input-icon-password">
                  <Lock size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    className="login-eye-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              <label className="login-field">
                <span>Confirmar nova senha</span>
                <div className="login-input-icon login-input-icon-password">
                  <Lock size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repita a nova senha"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </label>
              {errorMessage && <p className="login-error">{errorMessage}</p>}
              <button className="primary-small confirm-access-btn" type="submit" disabled={savingPassword}>
                {savingPassword ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          </>
        ) : !tokenHash ? (
          <>
            <h1>{isRecovery ? 'Redefinir sua senha' : 'Confirmar seu acesso'}</h1>
            <p>Confirmando automaticamente, um instante...</p>
          </>
        ) : (
          <>
            <h1>{isRecovery ? 'Redefinir sua senha' : 'Confirmar seu acesso'}</h1>
            <p>
              {isRecovery
                ? 'Clique no botão abaixo para continuar e escolher uma nova senha.'
                : 'Clique no botão abaixo para confirmar sua conta e entrar na plataforma DecidAI.'}
            </p>
            <button className="primary-small confirm-access-btn" onClick={handleConfirm} disabled={status === 'loading'}>
              {status === 'loading' ? 'Confirmando...' : status === 'success' ? <><CheckCircle2 size={16} /> Confirmado</> : 'Continuar'}
            </button>
          </>
        )}

        <div className="confirm-access-legal">
          <ShieldCheck size={13} /> Seus dados estão protegidos conosco.
        </div>
      </div>
    </div>
  );
}

export default ConfirmarAcesso;
