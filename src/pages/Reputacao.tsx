import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { CollapsibleKpiSection } from '../components/CollapsibleKpiSection';
import { Badge } from '../components/Badge';
import { showAppToast } from '../lib/appToast';
import { useSession } from '../contexts/SessionContext';
import {
  computeReputationStats,
  createReputationSource,
  listReputationSignals,
  listReputationSources,
  MARKET_REPUTATION_SOURCE_LABELS,
  MARKET_REPUTATION_SOURCE_NEEDS_REAL_REF,
  setReputationSourceAtivo,
  syncGbpReviewsNow,
  syncReputationSourceNow,
  type MarketReputationSource,
  type MarketSignal,
  type MarketSource,
  type ReputationSyncableSource,
} from '../services/market';

type SourceFormState = { source: MarketReputationSource; label: string; externalRef: string };
const emptySourceForm: SourceFormState = { source: 'google_business_profile', label: '', externalRef: '' };

const REPUTATION_SOURCES = Object.keys(MARKET_REPUTATION_SOURCE_LABELS) as MarketReputationSource[];
const SYNCABLE_SOURCES = REPUTATION_SOURCES.filter((s) => s !== 'google_business_profile') as ReputationSyncableSource[];

const SIGNAL_TYPE_LABELS: Record<MarketSignal['signalType'], string> = {
  review: 'Avaliação',
  nps: 'NPS',
  csat: 'CSAT',
  complaint: 'Reclamação',
};

const SOURCE_REF_PLACEHOLDER: Record<MarketReputationSource, string> = {
  google_business_profile: 'accounts/123456789/locations/987654321',
  trustpilot: 'business-unit-id (painel Trustpilot Business)',
  tracksale: '',
  reclame_aqui: '',
};

