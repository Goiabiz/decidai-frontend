import { useEffect, useMemo, useState } from 'react';
import { Wallet } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/Badge';
import { ExportAction } from '../../components/ExportAction';
import { showAppToast } from '../../lib/appToast';
import { useSession, usePermission } from '../../contexts/SessionContext';
import { getCreditsBalance, listCreditsLedger, type CreditsLedgerEntry, type CreditsLedgerTipo } from '../../services/creditos';
import {
  closeBillingPeriod,
  createGatewayCharge,
  getPlanPricing,
  listInvoiceItems,
  listInvoices,
  markInvoicePaid,
  type BillingInvoice,
  type BillingInvoiceItem,
  type PlanPricing,
} from '../../services/billing';

const TIPO_LABELS: Record<CreditsLedgerTipo, string> = {
  debito_uso: 'Uso de IA',
  credito_recarga: 'Recarga',
  credito_plano: 'Crédito do plano',
  ajuste: 'Ajuste',
};

const TIPO_TONE: Record<CreditsLedgerTipo, string> = {
  debito_uso: 'red',
  credito_recarga: 'green',
  credito_plano: 'green',
  ajuste: 'gray',
};

function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 6 }).format(value);
}

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatBrl(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const INVOICE_STATUS_LABELS: Record<BillingInvoice['status'], string> = { open: 'Em aberto', paid: 'Paga', void: 'Cancelada' };
const INVOICE_STATUS_TONE: Record<BillingInvoice['status'], string> = { open: 'orange', paid: 'green', void: 'gray' };

// Dunning v1 (§35, migration 123) -- só informativo nesta v1, "suspenso" não bloqueia nada de
// verdade ainda (decisão separada, confirmada com o usuário em 23/08).
const DUNNING_STAGE_LABELS: Record<BillingInvoice['dunningStage'], string> = {
  none: '', vencido: 'Vencida', retry: 'Tentando cobrar', negociacao: 'Precisa de contato', suspenso: 'Atraso crítico',
};
const DUNNING_STAGE_TONE: Record<BillingInvoice['dunningStage'], string> = {
  none: 'gray', vencido: 'orange', retry: 'orange', negociacao: 'red', suspenso: 'red',
};

function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toIso(start), end: toIso(end) };
}

