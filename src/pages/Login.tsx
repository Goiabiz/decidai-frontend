import { useState } from 'react';
import { ArrowLeft, ArrowRight, Bot, Building2, CheckCircle2, Eye, EyeOff, Lock, Mail, Phone, Puzzle, ShieldCheck, Sparkles, User, X } from 'lucide-react';
import { useSession } from '../contexts/SessionContext';
import { getBrandingConfig } from '../lib/branding';
import { showAppToast } from '../lib/appToast';
import { requestPasswordReset, signInWithOAuthProvider, submitDemoLead, type OAuthProvider } from '../services/auth';
import markArrowLight from '../assets/brand/mark-arrow-light.svg';
import markArrowDark from '../assets/brand/mark-arrow-dark.svg';

const FEATURES = [
  {
    icon: Bot,
    title: 'Agentes inteligentes',
    description: 'Automatize processos e amplie a produtividade.',
  },
  {
    icon: Puzzle,
    title: 'Integrações seguras',
    description: 'Conecte sistemas e dados com confiança.',
  },
  {
    icon: Sparkles,
    title: 'Decisões orientadas por IA',
    description: 'Insights que impulsionam resultados.',
  },
];

const SOCIAL_AUTH_OPTIONS = [
  { key: 'google', label: 'Google' },
  { key: 'microsoft', label: 'Microsoft' },
  { key: 'sso', label: 'SSO' },
] as const;

type SocialAuthKey = typeof SOCIAL_AUTH_OPTIONS[number]['key'];

// A chave da UI ("microsoft") não é o mesmo slug que o Supabase Auth espera pro provider
// ("azure") -- achado real testando em produção: mandar provider=microsoft direto devolve
// "Provider microsoft could not be found" (nem chega a "not enabled", como o Google dá).
const SOCIAL_KEY_TO_OAUTH_PROVIDER: Partial<Record<SocialAuthKey, OAuthProvider>> = {
  google: 'google',
  microsoft: 'azure',
};

function LoginProviderIcon({ type }: { type: SocialAuthKey }) {
  if (type === 'google') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="#4285F4" d="M21.6 12.23c0-.77-.07-1.51-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.22c1.89-1.74 2.99-4.3 2.99-7.52z" />
        <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.45l-3.22-2.51c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H3.08v2.59A9.99 9.99 0 0 0 12 22z" />
        <path fill="#FBBC05" d="M6.41 13.87A6.02 6.02 0 0 1 6.09 12c0-.65.11-1.28.32-1.87V7.54H3.08A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.08 4.46l3.33-2.59z" />
        <path fill="#EA4335" d="M12 6.01c1.47 0 2.78.51 3.82 1.5l2.86-2.86C16.95 3.04 14.7 2 12 2a9.99 9.99 0 0 0-8.92 5.54l3.33 2.59C7.2 7.77 9.4 6.01 12 6.01z" />
      </svg>
    );
  }
  if (type === 'microsoft') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="#F25022" d="M3 3h8.5v8.5H3z" />
        <path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z" />
        <path fill="#00A4EF" d="M3 12.5h8.5V21H3z" />
        <path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 2 5 5v6c0 4.55 2.91 8.8 7 10 4.09-1.2 7-5.45 7-10V5l-7-3zm0 2.18L17 6.3V11c0 3.35-1.98 6.5-5 7.68C8.98 17.5 7 14.35 7 11V6.3l5-2.12z" />
      <path fill="currentColor" d="M11 7h2v5h-2V7zm0 7h2v2h-2v-2z" />
    </svg>
  );
}

