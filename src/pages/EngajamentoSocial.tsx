import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { CollapsibleKpiSection } from '../components/CollapsibleKpiSection';
import { Badge } from '../components/Badge';
import { showAppToast } from '../lib/appToast';
import { useSession } from '../contexts/SessionContext';
import {
  computeSocialStats,
  createSocialSource,
  listSocialSignals,
  listSocialSources,
  MARKET_SOCIAL_SOURCE_LABELS,
  MARKET_SOCIAL_SOURCE_REF_LABEL,
  setSocialSourceAtivo,
  syncSocialSourceNow,
  type MarketSocialSource,
  type SocialSignal,
  type SocialSource,
} from '../services/marketSocial';

type SourceFormState = { source: MarketSocialSource; label: string; externalRef: string };
const emptySourceForm: SourceFormState = { source: 'instagram', label: '', externalRef: '' };

const SOCIAL_SOURCES = Object.keys(MARKET_SOCIAL_SOURCE_LABELS) as MarketSocialSource[];

export function EngajamentoSocial() {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;

  const [sources, setSources] = useState<SocialSource[]>([]);
  const [signals, setSignals] = useState<SocialSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<SourceFormState>(emptySourceForm);
  const [salvando, setSalvando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  const load = () => {
    if (!clienteId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([listSocialSources(clienteId), listSocialSignals(clienteId)])
      .then(([sourcesResult, signalsResult]) => {
        setSources(sourcesResult);
        setSignals(signalsResult);
      })
      .catch((error) => showAppToast(error instanceof Error ? error.message : 'Falha ao carregar dados de engajamento social.', 'warning'))
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
    if (!form.externalRef.trim()) return showAppToast(`Informe: ${MARKET_SOCIAL_SOURCE_REF_LABEL[form.source]}.`, 'warning');

    setSalvando(true);
    try {
      await createSocialSource(clienteId, { source: form.source, label: form.label, externalRef: form.externalRef });
      showAppToast('Fonte cadastrada.', 'success');
      setModalOpen(false);
      load();
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Falha ao cadastrar fonte.', 'warning');
    } finally {
      setSalvando(false);
    }
  };

  const toggleAtivo = async (source: SocialSource) => {
    try {
      await setSocialSourceAtivo(source.id, !source.ativo);
      load();
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Falha ao atualizar fonte.', 'warning');
    }
  };

  // Sincroniza 1 vez por tipo de fonte que tiver pelo menos 1 fonte ativa -- cada plataforma é
  // 1 chamada separada no runtime (contrato diferente por fonte), reportado agregado.
  const syncNow = async () => {
    setSincronizando(true);
    try {
      const activeSourceTypes = new Set(sources.filter((s) => s.ativo).map((s) => s.source));
      const results = await Promise.all(
        SOCIAL_SOURCES.filter((source) => activeSourceTypes.has(source)).map((source) => syncSocialSourceNow(clienteId, source)),
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
        <PageHeader title="Engajamento Social" />
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>
          Acesse o contexto de um cliente para ver o engajamento social dele.
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Engajamento Social" />
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>Carregando...</div>
      </>
    );
  }

  const stats = computeSocialStats(signals);
  const activeSources = sources.filter((s) => s.ativo).length;

  return (
    <>
      <PageHeader title="Engajamento Social" />

      <CollapsibleKpiSection>
        <div className="kpi-grid four">
          <KpiCard label="Posts monitorados" value={String(stats.totalPosts)} trend={`${stats.last30Days} nos últimos 30 dias`} tone="green" />
          <KpiCard label="Engajamento total" value={String(stats.totalEngagement)} trend="curtidas + comentários + compartilhamentos" tone="blue" />
          <KpiCard label="Seguidores (última fonte)" value={stats.latestFollowers !== null ? String(stats.latestFollowers) : '—'} trend="retrato mais recente" tone="purple" />
          <KpiCard label="Fontes ativas" value={String(activeSources)} trend={`${sources.length} cadastradas`} tone="orange" />
        </div>
      </CollapsibleKpiSection>

      <section className="workspace-settings-panel">
        <div className="workspace-settings-header">
          <div>
            <h2>Fontes</h2>
            <p>Instagram, Facebook, LinkedIn, TikTok e YouTube -- posts e métricas agregadas de engajamento, leitura-só.</p>
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
          <p className="empty-note">Nenhuma fonte cadastrada ainda. Cadastre uma conta/página/canal pra começar a sincronizar.</p>
        ) : (
          <div className="simple-table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>Fonte</th><th>Identificador</th><th>Última sincronização</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {sources.map((source) => (
                  <tr key={source.id}>
                    <td><strong>{source.label}</strong></td>
                    <td className="table-subtitle">{MARKET_SOCIAL_SOURCE_LABELS[source.source]}</td>
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
          <h3>Posts recentes</h3>
          <span className="small-muted">{signals.filter((s) => s.signalType === 'post').length} registros</span>
        </div>
        {signals.filter((s) => s.signalType === 'post').length === 0 ? (
          <p className="empty-note">Nenhum post sincronizado ainda.</p>
        ) : (
          <div className="simple-table-wrap">
            <table>
              <thead><tr><th>Data</th><th>Fonte</th><th>Conteúdo</th><th>Curtidas</th><th>Comentários</th><th>Views</th></tr></thead>
              <tbody>
                {signals.filter((s) => s.signalType === 'post').map((signal) => (
                  <tr key={signal.id}>
                    <td className="table-subtitle">{new Date(signal.occurredAt).toLocaleDateString('pt-BR')}</td>
                    <td className="table-subtitle">{MARKET_SOCIAL_SOURCE_LABELS[signal.source]}</td>
                    <td className="table-subtitle">{signal.caption ? (signal.caption.length > 80 ? `${signal.caption.slice(0, 80)}…` : signal.caption) : '—'}</td>
                    <td>{signal.metrics.likes ?? '—'}</td>
                    <td>{signal.metrics.comments ?? '—'}</td>
                    <td>{signal.metrics.views ?? '—'}</td>
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
                      onChange={(event) => setForm((c) => ({ ...c, source: event.target.value as MarketSocialSource, externalRef: '' }))}
                    >
                      {SOCIAL_SOURCES.map((source) => (
                        <option key={source} value={source}>{MARKET_SOCIAL_SOURCE_LABELS[source]}</option>
                      ))}
                    </select>
                  </label>
                  <label className="span-2">
                    <span>Nome *</span>
                    <input value={form.label} onChange={(event) => setForm((c) => ({ ...c, label: event.target.value }))} placeholder="Ex.: Conta principal" />
                  </label>
                  <label className="span-2">
                    <span>{MARKET_SOCIAL_SOURCE_REF_LABEL[form.source]} *</span>
                    <input value={form.externalRef} onChange={(event) => setForm((c) => ({ ...c, externalRef: event.target.value }))} />
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

export default EngajamentoSocial;
