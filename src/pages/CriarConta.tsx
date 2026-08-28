import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { getBrandingConfig } from '../lib/branding';
import { signUpWithPassword } from '../services/auth';
import markArrowLight from '../assets/brand/mark-arrow-light.svg';
import markArrowDark from '../assets/brand/mark-arrow-dark.svg';

/**
 * Self-signup real. Depois do signUp bem-sucedido, o vínculo por domínio de e-mail (achar o
 * cliente dono do domínio, criar usuarios_cliente com status "Solicitação") acontece dentro de
 * loadSession() -- não aqui -- porque se o projeto tiver confirmação de e-mail ligada, não
 * existe sessão ainda neste momento pra chamar a função (fn_request_client_access exige
 * auth.uid()). Por isso as 2 telas de saída daqui são: "confirme seu e-mail" (sem sessão) ou
 * volta pro login (com sessão, o SessionProvider já assume e resolve o resto sozinho).
 */
export function CriarConta() {
  const companyName = getBrandingConfig().companyName || 'DecidAI';
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'idle' | 'needs-confirmation' | 'signed-in'>('idle');

  const brandedName = companyName.endsWith('AI')
    ? <>{companyName.slice(0, -2)}<span className="login-ai-red">AI</span></>
    : companyName;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setSubmitting(true);
    try {
      const { hasSession } = await signUpWithPassword(email.trim(), password, nome.trim());
      if (hasSession) {
        // SessionProvider já está ouvindo onAuthStateChange -- basta voltar pro app, que
        // decide sozinho (App.tsx) se mostra a tela de aguardando aprovação ou o app normal.
        window.location.href = '/';
      } else {
        setResult('needs-confirmation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conta.');
    } finally {
      setSubmitting(false);
    }
  };

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
            Sua empresa,<br /><em>seu jeito de decidir.</em>
          </h1>
        </div>

        <div className="login-mark-badge">
          <img src={markArrowLight} alt={`${companyName} logo`} width={108} height={108} />
        </div>

        <div className="login-form-side">
          <div className="login-form-center">
            {result === 'needs-confirmation' ? (
              <div className="login-form-inner">
                <div className="login-forgot-sent">
                  <CheckCircle2 size={18} />
                  <span>Confira seu e-mail — mandamos um link de confirmação para {email}.</span>
                </div>
                <a className="login-back-link" href="/">
                  <ArrowLeft size={14} /> Voltar para o login
                </a>
              </div>
            ) : (
              <form className="login-form-inner" onSubmit={handleSubmit}>
                <a className="login-back-link" href="/">
                  <ArrowLeft size={14} /> Voltar para o login
                </a>
                <h2>Criar conta na {brandedName}</h2>
                <p className="login-sub">
                  Se o domínio do seu e-mail já tiver uma empresa cadastrada, sua solicitação de
                  acesso vai direto pro admin dela aprovar.
                </p>

                <label className="login-field">
                  <span>Nome completo</span>
                  <div className="login-input-icon">
                    <User size={16} />
                    <input
                      type="text"
                      value={nome}
                      onChange={(event) => setNome(event.target.value)}
                      placeholder="Seu nome"
                      autoComplete="name"
                      required
                      autoFocus
                    />
                  </div>
                </label>

                <label className="login-field">
                  <span>E-mail corporativo</span>
                  <div className="login-input-icon">
                    <Mail size={16} />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="voce@suaempresa.com"
                      autoComplete="email"
                      required
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
                      placeholder="Mínimo 6 caracteres"
                      autoComplete="new-password"
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

                <label className="login-field">
                  <span>Confirmar senha</span>
                  <div className="login-input-icon login-input-icon-password">
                    <Lock size={16} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Repita a senha"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </label>

                {error && <p className="login-error">{error}</p>}

                <button className="primary-small login-submit" type="submit" disabled={submitting}>
                  {submitting ? 'Criando conta...' : 'Criar conta'} <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>

          <div className="login-legal">
            <span><ShieldCheck size={13} /> Seus dados estão protegidos conosco.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CriarConta;
