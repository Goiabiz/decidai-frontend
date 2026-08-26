import { useEffect, useState } from 'react';
import { CheckCircle2, GitBranch, KeyRound, Trash2, X } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { confirmApp } from '../../lib/appConfirm';
import { showAppToast } from '../../lib/appToast';
import { useSession } from '../../contexts/SessionContext';
import {
  deleteTenantCredential,
  listTenantCredentials,
  setTenantCredential,
  type ConnectorProviderCode,
  type TenantCredentialStatus,
} from '../../services/tenantCredentials';
import { listGithubInstallations, unlinkGithubInstallation, type GithubAppInstallation } from '../../services/githubApp';

// App "DecidAI" na org github.com/DecidAI-io (contrato: database/00_controle/
// brief-github-app-conexao-17-08.md). Instalar não é OAuth -- é um redirect simples pra essa
// URL fixa; o GitHub volta com installation_id na query pra /parametrizacao/conectores/
// github/callback, que faz o vínculo de verdade (ver GithubAppCallback.tsx).
const GITHUB_APP_INSTALL_URL = 'https://github.com/apps/decidai-io/installations/new';

type FieldDef = { key: string; label: string; type?: 'text' | 'password'; placeholder?: string };

type ConnectorDef = {
  code: ConnectorProviderCode;
  name: string;
  description: string;
  fields: FieldDef[];
  disabled?: boolean;
};

/**
 * Formato de secretValue por provider_code -- especificado pela sessão irmã
 * (brief-frontend-conectores-e-coordenacao-16-08.md, item 1). github é valor único; os
 * outros são JSON serializado. Trello ainda não tem conector real do lado do agente --
 * deixa desabilitado aqui pra não guardar credencial que ninguém vai usar ainda.
 */
const CONNECTORS: ConnectorDef[] = [
  {
    code: 'github',
    name: 'GitHub -- Personal Access Token (avançado)',
    description: 'Alternativa manual, só se não for possível instalar o GitHub App acima. Escopo Contents (read-only) + Metadata (read-only).',
    fields: [{ key: '__raw', label: 'Personal Access Token', type: 'password', placeholder: 'ghp_...' }],
  },
  {
    code: 'jira',
    name: 'Jira',
    description: 'Credencial da instância Jira Cloud do seu tenant.',
    fields: [
      { key: 'baseUrl', label: 'URL base', placeholder: 'https://suaempresa.atlassian.net' },
      { key: 'email', label: 'E-mail', placeholder: 'voce@empresa.com' },
      { key: 'apiToken', label: 'API Token', type: 'password' },
    ],
  },
  {
    code: 'confluence',
    name: 'Confluence',
    description: 'Pode ser a mesma credencial do Jira Cloud, se sua empresa usa os dois no mesmo site Atlassian.',
    fields: [
      { key: 'baseUrl', label: 'URL base', placeholder: 'https://suaempresa.atlassian.net' },
      { key: 'email', label: 'E-mail', placeholder: 'voce@empresa.com' },
      { key: 'apiToken', label: 'API Token', type: 'password' },
    ],
  },
  {
    code: 'mariadb',
    name: 'MariaDB',
    description: 'Acesso de leitura ao banco operacional do seu tenant.',
    fields: [
      { key: 'host', label: 'Host' },
      { key: 'port', label: 'Porta', placeholder: '3306' },
      { key: 'user', label: 'Usuário' },
      { key: 'password', label: 'Senha', type: 'password' },
      { key: 'database', label: 'Banco de dados' },
    ],
  },
  {
    code: 'trello',
    name: 'Trello',
    description: 'Conector ainda não disponível -- em construção do lado do agente.',
    fields: [
      { key: 'apiKey', label: 'API Key' },
      { key: 'token', label: 'Token' },
    ],
    disabled: true,
  },
];