export function Login() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const companyName = getBrandingConfig().companyName || 'DecidAI';

  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const [oauthLoading, setOauthLoading] = useState<SocialAuthKey | null>(null);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoNome, setDemoNome] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoEmpresa, setDemoEmpresa] = useState('');
  const [demoTelefone, setDemoTelefone] = useState('');
  const [demoMensagem, setDemoMensagem] = useState('');
  const [demoError, setDemoError] = useState('');
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoSent, setDemoSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar. Verifique usuário e senha.');
    } finally {
      setSubmitting(false);
    }
  };

  const openForgotPassword = () => {
    setForgotEmail(email.trim());
    setForgotError('');
    setForgotSent(false);
    setMode('forgot');
  };

  const backToLogin = () => {
    setMode('login');
    setForgotError('');
  };

  const handleForgotSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setForgotError('');
    setForgotSubmitting(true);
    try {
      await requestPasswordReset(forgotEmail.trim());
      setForgotSent(true);
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Não foi possível enviar o link de recuperação.');
    } finally {
      setForgotSubmitting(false);
    }
  };

  const notReady = (label: string) => showAppToast(`${label} chega numa fase futura do produto.`);

  const handleOAuth = async (key: SocialAuthKey) => {
    const provider = SOCIAL_KEY_TO_OAUTH_PROVIDER[key];
    if (!provider) return;
    setOauthLoading(key);
    try {
      await signInWithOAuthProvider(provider);
      // Sucesso redireciona pro provider (Google/Microsoft) -- não há "depois" aqui nesta função.
    } catch (err) {
      setOauthLoading(null);
      showAppToast(
        err instanceof Error ? err.message : `Não foi possível iniciar o login com ${key}.`,
        'error',
      );
    }
  };

  const openDemoModal = () => {
    setDemoNome('');
    setDemoEmail('');
    setDemoEmpresa('');
    setDemoTelefone('');
    setDemoMensagem('');
    setDemoError('');
    setDemoSent(false);
    setDemoModalOpen(true);
  };

  const handleDemoSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setDemoError('');
    setDemoSubmitting(true);
    try {
      await submitDemoLead({
        nome: demoNome.trim(),
        email: demoEmail.trim(),
        empresa: demoEmpresa.trim(),
        telefone: demoTelefone.trim() || undefined,
        mensagem: demoMensagem.trim() || undefined,
      });
      setDemoSent(true);
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : 'Não foi possível enviar sua solicitação.');
    } finally {
      setDemoSubmitting(false);
    }
  };

  const brandedName = companyName.endsWith('AI')
    ? <>{companyName.slice(0, -2)}<span className="login-ai-red">AI</span></>
    : companyName;

  return (
    <div className="login-screen">
      <div className="login-curve-card">
        <svg className="login-curve-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,0 L100,0 L100,100 L0,100 Z" />
        </svg>

        <div className="login-decor login-decor-green" aria-hidden="true">
          <span className="login-ring login-ring-1" />
          <span className="login-ring login-ring-2" />
          <span className="login-dot-grid login-dot-grid-green" />
        </div>

        <div className="login-decor login-decor-white" aria-hidden="true">
          <span className="login-ring login-ring-3" />
          <span className="login-dot-grid login-dot-grid-white" />
          <span className="login-accent-dot" />
        </div>

        <div className="login-brand-panel">
          <div className="login-brand-top">
            <img className="login-mark-small" src={markArrowDark} alt="" width={48} height={48} />
            <span className="login-wordmark-inline">Decid<span className="ai">AI</span></span>
          </div>

          <h1 className="login-curve-headline">
            Decisões melhores.<br />
            <em>Resultados reais.</em>
          </h1>

          <ul className="login-feature-list">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title}>
                <span className="login-feature-icon"><Icon size={21} /></span>
                <div>
                  <strong>{title}</strong>
                  <span>{description}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="login-mark-badge">
          <img src={markArrowLight} alt={`${companyName} logo`} width={108} height={108} />
        </div>

        <div className="login-form-side">
          <div className="login-form-center">
          {mode === 'forgot' ? (
            <form className="login-form-inner" onSubmit={handleForgotSubmit}>
              <button type="button" className="login-back-link" onClick={backToLogin}>
                <ArrowLeft size={14} /> Voltar para o login
              </button>
              <h2>Recuperar senha</h2>
              <p className="login-sub">
                {forgotSent
                  ? 'Se esse e-mail tiver uma conta na DecidAI, enviamos um link de recuperação para ele.'
                  : 'Informe seu e-mail. Vamos enviar um link para você escolher uma nova senha.'}
              </p>

              {!forgotSent ? (
                <>
                  <label className="login-field">
                    <span>E-mail</span>
                    <div className="login-input-icon">
                      <Mail size={16} />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(event) => setForgotEmail(event.target.value)}
                        placeholder="voce@empresa.com"
                        autoComplete="email"
                        required
                        autoFocus
                      />
                    </div>
                  </label>

                  {forgotError && <p className="login-error">{forgotError}</p>}

                  <button className="primary-small login-submit" type="submit" disabled={forgotSubmitting}>
                    {forgotSubmitting ? 'Enviando...' : 'Enviar link de recuperação'} <ArrowRight size={16} />
                  </button>
                </>
              ) : (
                <div className="login-forgot-sent">
                  <CheckCircle2 size={18} />
                  <span>Confira sua caixa de entrada (e o spam).</span>
                </div>
              )}
            </form>
          ) : (
          <form className="login-form-inner" onSubmit={handleSubmit}>
            <h2>Conecte-se à {brandedName}</h2>
            <p className="login-sub">Agentes, integrações e decisões inteligentes para sua operação.</p>

            <label className="login-field">
              <span>E-mail</span>
              <div className="login-input-icon">
                <Mail size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@empresa.com"
                  autoComplete="email"
                  required
                  autoFocus
                />
              </div>
            </label>

            <label className="login-field">
              <span>Senha</span>
              <div className="login-input-icon login-input-icon-password">
                <Lock size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
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

            {error && <p className="login-error">{error}</p>}

            <div className="login-forgot login-forgot-right">
              <a href="#" onClick={(event) => { event.preventDefault(); openForgotPassword(); }}>
                Esqueceu sua senha?
              </a>
            </div>

            <button className="primary-small login-submit" type="submit" disabled={submitting}>
              {submitting ? 'Entrando...' : 'Acessar conta'} <ArrowRight size={16} />
            </button>

            <div className="login-divider">ou continue com</div>

            <div className="login-social-row">
              {SOCIAL_AUTH_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className="login-social-btn"
                  disabled={option.key !== 'sso' && oauthLoading === option.key}
                  onClick={() => {
                    if (option.key === 'sso') {
                      showAppToast('SSO corporativo (SAML) é uma configuração por empresa — fale com nosso time para habilitar.');
                      return;
                    }
                    void handleOAuth(option.key);
                  }}
                  title={option.key === 'sso' ? 'Login corporativo único da empresa' : `Entrar com ${option.label}`}
                >
                  <span className="login-social-icon"><LoginProviderIcon type={option.key} /></span>
                  <span>{oauthLoading === option.key ? 'Redirecionando...' : option.label}</span>
                </button>
              ))}
            </div>

            <div className="login-signup">
              Novo por aqui? <a href="/criar-conta">Criar conta</a>
              {' · '}
              <a href="#" onClick={(event) => { event.preventDefault(); openDemoModal(); }}>
                Solicitar demonstração
              </a>
            </div>
          </form>
          )}
          </div>

          <div className="login-legal">
            <span><ShieldCheck size={13} /> Seus dados estão protegidos conosco.</span>
            <span className="login-legal-links">
              <a href="#" onClick={(event) => { event.preventDefault(); notReady('Política de Privacidade'); }}>Política de Privacidade</a>
              <a href="#" onClick={(event) => { event.preventDefault(); notReady('Termos de Uso'); }}>Termos de Uso</a>
            </span>
          </div>
        </div>
      </div>

      {demoModalOpen && (
        <div className="modal-backdrop" onClick={() => setDemoModalOpen(false)}>
          <div className="demo-lead-modal" onClick={(event) => event.stopPropagation()}>
            <div className="demo-lead-modal-header">
              <strong>Solicitar demonstração</strong>
              <button className="icon-btn" onClick={() => setDemoModalOpen(false)} aria-label="Fechar"><X size={18} /></button>
            </div>

            {demoSent ? (
              <div className="login-forgot-sent">
                <CheckCircle2 size={18} />
                <span>Recebemos sua solicitação — nosso time entra em contato em breve.</span>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="demo-lead-form">
                <label className="login-field">
                  <span>Nome</span>
                  <div className="login-input-icon">
                    <User size={16} />
                    <input type="text" value={demoNome} onChange={(event) => setDemoNome(event.target.value)} required autoFocus />
                  </div>
                </label>
                <label className="login-field">
                  <span>E-mail</span>
                  <div className="login-input-icon">
                    <Mail size={16} />
                    <input type="email" value={demoEmail} onChange={(event) => setDemoEmail(event.target.value)} required />
                  </div>
                </label>
                <label className="login-field">
                  <span>Empresa</span>
                  <div className="login-input-icon">
                    <Building2 size={16} />
                    <input type="text" value={demoEmpresa} onChange={(event) => setDemoEmpresa(event.target.value)} required />
                  </div>
                </label>
                <label className="login-field">
                  <span>Telefone (opcional)</span>
                  <div className="login-input-icon">
                    <Phone size={16} />
                    <input type="tel" value={demoTelefone} onChange={(event) => setDemoTelefone(event.target.value)} />
                  </div>
                </label>
                <label className="login-field">
                  <span>Mensagem (opcional)</span>
                  <textarea
                    className="demo-lead-textarea"
                    value={demoMensagem}
                    onChange={(event) => setDemoMensagem(event.target.value)}
                    rows={3}
                  />
                </label>

                {demoError && <p className="login-error">{demoError}</p>}

                <button className="primary-small login-submit" type="submit" disabled={demoSubmitting}>
                  {demoSubmitting ? 'Enviando...' : 'Enviar solicitação'} <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
