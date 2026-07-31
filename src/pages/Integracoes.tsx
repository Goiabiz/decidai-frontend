import { useEffect, useMemo, useState } from 'react';
import { Cable, RefreshCw } from 'lucide-react';
import { DataSourceNotice } from '../components/DataSourceNotice';
import { IntegrationProviderCard } from '../components/integrations/IntegrationProviderCard';
import { KpiCard } from '../components/KpiCard';
import { PageHeader } from '../components/PageHeader';
import {
  listIntegrationConnections,
  listIntegrationProviders,
  type IntegrationConnection,
  type IntegrationProvider,
} from '../services/integrationsApi';

type ActionState = {
  title: string;
  message: string;
};

type LoadState = {
  loading: boolean;
  error: string;
};

function providerStatus(provider: IntegrationProvider, connection?: IntegrationConnection) {
  if (connection?.status === 'conectada') return 'conectada';
  if (provider.status === 'ativo') return 'disponivel';
  return 'planejada';
}

export function Integracoes() {
  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [loadState, setLoadState] = useState<LoadState>({ loading: true, error: '' });
  const [actionState, setActionState] = useState<ActionState | null>(null);

  async function loadIntegrations() {
    setLoadState({ loading: true, error: '' });

    try {
      const [providerData, connectionData] = await Promise.all([
        listIntegrationProviders(),
        listIntegrationConnections(),
      ]);

      setProviders(providerData);
      setConnections(connectionData);
      setLoadState({ loading: false, error: '' });
    } catch (error) {
      setLoadState({
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar integraÃ§Ãµes.',
      });
    }
  }

  useEffect(() => {
    void loadIntegrations();
  }, []);

  const connectionByProvider = useMemo(() => {
    return connections.reduce<Record<string, IntegrationConnection>>((acc, connection) => {
      if (!acc[connection.provider_code]) {
        acc[connection.provider_code] = connection;
      }
      return acc;
    }, {});
  }, [connections]);

  const stats = useMemo(() => {
    const connected = providers.filter((provider) => connectionByProvider[provider.code]?.status === 'conectada').length;
    const available = providers.filter((provider) => provider.status === 'ativo').length;
    const planned = providers.filter((provider) => provider.status === 'planejado').length;
    const errors = connections.filter((connection) => ['erro_autenticacao', 'token_expirado', 'sem_permissao'].includes(connection.status)).length;

    return { connected, available, planned, errors };
  }, [providers, connections, connectionByProvider]);

  function showPreparedAction(title: string, provider: IntegrationProvider) {
    setActionState({
      title,
      message: `${title} para ${provider.name} jÃ¡ estÃ¡ prevista, mas depende do endpoint backend/OAuth. Esta tela estÃ¡ pronta para consumir esse fluxo quando ativarmos o provider.`,
    });
  }

  return (
    <div className="integrations-page">
      <PageHeader
        title="IntegraÃ§Ãµes"
        action={
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              void loadIntegrations();
            }}
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        }
      />

      <DataSourceNotice
        source="supabase"
        loading={loadState.loading}
        error={loadState.error || undefined}
        connectionState={loadState.loading ? 'connecting' : loadState.error ? 'error' : 'connected'}
      />

      <section className="kpi-grid four">
        <KpiCard label="DisponÃ­veis" value={stats.available} tooltip="Provedores jÃ¡ liberados para conexÃ£o." tone="green" />
        <KpiCard label="Conectadas" value={stats.connected} tooltip="ConexÃµes ativas e autorizadas." tone="blue" />
        <KpiCard label="Planejadas" value={stats.planned} tooltip="IntegraÃ§Ãµes cadastradas no roadmap." tone="purple" />
        <KpiCard label="Com atenÃ§Ã£o" value={stats.errors} tooltip="ConexÃµes com erro, token expirado ou falta de permissÃ£o." tone="orange" />
      </section>

      {actionState && (
        <div className="integration-action-notice">
          <strong>{actionState.title}</strong>
          <p>{actionState.message}</p>
          <button type="button" className="ghost-button" onClick={() => setActionState(null)}>
            Fechar
          </button>
        </div>
      )}

      <section className="integration-section">
        <div className="section-title-row">
          <div>
            <h2>ConexÃµes do cliente</h2>
            <p>Conecte contas autorizadas para o agente consultar documentos, tarefas, canais e bases externas.</p>
          </div>
          <span className="records-count">{providers.length} provedores</span>
        </div>

        <div className="integrations-grid">
          {providers.map((provider) => {
            const connection = connectionByProvider[provider.code];
            const status = providerStatus(provider, connection);

            return (
              <IntegrationProviderCard
                key={provider.id}
                provider={{ ...provider, status: status === 'planejada' ? 'planejado' : provider.status }}
                connection={connection}
                onConnect={(selected) => showPreparedAction('Conectar conta', selected)}
                onTest={(selected) => showPreparedAction('Testar conexÃ£o', selected)}
                onResources={(selected) => showPreparedAction('Selecionar recursos', selected)}
                onLogs={(selected) => showPreparedAction('Ver logs', selected)}
              />
            );
          })}
        </div>

        {!loadState.loading && providers.length === 0 && (
          <div className="empty-state">
            <Cable size={22} />
            Nenhum provedor de integraÃ§Ã£o foi encontrado.
          </div>
        )}
      </section>
    </div>
  );
}

