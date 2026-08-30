import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Handshake, LayoutGrid, ListChecks, Package } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/Badge';
import { BrandIcon } from '../../components/BrandIcon';
import { showAppToast } from '../../lib/appToast';
import { useSession } from '../../contexts/SessionContext';
import { providerDomain } from '../../services/v35Supabase';
import {
  listMarketplaceCatalog,
  listPartnerSubmissions,
  updateSubmissionStatus,
  type ConnectorTier,
  type MarketplaceItem,
  type PartnerSubmission,
} from '../../services/marketplace';
import {
  acquireBusinessPack,
  listBusinessPackAcquisitions,
  listPublishedBusinessPacks,
  revokeBusinessPack,
  type BusinessPack,
  type BusinessPackAcquisition,
} from '../../services/businessPacks';

const tierTone: Record<ConnectorTier, string> = {
  nativo: 'green',
  oficial: 'blue',
  parceiro: 'purple',
  comunidade: 'gray',
  customizado: 'yellow',
};

const tierLabel: Record<ConnectorTier, string> = {
  nativo: 'Nativo',
  oficial: 'Oficial',
  parceiro: 'Parceiro',
  comunidade: 'Comunidade',
  customizado: 'Customizado',
};

const submissionStatusTone: Record<string, string> = {
  pendente: 'yellow',
  em_analise: 'blue',
  aprovado: 'green',
  rejeitado: 'red',
};

const submissionStatusLabel: Record<string, string> = {
  pendente: 'Pendente',
  em_analise: 'Em análise',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
};

const packTypeLabel: Record<string, string> = {
  industry: 'Setor',
  business: 'Negócio',
  regulatory: 'Regulatório',
  skill: 'Skill',
  workflow: 'Workflow',
  connector: 'Conector',
  ontology: 'Ontologia',
};

