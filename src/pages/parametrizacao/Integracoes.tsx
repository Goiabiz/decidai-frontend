import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, Database, KeyRound, Lock, Plus, RefreshCcw, Search, ShieldCheck, TestTube2, Webhook, X } from 'lucide-react';
import { BrandIcon } from '../../components/BrandIcon';
import { showAppToast } from '../../lib/appToast';
import { saveApiGuidedConnection, testApiGuidedConnection } from '../../lib/v36SecureApiFunctions';
import { useSession } from '../../contexts/SessionContext';
import { getClientPlanCode, planRank } from '../../services/auth';
import {
  groupCatalogByCategory,
  listV35AllProvidersForAdmin,
  listV35IntegrationCatalog,
  listV35ProviderActions,
  providerDomain,
  updateV35IntegrationProvider,
  type V35AdminProviderRow,
  type V35IntegrationCatalogItem,
  type V35ProviderAction,
  type V35LoadState,
} from '../../services/v35Supabase';

export type IntegracoesProps = { onSelectDetail?: (detail: any) => void; onOpenDetail?: (detail: any) => void };

type ConnectionMode = 'oauth2' | 'api_key_header' | 'api_key_query' | 'bearer' | 'webhook' | 'manual' | 'custom_rest_api' | 'none';

const authLabels: Record<string, string> = {
  oauth2: 'OAuth',
  bearer: 'Bearer token',
  api_key_header: 'Chave no cabeçalho',
  api_key_query: 'Chave na URL',
  api_key: 'Chave/API',
  webhook: 'Webhook',
  manual: 'Manual',
  custom_rest_api: 'API guiada',
  none: 'Sem autenticação',
};

function capabilityLabels(provider: V35IntegrationCatalogItem) {
  return [
    provider.can_feed_knowledge ? 'Conhecimento' : '',
    provider.can_create_tasks ? 'Tarefas' : '',
    provider.can_open_attendance ? 'Atendimento' : '',
    provider.can_be_channel_provider ? 'Canal' : '',
    provider.can_sync_files ? 'Arquivos' : '',
    provider.can_sync_messages ? 'Mensagens' : '',
    provider.can_use_webhook_in ? 'Entrada' : '',
    provider.can_use_webhook_out ? 'Saída' : '',
  ].filter(Boolean);
}

function initialMode(provider?: V35IntegrationCatalogItem | null): ConnectionMode {
  const auth = provider?.auth_type || 'manual';
  if (auth === 'api_key') return 'api_key_header';
  if (['oauth2', 'bearer', 'api_key_header', 'api_key_query', 'webhook', 'manual', 'custom_rest_api', 'none'].includes(auth)) {
    return auth as ConnectionMode;
  }
  return 'manual';
}