export function Creditos() {
  const { session } = useSession();
  const podeVer = usePermission('creditos.acessar.visualizar');
  const clienteId = session?.activeClientId ?? null;

  const podeEditarFaturas = usePermission('creditos.acessar.editar');

  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState<CreditsLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [plano, setPlano] = useState<PlanPricing | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<{ id: string; items: BillingInvoiceItem[] } | null>(null);
  const [fechando, setFechando] = useState(false);
  const [periodo, setPeriodo] = useState(currentMonthRange());
  const [cobrando, setCobrando] = useState<string | null>(null);
  const [pixAtivo, setPixAtivo] = useState<{ invoiceId: string; qrCode: string } | null>(null);

  const loadFaturamento = () => {
    if (!clienteId) return;
    Promise.all([getPlanPricing(clienteId), listInvoices(clienteId)])
      .then(([planoResult, invoicesResult]) => {
        setPlano(planoResult);
        setInvoices(invoicesResult);
      })
      .catch((error) => showAppToast(error instanceof Error ? error.message : 'Falha ao carregar faturamento.', 'warning'));
  };

  useEffect(() => {
    if (!podeVer || !clienteId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([getCreditsBalance(clienteId), listCreditsLedger(clienteId)])
      .then(([balanceResult, ledgerResult]) => {
        setBalance(balanceResult.balance);
        setLedger(ledgerResult.items);
      })
      .finally(() => setLoading(false));
    loadFaturamento();
  }, [podeVer, clienteId]);

  const openInvoice = async (invoiceId: string) => {
    try {
      const items = await listInvoiceItems(invoiceId);
      setSelectedInvoice({ id: invoiceId, items });
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Falha ao carregar itens da fatura.', 'warning');
    }
  };

  const handleCloseBillingPeriod = async () => {
    if (!clienteId) return;
    setFechando(true);
    try {
      const result = await closeBillingPeriod(clienteId, periodo.start, periodo.end);
      if ('error' in result) return showAppToast(result.error, 'warning');
      showAppToast('Fatura do período gerada.', 'success');
      loadFaturamento();
    } finally {
      setFechando(false);
    }
  };

  const handleMarkPaid = async (invoiceId: string) => {
    const result = await markInvoicePaid(invoiceId);
    if ('error' in result) return showAppToast(result.error, 'warning');
    showAppToast('Fatura marcada como paga.', 'success');
    loadFaturamento();
  };

  const handlePayNow = async (invoice: BillingInvoice) => {
    if (invoice.gatewayQrCode) {
      setPixAtivo({ invoiceId: invoice.id, qrCode: invoice.gatewayQrCode });
      return;
    }
    setCobrando(invoice.id);
    try {
      const result = await createGatewayCharge(invoice.id, clienteId);
      if ('error' in result) return showAppToast(result.error, 'warning');
      setPixAtivo({ invoiceId: invoice.id, qrCode: result.qrCode });
      loadFaturamento();
    } finally {
      setCobrando(null);
    }
  };

  const totals = useMemo(() => {
    const debitos = ledger.filter((item) => item.tipo === 'debito_uso').reduce((sum, item) => sum + item.valor, 0);
    const creditos = ledger.filter((item) => item.tipo !== 'debito_uso').reduce((sum, item) => sum + item.valor, 0);
    return { debitos, creditos };
  }, [ledger]);

  if (!podeVer) {
    return (
      <>
        <PageHeader title="Créditos e Consumo" />
        <section className="card audit-clean-card">
          <p className="muted">
            O saldo e o histórico de consumo de IA são visíveis apenas para administradores do ambiente.
            Fale com quem administra sua conta se precisar dessa informação.
          </p>
        </section>
      </>
    );
  }

  if (!clienteId) {
    return (
      <>
        <PageHeader title="Créditos e Consumo" />
        <section className="card audit-clean-card">
          <p className="muted">Acesse o contexto de um cliente para ver o saldo e o consumo dele.</p>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Créditos e Consumo"
        subtitle="Saldo de créditos e histórico de uso de IA deste ambiente."
        action={<ExportAction filename="creditos-consumo" title="Exportar histórico de créditos" />}
      />

      <section className="card audit-clean-card" style={{ marginBottom: 16 }}>
        <div className="section-title-row">
          <div className="v3464-admin-title" style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
            <span><Wallet size={22} /></span>
            <div>
              <h3 style={{ margin: 0 }}>Saldo atual</h3>
              <p className="section-description" style={{ margin: 0 }}>Atualizado a cada uso de IA registrado.</p>
            </div>
          </div>
          <strong style={{ fontSize: 28, color: balance < 0 ? 'var(--red-500)' : 'var(--green-700)' }}>
            {loading ? '...' : formatUsd(balance)}
          </strong>
        </div>
        {!loading && (
          <p className="section-description" style={{ marginTop: 8 }}>
            {formatUsd(totals.creditos)} em créditos lançados · {formatUsd(totals.debitos)} consumidos em uso de IA.
          </p>
        )}
      </section>

      <section className="card audit-clean-card" style={{ marginBottom: 16 }}>
        <div className="section-title-row">
          <div>
            <h3>Plano e faturamento</h3>
            <p className="section-description">
              {plano ? (
                <>
                  Plano <strong>{plano.name}</strong> — mensalidade {plano.monthlyPriceBrl !== null ? formatBrl(plano.monthlyPriceBrl) : 'não confirmada'}, franquia de uso de IA {formatUsd(plano.includedCreditsUsd)}, excedente {plano.overagePricePerUsdBrl !== null ? `${formatBrl(plano.overagePricePerUsdBrl)} por US$1 consumido além da franquia` : 'não confirmado'}.
                </>
              ) : (
                'Este ambiente não tem plano associado.'
              )}
            </p>
          </div>
          <Badge tone="blue">{invoices.length} fatura(s)</Badge>
        </div>

        {invoices.some((invoice) => invoice.dunningStage !== 'none') && (
          <p className="section-description" style={{ color: 'var(--red-600, #b91c1c)', marginBottom: 12 }}>
            Este ambiente tem fatura em atraso. {podeEditarFaturas ? 'Confira abaixo e gere uma cobrança Pix, se ainda não tiver uma.' : 'Fale com o administrador da sua conta.'}
          </p>
        )}

        {podeEditarFaturas && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 14, flexWrap: 'wrap' }}>
            <label style={{ fontSize: 12.5 }}>
              <span style={{ display: 'block', marginBottom: 4 }}>Início do período</span>
              <input type="date" value={periodo.start} onChange={(event) => setPeriodo((c) => ({ ...c, start: event.target.value }))} />
            </label>
            <label style={{ fontSize: 12.5 }}>
              <span style={{ display: 'block', marginBottom: 4 }}>Fim do período</span>
              <input type="date" value={periodo.end} onChange={(event) => setPeriodo((c) => ({ ...c, end: event.target.value }))} />
            </label>
            <button className="secondary-btn" onClick={handleCloseBillingPeriod} disabled={fechando}>
              {fechando ? 'Gerando...' : 'Fechar período e gerar fatura'}
            </button>
          </div>
        )}

        <div className="simple-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Período</th>
                <th>Vencimento</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="clickable-row" onClick={() => openInvoice(invoice.id)}>
                  <td>{formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}</td>
                  <td className="table-subtitle">{formatDate(invoice.dueDate)}</td>
                  <td>{formatBrl(invoice.totalAmountBrl)}</td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Badge tone={INVOICE_STATUS_TONE[invoice.status]}>{INVOICE_STATUS_LABELS[invoice.status]}</Badge>
                    {invoice.dunningStage !== 'none' && <Badge tone={DUNNING_STAGE_TONE[invoice.dunningStage]}>{DUNNING_STAGE_LABELS[invoice.dunningStage]}</Badge>}
                  </td>
                  <td onClick={(event) => event.stopPropagation()} style={{ display: 'flex', gap: 6 }}>
                    {invoice.status === 'open' && invoice.totalAmountBrl > 0 && (
                      <button className="secondary-btn" onClick={() => handlePayNow(invoice)} disabled={cobrando === invoice.id}>
                        {cobrando === invoice.id ? 'Gerando Pix...' : invoice.gatewayQrCode ? 'Ver Pix' : 'Pagar agora (Pix)'}
                      </button>
                    )}
                    {podeEditarFaturas && invoice.status === 'open' && (
                      <button className="secondary-btn" onClick={() => handleMarkPaid(invoice.id)}>Marcar como paga</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && <p className="empty-note">Nenhuma fatura gerada ainda para este ambiente.</p>}
        </div>

        {pixAtivo && (
          <div className="flow-run-detail">
            <h4>Pix copia-e-cola</h4>
            <p className="section-description" style={{ marginBottom: 8 }}>
              Cole este código no app do seu banco pra pagar. A confirmação atualiza esta tela automaticamente assim que o C6 Bank avisar (pode levar alguns instantes).
            </p>
            <textarea readOnly value={pixAtivo.qrCode} rows={4} style={{ width: '100%', fontFamily: 'var(--mono, monospace)', fontSize: 12 }} onClick={(event) => (event.target as HTMLTextAreaElement).select()} />
            <button className="secondary-btn" style={{ marginTop: 8 }} onClick={() => setPixAtivo(null)}>Fechar</button>
          </div>
        )}

        {selectedInvoice && (
          <div className="flow-run-detail">
            <h4>Itens da fatura</h4>
            {selectedInvoice.items.length === 0 && <p className="empty-note">Sem itens (fatura zerada).</p>}
            {selectedInvoice.items.map((item) => (
              <div key={item.id} className="flow-run-step-row">
                <span>{item.description}</span>
                <strong>{formatBrl(item.amountBrl)}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card audit-clean-card">
        <div className="section-title-row">
          <div>
            <h3>Histórico de transações</h3>
            <p className="section-description">Cada débito de uso é gerado automaticamente pelo sistema a partir de chamadas reais de IA — não é um valor estimado à mão.</p>
          </div>
          <Badge tone="blue">{loading ? '...' : `${ledger.length} registros`}</Badge>
        </div>

        <div className="simple-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Saldo após</th>
                <th>Descrição</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((item) => (
                <tr key={item.id}>
                  <td>{formatDateTime(item.data)}</td>
                  <td><Badge tone={TIPO_TONE[item.tipo]}>{TIPO_LABELS[item.tipo] || item.tipo}</Badge></td>
                  <td>{item.tipo === 'debito_uso' ? '-' : '+'}{formatUsd(item.valor)}</td>
                  <td>{formatUsd(item.saldoApos)}</td>
                  <td>{item.descricao}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && ledger.length === 0 && <p className="empty-note">Nenhuma transação de créditos registrada ainda para este ambiente.</p>}
        </div>
      </section>
    </>
  );
}

export default Creditos;