export function Marketplace() {
  const { isSupport, session } = useSession();
  const clienteId = session?.activeClientId ?? null;
  const [tab, setTab] = useState<'vitrine' | 'solicitacoes' | 'packs'>('vitrine');
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<PartnerSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [packs, setPacks] = useState<BusinessPack[]>([]);
  const [acquisitions, setAcquisitions] = useState<BusinessPackAcquisition[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(false);
  const [acquiringPackId, setAcquiringPackId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listMarketplaceCatalog().then((result) => setItems(result.items)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== 'solicitacoes' || !isSupport) return;
    setLoadingSubmissions(true);
    listPartnerSubmissions().then((result) => setSubmissions(result.items)).finally(() => setLoadingSubmissions(false));
  }, [tab, isSupport]);

  const loadPacks = () => {
    if (tab !== 'packs') return;
    setLoadingPacks(true);
    const acquisitionsPromise = clienteId ? listBusinessPackAcquisitions(clienteId) : Promise.resolve([]);
    Promise.all([listPublishedBusinessPacks(), acquisitionsPromise])
      .then(([packsResult, acquisitionsResult]) => {
        setPacks(packsResult);
        setAcquisitions(acquisitionsResult);
      })
      .catch((error) => showAppToast(error instanceof Error ? error.message : 'Falha ao carregar packs.', 'warning'))
      .finally(() => setLoadingPacks(false));
  };

  useEffect(loadPacks, [tab, clienteId]);

  const acquiredPackIds = useMemo(
    () => new Set(acquisitions.filter((a) => a.status === 'ativo').map((a) => a.packId)),
    [acquisitions],
  );

  const packsByType = useMemo(() => {
    const map = new Map<string, BusinessPack[]>();
    for (const pack of packs) {
      const list = map.get(pack.packType) || [];
      list.push(pack);
      map.set(pack.packType, list);
    }
    return Array.from(map.entries());
  }, [packs]);

  const handleAcquire = async (pack: BusinessPack) => {
    if (!clienteId) return showAppToast('Acesse o contexto de um cliente pra adquirir um pack.', 'warning');
    setAcquiringPackId(pack.id);
    try {
      const result = await acquireBusinessPack(clienteId, pack.id);
      if ('error' in result) { showAppToast(result.error, 'warning'); return; }
      showAppToast(`Pack "${pack.nome}" adquirido.`, 'success');
      loadPacks();
    } finally {
      setAcquiringPackId(null);
    }
  };

  const handleRevoke = async (pack: BusinessPack) => {
    if (!clienteId) return;
    setAcquiringPackId(pack.id);
    try {
      const result = await revokeBusinessPack(clienteId, pack.id);
      if ('error' in result) { showAppToast(result.error, 'warning'); return; }
      showAppToast(`Pack "${pack.nome}" revogado.`, 'success');
      loadPacks();
    } finally {
      setAcquiringPackId(null);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, MarketplaceItem[]>();
    for (const item of items) {
      const category = item.categoryName || 'Outros';
      const current = map.get(category) || [];
      current.push(item);
      map.set(category, current);
    }
    return Array.from(map.entries());
  }, [items]);

  const decideSubmission = async (submission: PartnerSubmission, status: 'aprovado' | 'rejeitado') => {
    await updateSubmissionStatus(submission.id, status);
    setSubmissions((current) => current.map((item) => (item.id === submission.id ? { ...item, status } : item)));
    showAppToast(status === 'aprovado' ? 'Submissão aprovada.' : 'Submissão rejeitada.', 'success');
  };

  return (
    <div className="v3464-page">
      <PageHeader
        title="Marketplace"
        subtitle="Vitrine de conectores e apps — nativos, oficiais DecidAI e de parceiros."
      />

      <div className="v3464-page-head" style={{ marginBottom: 18 }}>
        <div className="view-toggle">
          <button className={tab === 'vitrine' ? 'active' : ''} onClick={() => setTab('vitrine')}><LayoutGrid size={14} /> Vitrine</button>
          <button className={tab === 'packs' ? 'active' : ''} onClick={() => setTab('packs')}><Package size={14} /> Business Packs</button>
          {isSupport && (
            <button className={tab === 'solicitacoes' ? 'active' : ''} onClick={() => setTab('solicitacoes')}><ListChecks size={14} /> Solicitações de parceiros</button>
          )}
        </div>
        <a className="v3464-btn primary" href="/parceiros" target="_blank" rel="noreferrer">
          <Handshake size={16} /> Quer ser parceiro? <ExternalLink size={14} />
        </a>
      </div>

      {tab === 'vitrine' && (
        <section className="v3464-card">
          {loading && <p className="v36-muted">Carregando catálogo...</p>}
          {!loading && grouped.length === 0 && <p className="v36-muted">Nenhum item no catálogo ainda.</p>}
          {!loading && grouped.map(([category, groupItems]) => (
            <div className="v3464-integration-section" key={category}>
              <div className="v3464-section-title">
                <h2>{category}</h2>
                <small className="v36-muted">{groupItems.length} itens</small>
              </div>
              <div className="v3464-plugin-grid">
                {groupItems.map((item) => (
                  <div className="v3464-plugin v36-provider-card" key={item.id}>
                    <BrandIcon label={item.name} domain={providerDomain({ code: item.code, logo_hint: item.logoHint, name: item.name })} />
                    <span>
                      <strong>{item.name}</strong>
                      <small>
                        <Badge tone={tierTone[item.tier]}>{tierLabel[item.tier]}</Badge>
                        {item.minPlanCode && <> • Plano {item.minPlanCode}</>}
                      </small>
                      <em>{item.description || 'Conector preparado para uso no ambiente do cliente.'}</em>
                      {item.tier === 'parceiro' && (item.revenueSharePartnerPct || item.revenueSharePromoPct) && (
                        <em>
                          {item.revenueSharePromoPct ? `${item.revenueSharePromoPct}% promocional` : `${item.revenueSharePartnerPct}% pro parceiro`}
                          {item.partnerEmpresaNome ? ` • ${item.partnerEmpresaNome}` : ''}
                        </em>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 'packs' && (
        <section className="v3464-card">
          {!clienteId && <p className="v36-muted">Acesse o contexto de um cliente pra ver e adquirir packs.</p>}
          {clienteId && loadingPacks && <p className="v36-muted">Carregando packs...</p>}
          {clienteId && !loadingPacks && packsByType.length === 0 && <p className="v36-muted">Nenhum pack publicado ainda.</p>}
          {clienteId && !loadingPacks && packsByType.map(([packType, groupPacks]) => (
            <div className="v3464-integration-section" key={packType}>
              <div className="v3464-section-title">
                <h2>{packTypeLabel[packType] || packType}</h2>
                <small className="v36-muted">{groupPacks.length} pack(s)</small>
              </div>
              <div className="v3464-plugin-grid">
                {groupPacks.map((pack) => {
                  const acquired = acquiredPackIds.has(pack.id);
                  const busy = acquiringPackId === pack.id;
                  return (
                    <div className="v3464-plugin v36-provider-card" key={pack.id}>
                      <span>
                        <strong>{pack.nome}</strong>
                        <small>
                          <Badge tone={acquired ? 'green' : 'gray'}>{acquired ? 'Adquirido' : 'Disponível'}</Badge>
                          {pack.minPlanCode && <> • Plano mínimo: {pack.minPlanCode}</>}
                          {' '}• v{pack.versaoAtual}
                        </small>
                        <em>{pack.descricao || 'Sem descrição.'}</em>
                        {pack.autorTipo === 'parceiro' && pack.autorEmpresaNome && <em>Parceiro: {pack.autorEmpresaNome}</em>}
                      </span>
                      {acquired ? (
                        isSupport && (
                          <button className="v3464-secondary-btn" disabled={busy} onClick={() => void handleRevoke(pack)}>
                            {busy ? 'Revogando...' : 'Revogar'}
                          </button>
                        )
                      ) : (
                        <button className="v3464-btn primary" disabled={busy} onClick={() => void handleAcquire(pack)}>
                          {busy ? 'Adquirindo...' : 'Adquirir'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 'solicitacoes' && isSupport && (
        <section className="v3464-card">
          {loadingSubmissions && <p className="v36-muted">Carregando submissões...</p>}
          {!loadingSubmissions && submissions.length === 0 && <p className="v36-muted">Nenhuma submissão de parceiro ainda.</p>}
          {!loadingSubmissions && submissions.length > 0 && (
            <table className="v3464-table">
              <thead>
                <tr><th>Empresa</th><th>App</th><th>Contato</th><th>Status</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td><strong>{submission.empresaNome}</strong><small>{submission.websiteUrl}</small></td>
                    <td>{submission.appNome}<small>{submission.appDescricao}</small></td>
                    <td>{submission.contatoNome}<small>{submission.contatoEmail}</small></td>
                    <td><Badge tone={submissionStatusTone[submission.status]}>{submissionStatusLabel[submission.status]}</Badge></td>
                    <td>
                      {submission.status === 'pendente' || submission.status === 'em_analise' ? (
                        <>
                          <button className="v3464-secondary-btn" onClick={() => void decideSubmission(submission, 'aprovado')}>Aprovar</button>{' '}
                          <button className="v3464-secondary-btn" onClick={() => void decideSubmission(submission, 'rejeitado')}>Rejeitar</button>
                        </>
                      ) : (
                        <span className="v36-muted">Decidido</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}

export default Marketplace;
