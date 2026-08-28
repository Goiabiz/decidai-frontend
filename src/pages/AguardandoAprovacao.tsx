import { Clock3, LogOut, ShieldCheck } from 'lucide-react';
import { useSession } from '../contexts/SessionContext';
import markArrowLight from '../assets/brand/mark-arrow-light.svg';

/**
 * Mostrada quando session.user.status === 'Solicitação' -- self-signup vinculado por domínio
 * (fn_request_client_access), mas ainda sem aprovação humana de um admin do cliente
 * (fn_approve_client_access_request, ver aba "Solicitações" em Usuarios.tsx). Sessão real
 * existe (a pessoa está autenticada), só não tem acesso ao resto do app ainda.
 */
export function AguardandoAprovacao() {
  const { session, signOut } = useSession();

  return (
    <div className="confirm-access-screen">
      <div className="confirm-access-card">
        <div className="confirm-access-brand">
          <img src={markArrowLight} alt="DecidAI" width={44} height={44} />
          <span>Decid<span className="ai">AI</span></span>
        </div>

        <Clock3 size={32} style={{ color: 'var(--warn, #92400e)', marginBottom: 8 }} />
        <h1>Sua solicitação está em análise</h1>
        <p>
          Encontramos uma empresa correspondente ao domínio do seu e-mail ({session?.user.email})
          e criamos sua solicitação de acesso. Um administrador dela precisa aprovar antes de
          você entrar na plataforma.
        </p>

        <button className="primary-small confirm-access-btn" onClick={() => void signOut()}>
          <LogOut size={16} /> Sair
        </button>

        <div className="confirm-access-legal">
          <ShieldCheck size={13} /> Seus dados estão protegidos conosco.
        </div>
      </div>
    </div>
  );
}

export default AguardandoAprovacao;
