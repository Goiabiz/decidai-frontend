import {
  Cable,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  GitBranch,
  Mail,
  MessageCircle,
  MoreHorizontal,
  PlugZap,
  RefreshCw,
  ShieldAlert,
  Workflow,
  XCircle,
} from 'lucide-react';
import type { IntegrationConnection, IntegrationProvider } from '../../services/integrationsApi';

type Props = {
  provider: IntegrationProvider;
  connection?: IntegrationConnection;
  onConnect: (provider: IntegrationProvider) => void;
  onTest: (provider: IntegrationProvider, connection?: IntegrationConnection) => void;
  onResources: (provider: IntegrationProvider, connection?: IntegrationConnection) => void;
  onLogs: (provider: IntegrationProvider, connection?: IntegrationConnection) => void;
};

function getProviderIcon(code: string) {
  switch (code) {
    case 'google_drive':
      return <FileText size={20} />;
    case 'github':
      return <GitBranch size={20} />;
    case 'jira':
      return <Workflow size={20} />;
    case 'discord':
    case 'whatsapp':
      return <MessageCircle size={20} />;
    case 'email':
      return <Mail size={20} />;
    case 'supabase_external':
      return <Database size={20} />;
    default:
      return <Cable size={20} />;
  }
}

function getStatusMeta(provider: IntegrationProvider, connection?: IntegrationConnection) {
  if (!connection) {
    return provider.status === 'ativo'
      ? { label: 'Não conectada', className: 'integration-status idle', icon: <Clock size={14} /> }
      : { label: 'Planejada', className: 'integration-status planned', icon: <Clock size={14} /> };
  }

  switch (connection.status) {
    case 'conectada':
      return { label: 'Conectada', className: 'integration-status connected', icon: <CheckCircle2 size={14} /> };
    case 'erro_autenticacao':
      return { label: 'Erro de autenticação', className: 'integration-status error', icon: <ShieldAlert size={14} /> };
    case 'token_expirado':
      return { label: 'Token expirado', className: 'integration-status warning', icon: <RefreshCw size={14} /> };
    case 'sem_permissao':
      return { label: 'Sem permissão', className: 'integration-status warning', icon: <ShieldAlert size={14} /> };
    case 'desativada':
      return { label: 'Desativada', className: 'integration-status disabled', icon: <XCircle size={14} /> };
    default:
      return { label: 'Não conectada', className: 'integration-status idle', icon: <Clock size={14} /> };
  }
}

function getAuthLabel(provider: IntegrationProvider) {
  if (provider.auth_type === 'oauth2') return 'OAuth';
  if (provider.auth_type === 'api_key') return 'Chave/API';
  if (provider.auth_type === 'webhook') return 'Webhook';
  return 'Manual';
}

export function IntegrationProviderCard({
  provider,
  connection,
  onConnect,
  onTest,
  onResources,
  onLogs,
}: Props) {
  const status = getStatusMeta(provider, connection);
  const disabled = provider.status !== 'ativo';

  return (
    <article className="integration-card">
      <div className="integration-card-header">
        <div className="integration-icon">{getProviderIcon(provider.code)}</div>
        <div className="integration-title-block">
          <h3>{provider.name}</h3>
          <span className={status.className}>
            {status.icon}
            {status.label}
          </span>
        </div>
        <button className="icon-button ghost" type="button" title="Mais opções">
          <MoreHorizontal size={18} />
        </button>
      </div>

      <p className="integration-description">
        {provider.description || 'Integração disponível para conexão com conta autorizada.'}
      </p>

      <div className="integration-meta">
        <span>Tipo: {provider.provider_type}</span>
        <span>Autenticação: {getAuthLabel(provider)}</span>
      </div>

      {connection?.last_error_message && (
        <div className="integration-error">
          {connection.last_error_message}
        </div>
      )}

      <div className="integration-actions">
        <button
          type="button"
          className="secondary-button"
          disabled={disabled}
          onClick={() => onConnect(provider)}
        >
          <PlugZap size={15} />
          {connection?.status === 'conectada' ? 'Reconectar' : 'Conectar'}
        </button>

        <button
          type="button"
          className="ghost-button"
          disabled={!connection}
          onClick={() => onTest(provider, connection)}
        >
          Testar
        </button>

        <button
          type="button"
          className="ghost-button"
          disabled={!connection}
          onClick={() => onResources(provider, connection)}
        >
          Recursos
        </button>

        <button
          type="button"
          className="ghost-button"
          onClick={() => onLogs(provider, connection)}
        >
          Logs
        </button>
      </div>
    </article>
  );
}
