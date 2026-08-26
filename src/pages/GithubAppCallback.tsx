import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, GitBranch, ShieldCheck } from 'lucide-react';
import { useSession } from '../contexts/SessionContext';
import { linkGithubInstallation, type GithubAppInstallation } from '../services/githubApp';
import markArrowLight from '../assets/brand/mark-arrow-light.svg';

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  Organization: 'organização',
  User: 'usuário',
};

/**
 * Instalar um GitHub App não é OAuth (contrato: database/00_controle/
 * brief-github-app-conexao-17-08.md) -- o GitHub redireciona pra cá com `installation_id` na
 * query, sem código pra trocar. A sessão já precisa existir (usuário clicou "Conectar GitHub"
 * a partir da tela de Credenciais, logado) -- se não existir mais, pede pra logar de novo em
 * vez de tentar recriar contexto que não temos aqui.
 */
export function GithubAppCallback() {
  const { session, loading } = useSession();
  const params = new URLSearchParams(window.location.search);
  const installationId = params.get('installation_id');
  const setupAction = params.get('setup_action');

  const [status, setStatus] = useState<'linking' | 'success' | 'error'>('linking');
  const [errorMessage, setErrorMessage] = useState('');
  const [installation, setInstallation] = useState<GithubAppInstallation | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (loading || !session || !installationId || startedRef.current) return;
    startedRef.current = true;
    linkGithubInstallation(installationId, session.activeClientId)
      .then((result) => {
        setInstallation(result);
        setStatus('success');
      })
      .catch((error) => {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Não foi possível vincular a instalação.');
      });
  }, [loading, session, installationId]);

  return (
    <div className="confirm-access-screen">
      <div className="confirm-access-card">
        <div className="confirm-access-brand">
          <img src={markArrowLight} alt="DecidAI" width={44} height={44} />
          <span>Decid<span className="ai">AI</span></span>
        </div>

        {loading ? (
          <>
            <h1>Conectando ao GitHub</h1>
            <p>Verificando sua sessão, um instante...</p>
          </>
        ) : !session ? (
          <>
            <h1>Sua sessão expirou</h1>
            <p>Faça login novamente e repita a conexão a partir de Parametrização → Credenciais de Conectores.</p>
            <a className="primary-small confirm-access-btn" href="/">Ir para o login</a>
          </>
        ) : !installationId ? (
          <>
            <h1>Não foi possível conectar</h1>
            <p>O GitHub não enviou o installation_id de volta. Tente conectar novamente.</p>
            <a className="primary-small confirm-access-btn" href="/">Voltar para o produto</a>
          </>
        ) : status === 'linking' ? (
          <>
            <h1>Conectando ao GitHub</h1>
            <p>Confirmando a instalação{setupAction === 'update' ? ' atualizada' : ''} do App DecidAI, um instante...</p>
          </>
        ) : status === 'error' ? (
          <>
            <h1>Não foi possível conectar</h1>
            <p>{errorMessage}</p>
            <a className="primary-small confirm-access-btn" href="/">Voltar para o produto</a>
          </>
        ) : (
          <>
            <h1><GitBranch size={20} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />GitHub conectado</h1>
            <p>
              {installation && (
                <>
                  Conta <strong>{installation.accountLogin}</strong> ({ACCOUNT_TYPE_LABEL[installation.accountType] || installation.accountType}),{' '}
                  {installation.repositorySelection === 'all' ? 'todos os repositórios' : 'repositórios selecionados'} liberados pro agente.
                </>
              )}
            </p>
            <a className="primary-small confirm-access-btn" href="/">
              <CheckCircle2 size={16} /> Voltar para Credenciais de Conectores
            </a>
          </>
        )}

        <div className="confirm-access-legal">
          <ShieldCheck size={13} /> Seus dados estão protegidos conosco.
        </div>
      </div>
    </div>
  );
}

export default GithubAppCallback;