export function ConectoresCredenciais() {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;
  const [status, setStatus] = useState<TenantCredentialStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState<ConnectorDef | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [githubInstallations, setGithubInstallations] = useState<GithubAppInstallation[]>([]);
  const [githubLoading, setGithubLoading] = useState(true);
  const [githubRemoving, setGithubRemoving] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    const result = await listTenantCredentials(clienteId);
    setStatus(result.providers);
    setLoadError(result.error || '');
    setLoading(false);
  };

  const carregarGithubApp = async () => {
    setGithubLoading(true);
    const result = await listGithubInstallations(clienteId);
    setGithubInstallations(result.installations);
    setGithubLoading(false);
  };

  useEffect(() => { void carregar(); void carregarGithubApp(); }, [clienteId]);

  const statusFor = (code: string) => status.find((item) => item.providerCode === code);
  const githubConnector = CONNECTORS.find((connector) => connector.code === 'github')!;

  const desconectarGithubApp = async (installation: GithubAppInstallation) => {
    const confirmed = await confirmApp({
      title: 'Desconectar GitHub',
      description: `Remover o acesso à conta ${installation.accountLogin}? O agente deixa de conseguir ler os repositórios dessa instalação.`,
      confirmLabel: 'Desconectar',
      tone: 'danger',
    });
    if (!confirmed) return;

    setGithubRemoving(installation.installationId);
    try {
      await unlinkGithubInstallation(installation.installationId, clienteId);
      await carregarGithubApp();
      showAppToast('GitHub App desconectado.', 'info');
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível desconectar.', 'error');
    } finally {
      setGithubRemoving(null);
    }
  };

  const openEdit = (connector: ConnectorDef) => {
    setEditing(connector);
    setForm({});
  };

  const save = async () => {
    if (!editing) return;
    const missing = editing.fields.some((field) => !form[field.key]?.trim());
    if (missing) {
      showAppToast('Preencha todos os campos.', 'warning');
      return;
    }

    const secretValue = editing.fields.length === 1 && editing.fields[0].key === '__raw'
      ? form.__raw.trim()
      : JSON.stringify(Object.fromEntries(editing.fields.map((field) => [field.key, form[field.key].trim()])));

    setSaving(true);
    try {
      await setTenantCredential(editing.code, secretValue, clienteId);
      await carregar();
      setEditing(null);
      showAppToast(`Credencial do ${editing.name} salva.`, 'success');
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (connector: ConnectorDef) => {
    const confirmed = await confirmApp({
      title: 'Remover credencial',
      description: `Remover a credencial do ${connector.name}? O agente deixa de conseguir usar esse conector em nome do seu tenant.`,
      confirmLabel: 'Remover credencial',
      tone: 'danger',
    });
    if (!confirmed) return;

    try {
      await deleteTenantCredential(connector.code, clienteId);
      await carregar();
      showAppToast('Credencial removida.', 'info');
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível remover.', 'error');
    }
  };

  return (
    <>
      <PageHeader title="Credenciais de Conectores" />

      <section className="card knowledge-functional-card simplified">
        <div className="section-title-row">
          <div>
            <h3>Conectores do agente</h3>
            <p className="section-description">
              <KeyRound size={14} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
              Credenciais que os agentes (Bel/Kinho/Biel) usam em nome do seu tenant. Guardadas encriptadas --
              depois de salva, a credencial nunca é mostrada de novo, só o status.
            </p>
          </div>
        </div>

        {loadError && (
          <div className="v36-status-strip compact" style={{ marginBottom: 12 }}>
            Não foi possível carregar: {loadError}
          </div>
        )}

        <div className="item" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center', marginBottom: 8 }}>
          <span className={`tag ${githubInstallations.length > 0 ? 'done' : 'no'}`}>
            {githubInstallations.length > 0 ? <><CheckCircle2 size={12} style={{ verticalAlign: 'text-bottom' }} /> Conectado</> : 'Não conectado'}
          </span>
          <div>
            <strong><GitBranch size={14} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />GitHub App (recomendado)</strong>
            <p>
              {githubLoading
                ? 'Carregando...'
                : githubInstallations.length > 0
                  ? 'Conta(s) autorizada(s) abaixo, direto pelo GitHub -- sem token pra colar.'
                  : 'Conecte o App oficial da DecidAI -- sem colar token, você escolhe a conta e os repositórios direto no GitHub.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a className="secondary-btn" href={GITHUB_APP_INSTALL_URL}>
              {githubInstallations.length > 0 ? 'Adicionar outra conta' : 'Conectar GitHub'}
            </a>
          </div>
        </div>

        {githubInstallations.length > 0 && (
          <div className="items" style={{ display: 'grid', gap: 8, marginBottom: 8, marginLeft: 24 }}>
            {githubInstallations.map((installation) => (
              <div key={installation.installationId} className="item" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                <span className="small-muted">
                  {installation.accountLogin} ({installation.accountType === 'Organization' ? 'organização' : 'usuário'}) --{' '}
                  {installation.repositorySelection === 'all' ? 'todos os repositórios' : 'repositórios selecionados'}
                </span>
                <div className="row-action-group">
                  <button
                    title="Desconectar"
                    disabled={githubRemoving === installation.installationId}
                    onClick={() => void desconectarGithubApp(installation)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'right', marginBottom: 8 }}>
          <button
            className="small-muted"
            style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => openEdit(githubConnector)}
          >
            {statusFor('github') ? 'Atualizar PAT manual (avançado)' : 'ou configurar com PAT manual (avançado)'}
          </button>
        </div>

        <div className="items" style={{ display: 'grid', gap: 8 }}>
          {CONNECTORS.filter((connector) => connector.code !== 'github').map((connector) => {
            const configured = statusFor(connector.code);
            return (
              <div key={connector.code} className="item" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center' }}>
                <span className={`tag ${configured ? 'done' : 'no'}`}>
                  {configured ? <><CheckCircle2 size={12} style={{ verticalAlign: 'text-bottom' }} /> Configurado</> : 'Não configurado'}
                </span>
                <div>
                  <strong>{connector.name}</strong>
                  <p>{connector.description}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {connector.disabled ? (
                    <span className="small-muted">Em breve</span>
                  ) : (
                    <>
                      <button className="secondary-btn" onClick={() => openEdit(connector)}>
                        {configured ? 'Atualizar' : 'Configurar'}
                      </button>
                      {configured && (
                        <div className="row-action-group">
                          <button title="Remover" onClick={() => void remove(connector)}><Trash2 size={16} /></button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {loading && <p className="small-muted">Carregando...</p>}
        </div>
      </section>

      {editing && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="knowledge-form-modal simplified">
            <div className="cadastro-modal-header">
              <strong>{statusFor(editing.code) ? 'Atualizar' : 'Configurar'} credencial -- {editing.name}</strong>
              <button className="icon-btn" onClick={() => setEditing(null)}><X size={18} /></button>
            </div>

            <div className="cadastro-modal-content">
              <section className="cadastro-form-section">
                <div className="cadastro-form-grid">
                  {editing.fields.map((field) => (
                    <label key={field.key} className="span-2">
                      <span>{field.label}</span>
                      <input
                        type={field.type === 'password' ? 'password' : 'text'}
                        value={form[field.key] || ''}
                        onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                        placeholder={field.placeholder}
                        autoComplete="off"
                      />
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <div className="cadastro-modal-footer">
              <button onClick={() => setEditing(null)}>Cancelar</button>
              <button className="primary" disabled={saving} onClick={() => void save()}>{saving ? 'Salvando...' : 'Salvar credencial'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ConectoresCredenciais;
