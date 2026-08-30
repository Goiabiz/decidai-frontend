import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Gavel, Search, XCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '../components/Badge';
import { showAppToast } from '../lib/appToast';
import { formatDate } from '../lib/formatDate';
import { useSession } from '../contexts/SessionContext';
import {
  decisionStatusLabels,
  decisionStatusList,
  listDecisions,
  reviewDecision,
  type Decision,
  type DecisionStatus,
} from '../services/decisions';

const CONFIANCA_TONE: Record<string, string> = { alta: 'status-concluido', media: 'status-andamento', baixa: 'status-cancelado' };
const CONFIANCA_LABEL: Record<string, string> = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };

function asStringList(value: unknown[]): string[] {
  return value.map((item) => (typeof item === 'string' ? item : JSON.stringify(item)));
}

export function Decisoes() {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;
  const queryClient = useQueryClient();

  const decisionsQuery = useQuery({
    queryKey: ['decisions', clienteId],
    queryFn: () => listDecisions(clienteId as string),
    enabled: !!clienteId,
  });
  const items = decisionsQuery.data ?? [];
  const loading = decisionsQuery.isLoading;

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Decision | null>(null);
  const [reviewForm, setReviewForm] = useState<{ status: DecisionStatus; decisaoTomada: string; justificativa: string; resultadoObservado: string }>({
    status: 'draft',
    decisaoTomada: '',
    justificativa: '',
    resultadoObservado: '',
  });

  const reviewMutation = useMutation({
    mutationFn: (input: { id: string; status: DecisionStatus; decisaoTomada?: string; justificativa?: string; resultadoObservado?: string }) =>
      reviewDecision(input.id, {
        status: input.status,
        decisaoTomada: input.decisaoTomada,
        justificativa: input.justificativa,
        resultadoObservado: input.resultadoObservado,
      }),
    onSuccess: (result) => {
      if (!result.ok || !result.decision) {
        showAppToast(result.error || 'Não foi possível salvar a revisão.', 'error');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['decisions', clienteId] });
      showAppToast('Revisão salva.', 'success');
      closeReview();
    },
  });

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => [item.problema, item.recomendacao ?? '', item.origem_regra_codigo ?? ''].join(' ').toLowerCase().includes(normalized));
  }, [items, query]);

  const kpis: Array<[string, number, typeof Gavel, string]> = [
    ['Não revisadas', items.filter((d) => d.status === 'draft').length, AlertTriangle, '#ff8b22'],
    ['Em andamento', items.filter((d) => d.status === 'em_analise' || d.status === 'decidida' || d.status === 'em_execucao').length, Clock, '#00a6d6'],
    ['Concluídas', items.filter((d) => d.status === 'concluida').length, CheckCircle2, '#00875a'],
    ['Descartadas', items.filter((d) => d.status === 'descartada').length, XCircle, '#7c8880'],
  ];

  const openReview = (decision: Decision) => {
    setSelected(decision);
    setReviewForm({
      status: decision.status === 'draft' ? 'em_analise' : decision.status,
      decisaoTomada: decision.decisao_tomada || '',
      justificativa: decision.justificativa || '',
      resultadoObservado: decision.resultado_observado || '',
    });
  };

  const closeReview = () => setSelected(null);

  const salvarRevisao = () => {
    if (!selected) return;
    reviewMutation.mutate({
      id: selected.id,
      status: reviewForm.status,
      decisaoTomada: reviewForm.decisaoTomada.trim() || undefined,
      justificativa: reviewForm.justificativa.trim() || undefined,
      resultadoObservado: reviewForm.resultadoObservado.trim() || undefined,
    });
  };

  if (!clienteId) {
    return (
      <div className="v3464-page">
        <div className="v3464-page-head"><h1>Decisões</h1></div>
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>Acesse o contexto de um cliente para ver as decisões dele.</div>
      </div>
    );
  }

  return (
    <div className="v3464-page">
      <div className="v3464-page-head">
        <h1>Decisões</h1>
      </div>
      <p style={{ color: 'var(--slate-500)', marginTop: -8, marginBottom: 20 }}>
        Objeto Decision (§8 do Plano Mestre v4) -- geradas automaticamente por Detection/Diagnosis (regra real disparada
        contra dado do tenant, recomendação por IA). Cabe a um humano revisar: registrar o que de fato foi decidido,
        por quê, e o que aconteceu depois.
      </p>

      <div className="v3464-kpis">
        {kpis.map(([title, value, Icon, color]) => (
          <div className="v3464-kpi" key={title}>
            <span className="v3464-kpi-icon" style={{ background: color }}><Icon size={22} /></span>
            <div><strong>{title}</strong><h2>{value}</h2></div>
          </div>
        ))}
      </div>

      <section className="v3464-card">
        <div className="v3464-search">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por problema, recomendação ou regra de origem..." />
        </div>
        <h2>Decisões</h2>

        {loading ? (
          <p style={{ color: 'var(--slate-500)' }}>Carregando...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--slate-500)' }}>Nenhuma decisão registrada ainda para este cliente.</p>
        ) : (
          <table className="v3464-table">
            <thead>
              <tr><th>Problema</th><th>Confiança</th><th>Status</th><th>Origem</th><th>Criado em</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.problema}</strong></td>
                  <td>{item.confianca ? <Badge tone={CONFIANCA_TONE[item.confianca]}>{CONFIANCA_LABEL[item.confianca]}</Badge> : '-'}</td>
                  <td>{decisionStatusLabels[item.status]}</td>
                  <td>{item.origem_regra_codigo || '-'}</td>
                  <td>{formatDate(item.criado_em)}</td>
                  <td>
                    <button className="v3464-btn secondary" onClick={() => openReview(item)}>
                      {item.status === 'draft' ? 'Revisar' : 'Ver / editar revisão'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {selected && (
        <div className="v3464-modal-backdrop">
          <section className="v3464-system-modal" style={{ maxWidth: 640 }}>
            <button className="v3464-modal-x" onClick={closeReview}>×</button>
            <h2>{selected.problema}</h2>

            <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
              {selected.contexto && <p><strong>Contexto:</strong> {selected.contexto}</p>}
              {selected.recomendacao && <p><strong>Recomendação (IA):</strong> {selected.recomendacao}</p>}
              {selected.riscos && <p><strong>Riscos:</strong> {selected.riscos}</p>}
              {selected.impacto_esperado && <p><strong>Impacto esperado:</strong> {selected.impacto_esperado}</p>}
              {selected.evidencias.length > 0 && (
                <p><strong>Evidências:</strong> {asStringList(selected.evidencias).join(' · ')}</p>
              )}
              {selected.alternativas.length > 0 && (
                <p><strong>Alternativas consideradas:</strong> {asStringList(selected.alternativas).join(' · ')}</p>
              )}
            </div>

            <div className="v3464-modal-form">
              <label>Status
                <select value={reviewForm.status} onChange={(event) => setReviewForm((current) => ({ ...current, status: event.target.value as DecisionStatus }))}>
                  {decisionStatusList.map((status) => <option key={status} value={status}>{decisionStatusLabels[status]}</option>)}
                </select>
              </label>
              <label>Decisão tomada
                <textarea value={reviewForm.decisaoTomada} onChange={(event) => setReviewForm((current) => ({ ...current, decisaoTomada: event.target.value }))} placeholder="O que foi decidido de fato?" />
              </label>
              <label>Justificativa
                <textarea value={reviewForm.justificativa} onChange={(event) => setReviewForm((current) => ({ ...current, justificativa: event.target.value }))} placeholder="Por quê?" />
              </label>
              <label>Resultado observado
                <textarea value={reviewForm.resultadoObservado} onChange={(event) => setReviewForm((current) => ({ ...current, resultadoObservado: event.target.value }))} placeholder="O que aconteceu depois (preencher quando souber)" />
              </label>
            </div>

            <footer>
              <button className="v3464-secondary-btn" onClick={closeReview}>Cancelar</button>
              <button className="v3464-primary-btn" onClick={salvarRevisao} disabled={reviewMutation.isPending}>{reviewMutation.isPending ? 'Salvando...' : 'Salvar revisão'}</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

export default Decisoes;
