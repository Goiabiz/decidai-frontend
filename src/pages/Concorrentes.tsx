import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { CollapsibleKpiSection } from '../components/CollapsibleKpiSection';
import { Badge } from '../components/Badge';
import { showAppToast } from '../lib/appToast';
import { useSession } from '../contexts/SessionContext';
import {
  createCompetitiveSource,
  listCompetitiveSignals,
  listCompetitiveSources,
  setCompetitiveSourceAtivo,
  syncCompetitiveSourcesNow,
  type CompetitiveSignal,
  type CompetitiveSource,
} from '../services/marketCompetitive';

type SourceFormState = { url: string; label: string };
const emptySourceForm: SourceFormState = { url: '', label: '' };

export function Concorrentes() {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;

  const [sources, setSources] = useState<CompetitiveSource[]>([]);
  const [signals, setSignals] = useState<CompetitiveSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<SourceFormState>(emptySourceForm);
  const [salvando, setSalvando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  const load = () => {
    if (!clienteId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([listCompetitiveSources(clienteId), listCompetitiveSignals(clienteId)])
      .then(([sourcesResult, signalsResult]) => {
        setSources(sourcesResult);
        setSignals(signalsResult);
      })
      .catch((error) => showAppToast(error instanceof Error ? error.message : 'Falha ao carregar dados de concorrentes.', 'warning'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [clienteId]);

  const openNew = () => {
    setForm(emptySourceForm);
    setModalOpen(true);
  };

  const saveSource = async () => {
    if (!clienteId) return;
    if (!form.label.trim()) return showAppToast('Informe um nome pra esse concorrente.', 'warning');
    if (!form.url.trim()) return showAppToast('Informe a URL pública da página a monitorar.', 'warning');
    try {
      new URL(form.url.trim());
    } catch {
      return showAppToast('URL inválida -- inclua "https://" no início.', 'warning');
    }

    setSalvando(true);
    try {
      await createCompetitiveSource(clienteId, { url: form.url.trim(), label: form.label });
      showAppToast('Fonte cadastrada.', 'success');
      setModalOpen(false);
      load();
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Falha ao cadastrar fonte.', 'warning');
    } finally {
      setSalvando(false);
    }
  };

  const toggleAtivo = async (source: CompetitiveSource) => {
    try {
      await setCompetitiveSourceAtivo(source.id, !source.ativo);
      load();
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Falha ao atualizar fonte.', 'warning');
    }
  };

  const syncNow = async () => {
    setSincronizando(true);
    try {
      const result = await syncCompetitiveSourcesNow(clienteId);
      if ('error' in result) {
        showAppToast(result.error, 'warning');
      } else {
        showAppToast(`Sincronizado: ${result.signalsUpserted} leitura(s) de ${result.sourcesSynced} fonte(s).`, 'success');
        if (result.errors.length > 0) showAppToast(result.errors[0], 'warning');
      }
      load();
    } finally {
      setSincronizando(false);
    }
  };

  if (!clienteId) {
    return (
      <>
        <PageHeader title="Concorrentes" />
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>
          Acesse o contexto de um cliente para ver o monitoramento de concorrentes dele.
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Concorrentes" />
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>Carregando...</div>
      </>
    );
  }

  const activeSources = sources.filter((s) => s.ativo).length;
  const changedSignals = signals.filter((s) => s.summary && !s.summary.startsWith('Nenhuma mudança')).length;

  return (
    <>
      <PageHeader title="Concorrentes" />

      <CollapsibleKpiSection>
        <div className="kpi-grid four">
          <KpiCard label="Concorrentes monitorados" value={String(sources.length)} trend={`${activeSources} ativos`} tone="green" />
          <KpiCard label="Leituras registradas" value={String(signals.length)} trend="páginas lidas até agora" tone="blue" />
          <KpiCard label="Mudanças detectadas" value={String(changedSignals)} trend="resumidas por IA" tone="orange" />
          <KpiCard label="Fontes ativas" value={String(activeSources)} trend={`${sources.length} cadastradas`} tone="purple" />
        </div>
      </CollapsibleKpiSection>

      <section className="workspace-settings-panel">
        <div className="workspace-settings-header">
          <div>
            <h2>Fontes</h2>
            <p>URL pública do concorrente (site, página de preço) -- leitura de texto via Browser Service, sem login nem clique.</p>
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
          <p className="empty-note">Nenhum concorrente cadastrado ainda. Cadastre a URL de uma página pública pra começar a monitorar.</p>
        ) : (
          <div className="simple-table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>URL</th><th>Última sincronização</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {sources.map((source) => (
                  <tr key={source.id}>
                    <td><strong>{source.label}</strong></td>
                    <td className="table-subtitle">{source.url}</td>
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
          <h3>Leituras recentes</h3>
          <span className="small-muted">{signals.length} registros</span>
        </div>
        {signals.length === 0 ? (
          <p className="empty-note">Nenhuma leitura sincronizada ainda.</p>
        ) : (
          <div className="simple-table-wrap">
            <table>
              <thead><tr><th>Data</th><th>Página</th><th>Resumo da mudança (IA)</th></tr></thead>
              <tbody>
                {signals.map((signal) => (
                  <tr key={signal.id}>
                    <td className="table-subtitle">{new Date(signal.occurredAt).toLocaleString('pt-BR')}</td>
                    <td className="table-subtitle">{signal.pageTitle ?? '—'}</td>
                    <td>{signal.summary ?? <span className="table-subtitle">1ª leitura desta fonte -- nada pra comparar ainda.</span>}</td>
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
                    <span>Nome do concorrente *</span>
                    <input value={form.label} onChange={(event) => setForm((c) => ({ ...c, label: event.target.value }))} placeholder="Ex.: Concorrente X -- página de preços" />
                  </label>
                  <label className="span-2">
                    <span>URL pública *</span>
                    <input value={form.url} onChange={(event) => setForm((c) => ({ ...c, url: event.target.value }))} placeholder="https://exemplo.com/precos" />
                  </label>
                  <p className="empty-note span-2">
                    Leitura-só, sem login -- só páginas públicas. Cada "Sincronizar agora" tira um retrato novo e resume o que mudou desde o anterior.
                  </p>
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

export default Concorrentes;
