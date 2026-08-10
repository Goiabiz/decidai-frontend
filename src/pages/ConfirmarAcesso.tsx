import { useState } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { universoSupabase } from '../lib/supabase';
import markArrowLight from '../assets/brand/mark-arrow-light.svg';

type VerifyType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email';

export function ConfirmarAcesso() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const params = new URLSearchParams(window.location.search);
  const tokenHash = params.get('token_hash');
  const type = (params.get('type') || 'signup') as VerifyType;

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
      setErrorMessage('Este link expirou ou já foi usado. Peça um novo convite para receber um link atualizado.');
      return;
    }
    setStatus('success');
    window.location.href = '/';
  };

  return (
    <div className="confirm-access-screen">
      <div className="confirm-access-card">
        <div className="confirm-access-brand">
          <img src={markArrowLight} alt="DecidAI" width={44} height={44} />
          <span>Decid<span className="ai">AI</span></span>
        </div>

        {!tokenHash ? (
          <>
            <h1>Link inválido</h1>
            <p>Esse link de acesso está incompleto ou corrompido. Peça um novo convite a quem administra sua conta.</p>
          </>
        ) : status === 'error' ? (
          <>
            <h1>Não foi possível confirmar</h1>
            <p>{errorMessage}</p>
          </>
        ) : (
          <>
            <h1>Confirmar seu acesso</h1>
            <p>Clique no botão abaixo para confirmar sua conta e entrar na plataforma DecidAI.</p>
            <button className="primary-small confirm-access-btn" onClick={handleConfirm} disabled={status === 'loading'}>
              {status === 'loading' ? 'Confirmando...' : status === 'success' ? <><CheckCircle2 size={16} /> Confirmado</> : 'Confirmar meu acesso'}
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
