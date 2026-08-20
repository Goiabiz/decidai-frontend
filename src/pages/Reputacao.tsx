import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { Badge } from '../components/Badge';
import { showAppToast } from '../lib/appToast';
import { useSession } from '../contexts/SessionContext';
import {
  computeReputationStats,
  createReputationSource,
  listReputationSignals,
  listReputationSources,
  setReputationSourceAtivo,
  syncGbpReviewsNow,
  type MarketSignal,
  type MarketSource,
} from '../services/market';

type SourceFormState = { label: string; externalRef: string };
const emptySourceForm: SourceFormState = { label: '', externalRef: '' };

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

  const saveSource = async () => {
    if (!clienteId) return;
    if (!form.label.trim()) return showAppToast('Informe um nome pra essa fonte.', 'warning');
    if (!form.externalRef.trim()) return showAppToast('Informe o identificador do local no Google Business Profile.', 'warning');

    setSalvando(true);
    try {
      await createReputationSource(clienteId, { label: form.label, externalRef: form.externalRef });
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

  const syncNow = async () => {
    setSincronizando(true);
    try {
      const result = await syncGbpReviewsNow(clienteId);
      if ('error' in result) return showAppToast(result.error, 'warning');
      showAppToast(`Sincronizado: ${result.signalsUpserted} avaliação(ões) de ${result.sourcesSynced} fonte(s).`, 'success');
      if (result.errors.length > 0) showAppToast(result.errors[0], 'warning');
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

      <div className="kpi-grid four">
        <KpiCard label="Nota média" value={stats.averageRating !== null ? stats.averageRating.toFixed(1) : '—'} trend={`${stats.totalSignals} avaliações no total`} tone="green" />
        <KpiCard label="Últimos 30 dias" value={String(stats.last30Days)} trend="novas avaliações" tone="blue" />
        <KpiCard label="Fontes ativas" value={String(activeSources)} trend={`${sources.length} cadastradas`} tone="purple" />
        <KpiCard label="Fonte" value="Google Business Profile" trend="leitura-só" tone="orange" />
      </div>

      <section className="workspace-settings-panel">
        <div className="workspace-settings-header">
          <div>
            <h2>Fontes</h2>
            <p>De onde vêm os sinais de reputação -- v1 cobre só Google Business Profile, leitura-só.</p>
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
          <p className="empty-note">Nenhuma fonte cadastrada ainda. Cadastre o identificador do local no Google Business Profile pra começar a sincronizar.</p>
        ) : (
          <div className="simple-table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>Identificador</th><th>Última sincronização</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {sources.map((source) => (
                  <tr key={source.id}>
                    <td><strong>{source.label}</strong></td>
                    <td className="table-subtitle">{source.externalRef}</td>
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
          <h3>Avaliações recentes</h3>
          <span className="small-muted">{signals.length} registros</span>
        </div>
        {signals.length === 0 ? (
          <p className="empty-note">Nenhuma avaliação sincronizada ainda.</p>
        ) : (
          <div className="simple-table-wrap">
            <table>
              <thead><tr><th>Data</th><th>Autor</th><th>Nota</th><th>Comentário</th></tr></thead>
              <tbody>
                {signals.map((signal) => (
                  <tr key={signal.id}>
                    <td className="table-subtitle">{new Date(signal.occurredAt).toLocaleDateString('pt-BR')}</td>
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
                    <span>Nome *</span>
                    <input value={form.label} onChange={(event) => setForm((c) => ({ ...c, label: event.target.value }))} placeholder="Ex.: Unidade Centro" />
                  </label>
                  <label className="span-2">
                    <span>Identificador do local (Google Business Profile) *</span>
                    <input value={form.externalRef} onChange={(event) => setForm((c) => ({ ...c, externalRef: event.target.value }))} placeholder="accounts/123456789/locations/987654321" />
                  </label>
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