export function Reputacao() {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;

  const [sources, setSources] = useState<MarketSource[]>([]);
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<SourceFormState>(emptySourceForm);
  const [salvando, setSalvando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  const load = () => {
    if (!clienteId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([listReputationSources(clienteId), listReputationSignals(clienteId)])
      .then(([sourcesResult, signalsResult]) => {
        setSources(sourcesResult);
        setSignals(signalsResult);
      })
      .catch((error) => showAppToast(error instanceof Error ? error.message : 'Falha ao carregar dados de reputação.', 'warning'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [clienteId]);

  const openNew = () => {
    setForm(emptySourceForm);
    setModalOpen(true);
  };

  const needsRealRef = MARKET_REPUTATION_SOURCE_NEEDS_REAL_REF[form.source];

  const saveSource = async () => {
    if (!clienteId) return;
    if (!form.label.trim()) return showAppToast('Informe um nome pra essa fonte.', 'warning');
    if (needsRealRef && !form.externalRef.trim()) {
      return showAppToast(`Informe o identificador da fonte no ${MARKET_REPUTATION_SOURCE_LABELS[form.source]}.`, 'warning');
    }

    setSalvando(true);
    try {
      await createReputationSource(clienteId, {
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

  const toggleAtivo = async (source: MarketSource) => {
    try {
      await setReputationSourceAtivo(source.id, !source.ativo);
      load();
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Falha ao atualizar fonte.', 'warning');
    }
  };

  // Sincroniza GBP + as fontes de reputação novas que tiverem pelo menos 1 fonte ativa
  // cadastrada -- 1 chamada por tipo de fonte (contratos diferentes), reportado como 1
  // resultado agregado pro usuário não precisar clicar 4 vezes.
  const syncNow = async () => {
    setSincronizando(true);
    try {
      const activeSourceTypes = new Set(sources.filter((s) => s.ativo).map((s) => s.source));
      const calls: Array<Promise<{ sourcesSynced: number; signalsUpserted: number; errors: string[] } | { error: string }>> = [];
      if (activeSourceTypes.has('google_business_profile')) calls.push(syncGbpReviewsNow(clienteId));
      for (const source of SYNCABLE_SOURCES) {
        if (activeSourceTypes.has(source)) calls.push(syncReputationSourceNow(clienteId, source));
      }

      const results = await Promise.all(calls);
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
        showAppToast(`Sincronizado: ${totalUpserted} sinal(is) de ${totalSourcesSynced} fonte(s).`, 'success');
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
        <PageHeader title="Reputação" />
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>
          Acesse o contexto de um cliente para ver os sinais de reputação dele.
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Reputação" />
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>Carregando...</div>
      </>
    );
  }

  const stats = computeReputationStats(signals);
  const activeSources = sources.filter((s) => s.ativo).length;

  return (
    <>
      <PageHeader title="Reputação" />

      <CollapsibleKpiSection>
        <div className="kpi-grid four">
          <KpiCard label="Nota média" value={stats.averageRating !== null ? stats.averageRating.toFixed(1) : '—'} trend={`${stats.totalSignals} sinais no total`} tone="green" />
          <KpiCard label="Últimos 30 dias" value={String(stats.last30Days)} trend="novos sinais" tone="blue" />
          <KpiCard label="Fontes ativas" value={String(activeSources)} trend={`${sources.length} cadastradas`} tone="purple" />
          <KpiCard label="Fontes suportadas" value={String(REPUTATION_SOURCES.length)} trend="leitura-só" tone="orange" />
        </div>
      </CollapsibleKpiSection>

      <section className="workspace-settings-panel">
        <div className="workspace-settings-header">
          <div>
            <h2>Fontes</h2>
            <p>De onde vêm os sinais de reputação -- Google Business Profile, Trustpilot, Track.co/Tracksale e Reclame Aqui, todas leitura-só.</p>
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
          <p className="empty-note">Nenhuma fonte cadastrada ainda. Cadastre uma fonte (Google Business Profile, Trustpilot, Track.co ou Reclame Aqui) pra começar a sincronizar.</p>
        ) : (
          <div className="simple-table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>Fonte</th><th>Identificador</th><th>Última sincronização</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {sources.map((source) => (
                  <tr key={source.id}>
                    <td><strong>{source.label}</strong></td>
                    <td className="table-subtitle">{MARKET_REPUTATION_SOURCE_LABELS[source.source]}</td>
                    <td className="table-subtitle">{MARKET_REPUTATION_SOURCE_NEEDS_REAL_REF[source.source] ? source.externalRef : '—'}</td>
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
          <h3>Sinais recentes</h3>
          <span className="small-muted">{signals.length} registros</span>
        </div>
        {signals.length === 0 ? (
          <p className="empty-note">Nenhum sinal sincronizado ainda.</p>
        ) : (
          <div className="simple-table-wrap">
            <table>
              <thead><tr><th>Data</th><th>Fonte</th><th>Tipo</th><th>Autor</th><th>Nota</th><th>Comentário</th></tr></thead>
              <tbody>
                {signals.map((signal) => (
                  <tr key={signal.id}>
                    <td className="table-subtitle">{new Date(signal.occurredAt).toLocaleDateString('pt-BR')}</td>
                    <td className="table-subtitle">{MARKET_REPUTATION_SOURCE_LABELS[signal.source]}</td>
                    <td><Badge tone="blue">{SIGNAL_TYPE_LABELS[signal.signalType]}</Badge></td>
                    <td>{signal.authorName || 'Anônimo'}</td>
                    <td>{signal.rating !== null ? `${signal.rating}★` : '—'}</td>
                    <td className="table-subtitle">{signal.comment || '-'}</td>
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
                      onChange={(event) => setForm((c) => ({ ...c, source: event.target.value as MarketReputationSource, externalRef: '' }))}
                    >
                      {REPUTATION_SOURCES.map((source) => (
                        <option key={source} value={source}>{MARKET_REPUTATION_SOURCE_LABELS[source]}</option>
                      ))}
                    </select>
                  </label>
                  <label className="span-2">
                    <span>Nome *</span>
                    <input value={form.label} onChange={(event) => setForm((c) => ({ ...c, label: event.target.value }))} placeholder="Ex.: Unidade Centro" />
                  </label>
                  {needsRealRef && (
                    <label className="span-2">
                      <span>Identificador da fonte ({MARKET_REPUTATION_SOURCE_LABELS[form.source]}) *</span>
                      <input value={form.externalRef} onChange={(event) => setForm((c) => ({ ...c, externalRef: event.target.value }))} placeholder={SOURCE_REF_PLACEHOLDER[form.source]} />
                    </label>
                  )}
                  {!needsRealRef && (
                    <p className="empty-note span-2">
                      {MARKET_REPUTATION_SOURCE_LABELS[form.source]} não tem identificador por local -- 1 credencial cobre a conta inteira, o "Nome" acima já basta.
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

export default Reputacao;
