import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Handshake, LayoutGrid, ListChecks } from 'lucide-react';
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

export function Marketplace() {
  const { isSupport } = useSession();
  const [tab, setTab] = useState<'vitrine' | 'solicitacoes'>('vitrine');
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<PartnerSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  useEffect(() => {
    setLoading(true);
    listMarketplaceCatalog().then((result) => setItems(result.items)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== 'solicitacoes' || !isSupport) return;
    setLoadingSubmissions(true);
    listPartnerSubmissions().then((result) => setSubmissions(result.items)).finally(() => setLoadingSubmissions(false));
  }, [tab, isSupport]);

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
