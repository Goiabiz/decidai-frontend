import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { Badge } from '../components/Badge';
import { showAppToast } from '../lib/appToast';
import { useSession } from '../contexts/SessionContext';
import {
  computeCampaignStats,
  createCampaignSource,
  listCampaignSignals,
  listCampaignSources,
  MARKET_CAMPAIGN_SOURCE_LABELS,
  MARKET_CAMPAIGN_SOURCE_NEEDS_REAL_REF,
  MARKET_CAMPAIGN_SOURCE_REF_LABEL,
  setCampaignSourceAtivo,
  syncCampaignSourceNow,
  type CampaignSignal,
  type CampaignSource,
  type MarketCampaignSource,
} from '../services/marketCampaign';

type SourceFormState = { source: MarketCampaignSource; label: string; externalRef: string };
const emptySourceForm: SourceFormState = { source: 'meta_ads', label: '', externalRef: '' };

const CAMPAIGN_SOURCES = Object.keys(MARKET_CAMPAIGN_SOURCE_LABELS) as MarketCampaignSource[];

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function CampanhasMarketing() {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;

  const [sources, setSources] = useState<CampaignSource[]>([]);
  const [signals, setSignals] = useState<CampaignSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<SourceFormState>(emptySourceForm);
  const [salvando, setSalvando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  const needsRealRef = MARKET_CAMPAIGN_SOURCE_NEEDS_REAL_REF[form.source];

  const load = () => {
    if (!clienteId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([listCampaignSources(clienteId), listCampaignSignals(clienteId)])
      .then(([sourcesResult, signalsResult]) => {
        setSources(sourcesResult);
        setSignals(signalsResult);
      })
      .catch((error) => showAppToast(error instanceof Error ? error.message : 'Falha ao carregar dados de campanhas.', 'warning'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [clienteId]);

  const openNew = () => {
    setForm(emptySourceForm);
    setModalOpen(true);
  };

  const saveSource = async () => {
    if (!clienteId) return;
    if (!form.label.trim()) return showAppToast('Informe um nome pra essa fonte.', 'warning');
    if (needsRealRef && !form.externalRef.trim()) {
      return showAppToast(`Informe: ${MARKET_CAMPAIGN_SOURCE_REF_LABEL[form.source]}.`, 'warning');
    }

    setSalvando(true);
    try {
      await createCampaignSource(clienteId, {
        source: form.source,
        label: form.label,
        externalRef: needsRealRef ? form.externalRef : form.label,
      });
      showAppToast('Fonte cadastrada.', 'success');
      setModalOpen(false);
      load();
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Falha ao cadastrar fonte.', 'warning');
    } finally {
      setSalvando(false);
    }
  };

  const toggleAtivo = async (source: CampaignSource) => {
    try {
      await setCampaignSourceAtivo(source.id, !source.ativo);
      load();
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Falha ao atualizar fonte.', 'warning');
    }
  };

  // Sincroniza 1 vez por tipo de fonte que tiver pelo menos 1 fonte ativa -- mesmo padrão de
  // EngajamentoSocial.tsx/Reputacao.tsx, 1 chamada separada por plataforma (contrato diferente
  // por fonte), reportado agregado.
  const syncNow = async () => {
    setSincronizando(true);
    try {
      const activeSourceTypes = new Set(sources.filter((s) => s.ativo).map((s) => s.source));
      const results = await Promise.all(
        CAMPAIGN_SOURCES.filter((source) => activeSourceTypes.has(source)).map((source) => syncCampaignSourceNow(clienteId, source)),
      );

      let totalUpserted = 0;
      let totalSourcesSynced = 0;
      const allErrors: string[] = [];
      for (const result of results) {
        if ('error' in result) { allErrors.push(result.error); continue; }
        totalUpserted += result.signalsUpserted;
        totalSourcesSynced += result.sourcesSynced;
        allErrors.push(...result.errors);
      }

      if (totalSourcesSynced > 0) {
        showAppToast(`Sincronizado: ${totalUpserted} campanha(s) de ${totalSourcesSynced} fonte(s).`, 'success');
      }
      if (allErrors.length > 0) showAppToast(allErrors[0], 'warning');
      load();
    } finally {
      setSincronizando(false);
    }
  };

  if (!clienteId) {
    return (
      <>
        <PageHeader title="Campanhas de Marketing" />
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>
          Acesse o contexto de um cliente para ver as campanhas dele.
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Campanhas de Marketing" />
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>Carregando...</div>
      </>
    );
  }

  const stats = computeCampaignStats(signals);
  const activeSources = sources.filter((s) => s.ativo).length;

  return (
    <>
      <PageHeader title="Campanhas de Marketing" />

      <div className="kpi-grid four">
        <KpiCard label="Campanhas monitoradas" value={String(stats.totalCampaigns)} trend="última sincronização" tone="green" />
        <KpiCard label="Impressões" value={stats.totalImpressions.toLocaleString('pt-BR')} trend="soma de todas as fontes" tone="blue" />
        <KpiCard label="Cliques" value={stats.totalClicks.toLocaleString('pt-BR')} trend="soma de todas as fontes" tone="purple" />
        <KpiCard label="Gasto" value={currencyFormatter.format(stats.totalSpend)} trend="Meta/Google Ads -- LinkedIn Ads sem métrica ainda" tone="orange" />
      </div>

      <section className="workspace-settings-panel">
        <div className="workspace-settings-header">
          <div>
            <h2>Fontes</h2>
            <p>Meta Ads, Google Ads e LinkedIn Ads -- campanhas e performance agregada, leitura-só.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="secondary-btn" onClick={syncNow} disabled={sincronizando || activeSources === 0}>
              {sincronizando ? 'Sincronizando...' : 'Sincronizar agora'}
            </button>
            <button className="secondary-btn" onClick={openNew}>Nova fonte</button>
          </div>
        </div>
      </section>

      <section className="card roadmap-card">
        <div className="section-title-row">
          <h3>Fontes cadastradas</h3>
          <span className="small-muted">{sources.length} registros</span>
        </div>
        {sources.length === 0 ? (
          <p className="empty-note">Nenhuma fonte cadastrada ainda. Cadastre uma conta de anúncio pra começar a sincronizar.</p>
        ) : (
          <div className="simple-table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>Fonte</th><th>Identificador</th><th>Última sincronização</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {sources.map((source) => (
                  <tr key={source.id}>
                    <td><strong>{source.label}</strong></td>
                    <td className="table-subtitle">{MARKET_CAMPAIGN_SOURCE_LABELS[source.source]}</td>
                    <td className="table-subtitle">{MARKET_CAMPAIGN_SOURCE_NEEDS_REAL_REF[source.source] ? source.externalRef : '—'}</td>
                    <td className="table-subtitle">
                      {source.lastSyncedAt ? new Date(source.lastSyncedAt).toLocaleString('pt-BR') : 'nunca'}
                      {source.lastSyncError && <div style={{ color: 'var(--red-500)' }}>{source.lastSyncError}</div>}
                    </td>
                    <td><Badge tone={source.ativo ? 'green' : 'blue'}>{source.ativo ? 'Ativa' : 'Inativa'}</Badge></td>
                    <td><button className="secondary-btn" onClick={() => toggleAtivo(source)}>{source.ativo ? 'Desativar' : 'Ativar'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card roadmap-card">
        <div className="section-title-row">
          <h3>Campanhas recentes</h3>
          <span className="small-muted">{signals.length} registros</span>
        </div>
        {signals.length === 0 ? (
          <p className="empty-note">Nenhuma campanha sincronizada ainda.</p>
        ) : (
          <div className="simple-table-wrap">
            <table>
              <thead><tr><th>Sincronizado em</th><th>Fonte</th><th>Campanha</th><th>Status</th><th>Impressões</th><th>Cliques</th><th>Gasto</th></tr></thead>
              <tbody>
                {signals.map((signal) => (
                  <tr key={signal.id}>
                    <td className="table-subtitle">{new Date(signal.occurredAt).toLocaleDateString('pt-BR')}</td>
                    <td className="table-subtitle">{MARKET_CAMPAIGN_SOURCE_LABELS[signal.source]}</td>
                    <td className="table-subtitle">{signal.campaignName ?? '—'}</td>
                    <td className="table-subtitle">{signal.campaignStatus ?? '—'}</td>
                    <td>{signal.metrics.impressions ?? '—'}</td>
                    <td>{signal.metrics.clicks ?? '—'}</td>
                    <td>{signal.metrics.spend !== undefined ? currencyFormatter.format(signal.metrics.spend) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="agent-modal">
            <div className="cadastro-modal-header">
              <strong>Nova fonte</strong>
              <button className="icon-btn" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>
            <div className="cadastro-modal-content">
              <section className="cadastro-form-section">
                <div className="cadastro-form-grid">
                  <label className="span-2">
                    <span>Fonte *</span>
                    <select
                      value={form.source}
                      onChange={(event) => setForm((c) => ({ ...c, source: event.target.value as MarketCampaignSource, externalRef: '' }))}
                    >
                      {CAMPAIGN_SOURCES.map((source) => (
                        <option key={source} value={source}>{MARKET_CAMPAIGN_SOURCE_LABELS[source]}</option>
                      ))}
                    </select>
                  </label>
                  <label className="span-2">
                    <span>Nome *</span>
                    <input value={form.label} onChange={(event) => setForm((c) => ({ ...c, label: event.target.value }))} placeholder="Ex.: Conta principal" />
                  </label>
                  {needsRealRef && (
                    <label className="span-2">
                      <span>{MARKET_CAMPAIGN_SOURCE_REF_LABEL[form.source]} *</span>
                      <input value={form.externalRef} onChange={(event) => setForm((c) => ({ ...c, externalRef: event.target.value }))} />
                    </label>
                  )}
                  {!needsRealRef && (
                    <p className="empty-note span-2">
                      {MARKET_CAMPAIGN_SOURCE_LABELS[form.source]} não precisa de identificador aqui -- a credencial já resolve a conta de anúncio, o "Nome" acima já basta.
                    </p>
                  )}
                </div>
              </section>
            </div>
            <div className="cadastro-modal-footer">
              <button onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="primary" onClick={saveSource} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar fonte'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CampanhasMarketing;