export function Integracoes(_props: IntegracoesProps) {
  const { session } = useSession();
  const isAdminOperadora = session?.user.tipoAcesso === 'admin_operadora';
  const [clientPlanCode, setClientPlanCode] = useState<string | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminRows, setAdminRows] = useState<V35AdminProviderRow[]>([]);
  const [adminSaving, setAdminSaving] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [providers, setProviders] = useState<V35IntegrationCatalogItem[]>([]);
  const [actions, setActions] = useState<V35ProviderAction[]>([]);
  const [source, setSource] = useState<V35LoadState>('empty');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<V35IntegrationCatalogItem | null>(null);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('oauth2');
  const [connectionName, setConnectionName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [credentialHeader, setCredentialHeader] = useState('x-api-key');
  const [saving, setSaving] = useState(false);
  const [lastConnectionId, setLastConnectionId] = useState<string | null>(null);
  const [lastTestPreview, setLastTestPreview] = useState('');

  const load = async () => {
    setLoading(true);
    const catalog = await listV35IntegrationCatalog();
    setProviders(catalog.data);
    setSource(catalog.source);
    if (catalog.error) showAppToast(`Catálogo de integrações: ${catalog.error}`, 'warning');
    setLoading(false);
  };

  const loadAdminRows = async () => {
    const result = await listV35AllProvidersForAdmin();
    setAdminRows(result.data);
    if (result.error) showAppToast(`Administração do catálogo: ${result.error}`, 'warning');
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (isAdminOperadora && adminOpen) void loadAdminRows();
  }, [isAdminOperadora, adminOpen]);

  const saveAdminChange = async (providerId: string, changes: Parameters<typeof updateV35IntegrationProvider>[1]) => {
    setAdminSaving(providerId);
    try {
      await updateV35IntegrationProvider(providerId, changes);
      await loadAdminRows();
      await load();
      showAppToast('Catálogo atualizado.', 'success');
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível atualizar o catálogo.', 'error');
    } finally {
      setAdminSaving(null);
    }
  };

  useEffect(() => {
    const clientId = session?.activeClientId;
    if (!clientId) {
      setClientPlanCode(null);
      return;
    }
    let active = true;
    getClientPlanCode(clientId)
      .then((code) => { if (active) setClientPlanCode(code); })
      .catch(() => { if (active) setClientPlanCode(null); });
    return () => { active = false; };
  }, [session?.activeClientId]);

  const clientPlanRankValue = planRank(clientPlanCode);
  const isLocked = (provider: V35IntegrationCatalogItem) => planRank(provider.min_plan_code) > clientPlanRankValue;

  useEffect(() => {
    if (!selected) {
      setActions([]);
      setConnectionName('');
      setBaseUrl('');
      setSecret('');
      setLastConnectionId(null);
      setLastTestPreview('');
      return;
    }

    setConnectionMode(initialMode(selected));
    setConnectionName(`${selected.name} principal`);
    setBaseUrl(selected.provider_type === 'custom_rest_api' || selected.code.includes('api') ? 'https://api.exemplo.com.br' : '');
    setSecret('');
    setLastConnectionId(null);
    setLastTestPreview('');

    void listV35ProviderActions(selected.id).then((result) => setActions(result.data));
  }, [selected]);

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = providers.filter((provider) => {
      const searchText = [provider.name, provider.description, provider.category_name, provider.provider_type, provider.min_plan_code, provider.auth_type, provider.code].join(' ').toLowerCase();
      return !normalized || searchText.includes(normalized);
    });
    return groupCatalogByCategory(filtered);
  }, [providers, query]);

  const customApiProvider = providers.find((provider) => provider.code.includes('api') || provider.provider_type === 'custom_rest_api');
  const modeNeedsUrl = ['custom_rest_api', 'api_key_header', 'api_key_query', 'bearer', 'none'].includes(connectionMode);
  const modeNeedsSecret = ['api_key_header', 'api_key_query', 'bearer'].includes(connectionMode);

  const saveConnection = async () => {
    if (!selected) return;

    if (!connectionName.trim()) {
      showAppToast('Informe o nome da conexão.', 'warning');
      return;
    }

    if (modeNeedsUrl && !baseUrl.trim()) {
      showAppToast('Informe a URL base da integração/API.', 'warning');
      return;
    }

    if (modeNeedsSecret && !secret.trim()) {
      showAppToast('Informe a credencial para testar a conexão.', 'warning');
      return;
    }

    if (connectionMode === 'oauth2' || connectionMode === 'webhook' || connectionMode === 'manual') {
      showAppToast('Fluxo preparado. Esta conexão depende da autorização/deploy das funções seguras.', 'info');
      return;
    }

    setSaving(true);
    try {
      const result = await saveApiGuidedConnection({
        provider_id: selected.id,
        provider_code: selected.code,
        name: connectionName.trim(),
        description: `Conexão criada pelo catálogo de integrações para ${selected.name}.`,
        base_url: baseUrl.trim(),
        auth_type: connectionMode === 'custom_rest_api' ? 'none' : connectionMode,
        secret: secret.trim() || undefined,
        credential_type: connectionMode,
        credential_label: connectionMode === 'bearer' ? 'Bearer token' : 'Credencial principal',
        config: {
          credential_header_name: credentialHeader || 'x-api-key',
          origin: 'frontend_v36_2',
          provider_name: selected.name,
        },
      });

      const connectionId = result.connection?.id || null;
      setLastConnectionId(connectionId);
      showAppToast('Conexão salva com segurança.', 'success');
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível salvar a conexão.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!lastConnectionId) {
      showAppToast('Salve a conexão antes de testar.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const result = await testApiGuidedConnection(lastConnectionId);
      setLastTestPreview(result.preview || '');
      showAppToast(result.success ? 'Teste realizado com sucesso.' : 'Teste retornou falha.', result.success ? 'success' : 'warning');
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível testar a conexão.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="v3464-page">
      <div className="v3464-page-head">
        <div>
          <h1>Integrações</h1>
          <p className="v36-muted">Catálogo carregado do Supabase v35 para conectar canais, campos, agentes, alertas e relatórios.</p>
        </div>
        <div className="v36-actions">
          <button className="v3464-btn secondary" onClick={load}><RefreshCcw size={16} /> Atualizar</button>
          <button className="v3464-btn primary" onClick={() => setSelected(customApiProvider || null)}><Plus size={16} /> Conectar API personalizada</button>
        </div>
      </div>

      {isAdminOperadora && (
        <section className="v3464-card">
          <button className="v36-admin-toggle" onClick={() => setAdminOpen((current) => !current)}>
            <ChevronDown size={16} style={{ transform: adminOpen ? 'rotate(180deg)' : 'none' }} />
            Administração do catálogo (intranet vs. vendável, plano por conector)
          </button>
          {adminOpen && (
            <div className="v36-admin-table-wrap">
              <table className="v3464-table">
                <thead>
                  <tr>
                    <th>Conector</th>
                    <th>Categoria</th>
                    <th>Plano mínimo</th>
                    <th>Vendável ao cliente</th>
                    <th>Uso interno (intranet)</th>
                  </tr>
                </thead>
                <tbody>
                  {adminRows.map((row) => (
                    <tr key={row.id}>
                      <td><strong>{row.name}</strong><br /><small className="v36-muted">{row.code}</small></td>
                      <td>{row.category_name || '-'}</td>
                      <td>
                        <select
                          value={row.min_plan_code || ''}
                          disabled={adminSaving === row.id}
                          onChange={(event) => saveAdminChange(row.id, { min_plan_code: event.target.value || null })}
                        >
                          <option value="">Sob consulta</option>
                          <option value="basic">Básico</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={row.is_visible_to_client}
                          disabled={adminSaving === row.id}
                          onChange={(event) => saveAdminChange(row.id, { is_visible_to_client: event.target.checked })}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={row.is_native_product_service}
                          disabled={adminSaving === row.id}
                          onChange={(event) => saveAdminChange(row.id, { is_native_product_service: event.target.checked })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <section className="v3464-card">
        <div className="v36-status-strip">
          <span><Database size={15} /> Fonte: {source === 'supabase' ? 'Supabase v35' : source === 'empty' ? 'Sem registros no catálogo' : 'Fallback/local'}</span>
          <span>{providers.length} conectores visíveis</span>
          <span>{providers.filter((item) => item.can_be_channel_provider).length} provedores de canal</span>
          <span>{providers.filter((item) => item.can_feed_knowledge).length} fontes de conhecimento</span>
        </div>

        <div className="v3464-search">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar integração, categoria, plano, recurso ou autenticação..." />
        </div>

        {loading && <p className="v36-muted">Carregando catálogo...</p>}
        {!loading && filteredGroups.length === 0 && <p className="v36-muted">Nenhuma integração encontrada.</p>}

        {filteredGroups.map(({ category, providers: groupedProviders }) => (
          <div className="v3464-integration-section" key={category}>
            <div className="v3464-section-title">
              <h2>{category}</h2>
              <small className="v36-muted">{groupedProviders.length} conectores</small>
            </div>
            <div className="v3464-plugin-grid">
              {groupedProviders.map((provider) => {
                const locked = isLocked(provider);
                return (
                  <button
                    className={`v3464-plugin v36-provider-card ${locked ? 'v36-provider-locked' : ''}`}
                    key={provider.id}
                    onClick={() => {
                      if (locked) {
                        showAppToast(`Este conector requer o plano ${provider.min_plan_code}. Fale com o suporte para fazer upgrade.`, 'warning');
                        return;
                      }
                      setSelected(provider);
                    }}
                  >
                    <BrandIcon label={provider.name} domain={providerDomain(provider)} />
                    <span>
                      <strong>{provider.name}</strong>
                      <small>{authLabels[provider.auth_type || 'manual'] || provider.auth_type || 'Manual'} • Plano {provider.min_plan_code || 'sob consulta'}</small>
                      <em>{capabilityLabels(provider).slice(0, 3).join(' • ') || 'Conector preparado'}</em>
                    </span>
                    {locked && <span className="v36-locked-badge"><Lock size={13} /> Upgrade</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {selected && (
        <div className="v3464-modal-backdrop">
          <section className="v3464-system-modal v36-wide-modal">
            <button className="v3464-modal-x" onClick={() => setSelected(null)}><X size={18} /></button>
            <div className="v36-modal-title">
              <BrandIcon label={selected.name} domain={providerDomain(selected)} />
              <div>
                <h2>{selected.name}</h2>
                <p>{selected.description || 'Conector preparado para uso no ambiente do cliente.'}</p>
              </div>
            </div>

            <div className="v36-provider-summary">
              <span><ShieldCheck size={15} /> {selected.status || 'ativo'}</span>
              <span><KeyRound size={15} /> {authLabels[selected.auth_type || 'manual'] || selected.auth_type}</span>
              <span><Webhook size={15} /> {selected.supports_webhook ? 'Webhook disponível' : 'Sem webhook'}</span>
            </div>

            <div className="v3464-modal-form v3464-modal-grid">
              <label>Nome da conexão<input value={connectionName} onChange={(event) => setConnectionName(event.target.value)} placeholder={`Ex.: ${selected.name} principal`} /></label>
              <label>Tipo de autenticação<select value={connectionMode} onChange={(event) => setConnectionMode(event.target.value as ConnectionMode)}>
                <option value="oauth2">OAuth</option>
                <option value="bearer">Bearer token</option>
                <option value="api_key_header">Chave/API no cabeçalho</option>
                <option value="api_key_query">Chave/API na URL</option>
                <option value="webhook">Webhook</option>
                <option value="custom_rest_api">API REST guiada</option>
                <option value="none">Sem autenticação</option>
                <option value="manual">Manual</option>
              </select></label>
              {modeNeedsUrl && <label className="span-2">URL base da integração/API<input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="https://api.exemplo.com.br" /></label>}
              {connectionMode === 'api_key_header' && <label>Nome do cabeçalho<input value={credentialHeader} onChange={(event) => setCredentialHeader(event.target.value)} placeholder="x-api-key" /></label>}
              {modeNeedsSecret && <label className={connectionMode === 'api_key_header' ? '' : 'span-2'}>Credencial segura<input type="password" value={secret} onChange={(event) => setSecret(event.target.value)} placeholder="Será criptografada na Edge Function." /></label>}
            </div>

            <section className="v36-modal-section">
              <h3>Ações disponíveis para agentes e fluxos</h3>
              {actions.length === 0 ? <p className="v36-muted">Nenhuma ação cadastrada para este conector ainda.</p> : (
                <div className="v36-action-list">
                  {actions.map((action) => (
                    <div className="v36-action-row" key={action.id}>
                      <strong>{action.action_name}</strong>
                      <span>{action.direction} • risco {action.risk_level}{action.requires_confirmation ? ' • exige confirmação' : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {lastTestPreview && (
              <section className="v36-modal-section">
                <h3>Resultado do último teste</h3>
                <pre className="v36-test-preview">{lastTestPreview}</pre>
              </section>
            )}

            <footer>
              <button className="v3464-secondary-btn" onClick={() => setSelected(null)}>Cancelar</button>
              <button className="v3464-secondary-btn" disabled={saving || !lastConnectionId} onClick={testConnection}><TestTube2 size={16} /> Testar</button>
              <button className="v3464-primary-btn" disabled={saving} onClick={saveConnection}><CheckCircle2 size={16} /> {saving ? 'Salvando...' : 'Salvar conexão'}</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

export default Integracoes;
