import { useEffect, useMemo, useState } from 'react';
import { Wallet, FileDown } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/Badge';
import { ExportAction, type ExportFormat } from '../../components/ExportAction';
import { showAppToast } from '../../lib/appToast';
import { useSession, usePermission } from '../../contexts/SessionContext';
import {
  getCreditGate,
  getCreditsBalance,
  listCreditTopups,
  listCreditsLedger,
  requestCreditTopup,
  type CreditGate,
  type CreditTopup,
  type CreditsLedgerEntry,
  type CreditsLedgerTipo,
} from '../../services/creditos';
import { exportReportRows, exportInvoicePdf } from '../../lib/reportExport';
import { formatDate, formatDateTime } from '../../lib/formatDate';
import { formatCurrencyBrl as formatBrl } from '../../lib/formatCurrency';
import {
  closeBillingPeriod,
  createGatewayCharge,
  getActivePriceOverride,
  getPlanPricing,
  listInvoiceItems,
  listInvoices,
  markInvoicePaid,
  runDunningNow,
  type BillingInvoice,
  type BillingInvoiceItem,
  type PriceOverride,
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
  const [desconto, setDesconto] = useState<PriceOverride | null>(null);
  const [pixAtivo, setPixAtivo] = useState<{ invoiceId: string; qrCode: string } | null>(null);
  const [baixandoPdf, setBaixandoPdf] = useState<string | null>(null);
  const [executandoDunning, setExecutandoDunning] = useState<string | null>(null);

  // Limite rígido de crédito (30/08/2026).
  //
  // Permissão de RECARGA é `creditos.plano.alterar`, não `creditos.acessar.editar`. As duas
  // existem e são coisas diferentes: `acessar.editar` é de operador (fechar período, dar baixa
  // em fatura -- só admin_operadora/suporte), enquanto recarregar o próprio saldo é ação do
  // cliente sobre a própria assinatura, mesma classe de trocar de plano -- e `plano.alterar` já
  // inclui admin_cliente. Achei isso testando: a seção não aparecia pra conta de tenant real.
  const podeRecarregar = usePermission('creditos.plano.alterar');
  const [gate, setGate] = useState<CreditGate | null>(null);
  const [topups, setTopups] = useState<CreditTopup[]>([]);
  const [recarregando, setRecarregando] = useState(false);

  const loadCredito = () => {
    if (!clienteId) return;
    getCreditGate(clienteId).then(setGate);
    listCreditTopups(clienteId).then(setTopups);
  };

  const pedirRecarga = async (valorUsd: number) => {
    if (!clienteId) return;
    setRecarregando(true);
    try {
      const r = await requestCreditTopup(clienteId, valorUsd);
      if (!r.ok) { showAppToast(r.error || 'Não foi possível registrar o pedido de recarga.', 'error'); return; }
      showAppToast(`Pedido de recarga de US$ ${valorUsd} registrado. O crédito entra assim que o pagamento for confirmado.`, 'success');
      loadCredito();
    } finally {
      setRecarregando(false);
    }
  };

  const loadFaturamento = () => {
    if (!clienteId) return;
    Promise.all([getPlanPricing(clienteId), listInvoices(clienteId), getActivePriceOverride(clienteId)])
      .then(([planoResult, invoicesResult, overrideResult]) => {
        setPlano(planoResult);
        setInvoices(invoicesResult);
        setDesconto(overrideResult);
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
    loadCredito();
  }, [podeVer, clienteId]);

  const openInvoice = async (invoiceId: string) => {
    try {
      const items = await listInvoiceItems(invoiceId);
      setSelectedInvoice({ id: invoiceId, items });
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Falha ao carregar itens da fatura.', 'warning');
    }
  };

  const handleDownloadInvoicePdf = async (invoice: BillingInvoice, items: BillingInvoiceItem[]) => {
    setBaixandoPdf(invoice.id);
    try {
      await exportInvoicePdf({
        id: invoice.id,
        clientName: plano?.clientName || 'Cliente',
        planCode: invoice.planCode,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
        dueDate: invoice.dueDate,
        statusLabel: INVOICE_STATUS_LABELS[invoice.status],
        paidAtLabel: invoice.paidAt ? formatDate(invoice.paidAt.slice(0, 10)) : null,
        items: items.map((item) => ({ description: item.description, amountBrl: item.amountBrl })),
        totalAmountBrl: invoice.totalAmountBrl,
        gatewayQrCode: invoice.status === 'open' ? invoice.gatewayQrCode : null,
      });
    } catch (error) {
      showAppToast(error instanceof Error ? error.message : 'Não foi possível gerar o PDF da fatura.', 'warning');
    } finally {
      setBaixandoPdf(null);
    }
  };

  const handleExportLedger = async (format: ExportFormat) => {
    await exportReportRows({
      format,
      filename: 'creditos-consumo',
      title: 'Histórico de transações — Créditos e Consumo',
      columns: [
        { key: 'data', label: 'Data' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'valor', label: 'Valor (USD)' },
        { key: 'saldoApos', label: 'Saldo após (USD)' },
        { key: 'descricao', label: 'Descrição' },
      ],
      rows: ledger.map((item) => ({
        data: formatDateTime(item.data),
        tipo: TIPO_LABELS[item.tipo] || item.tipo,
        valor: item.valor,
        saldoApos: item.saldoApos,
        descricao: item.descricao,
      })),
    });
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

  const handleRunDunning = async (invoiceId: string) => {
    setExecutandoDunning(invoiceId);
    try {
      const result = await runDunningNow(invoiceId, clienteId);
      if ('error' in result) return showAppToast(result.error, 'warning');
      showAppToast(result.message, 'success');
      loadFaturamento();
    } finally {
      setExecutandoDunning(null);
    }
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
        action={<ExportAction filename="creditos-consumo" title="Exportar histórico de créditos" onExport={handleExportLedger} />}
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

        {/* Limite rígido de crédito (30/08/2026) -- o mesmo gate que o runtime consulta antes de
            executar IA. Sem este bloco, o usuário veria o saldo em zero sem entender que a IA
            parou por causa disso. */}
        {!loading && gate && !gate.isento && (
          <div
            style={{
              marginTop: 14,
              padding: '12px 16px',
              borderRadius: 10,
              borderLeft: `3px solid ${gate.permitido ? 'var(--green-700)' : 'var(--red-500)'}`,
              background: 'var(--slate-50, #f8fafc)',
            }}
          >
            {gate.permitido ? (
              <span className="section-description">
                A IA está <strong>ativa</strong> para este ambiente. Quando o saldo chegar a zero, os recursos de
                inteligência artificial são bloqueados automaticamente — o saldo nunca fica negativo.
              </span>
            ) : (
              <>
                <strong style={{ color: 'var(--red-500)' }}>IA bloqueada: os créditos acabaram.</strong>{' '}
                <span className="section-description">
                  Nenhuma chamada de IA é executada até haver saldo. Recarregue abaixo para voltar a usar.
                  Nada é cobrado a mais por uso além do saldo, porque o uso além do saldo não acontece.
                </span>
              </>
            )}
          </div>
        )}

        {!loading && gate?.isento && (
          <p className="section-description" style={{ marginTop: 14 }}>
            Este ambiente é <strong>isento</strong> do limite de créditos (plano {gate.planoCode ?? 'enterprise'}):
            o uso de IA é faturado por contrato, não descontado de saldo pré-pago.
          </p>
        )}
      </section>

      {/* Recarga -- pedido real gravado em credit_topups. O crédito só entra no saldo quando o
          gateway confirmar o pagamento (fn_confirm_credit_topup, servidor). */}
      {!loading && gate && !gate.isento && podeRecarregar && (
        <section className="card audit-clean-card" style={{ marginBottom: 16 }}>
          <div className="section-title-row">
            <div>
              <h3>Recarregar créditos</h3>
              <p className="section-description">
                O pedido fica pendente até o pagamento ser confirmado. O crédito entra no saldo automaticamente
                nesse momento.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
            {[5, 10, 25, 50].map((valor) => (
              <button
                key={valor}
                className="v3464-btn secondary"
                disabled={recarregando}
                onClick={() => void pedirRecarga(valor)}
              >
                US$ {valor}
              </button>
            ))}
            {recarregando && <span className="section-description">Registrando pedido...</span>}
          </div>

          <p className="section-description" style={{ marginTop: 10, fontSize: 12 }}>
            O valor em reais aparece quando o meio de pagamento estiver conectado — o preço de venda do crédito
            ainda não foi definido.
          </p>

          {topups.length > 0 && (
            <table className="v3464-table" style={{ marginTop: 14 }}>
              <thead>
                <tr><th>Pedido</th><th>Valor</th><th>Situação</th><th>Meio</th></tr>
              </thead>
              <tbody>
                {topups.map((t) => (
                  <tr key={t.id}>
                    <td>{formatDateTime(t.criadoEm)}</td>
                    <td>{formatUsd(t.valorUsd)}</td>
                    <td>
                      <Badge tone={t.status === 'pago' ? 'green' : t.status === 'pendente' ? 'orange' : 'gray'}>
                        {t.status === 'pago' ? 'Pago' : t.status === 'pendente' ? 'Aguardando pagamento' : 'Cancelado'}
                      </Badge>
                    </td>
                    <td>{t.gateway ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      <section className="card audit-clean-card" style={{ marginBottom: 16 }}>
        <div className="section-title-row">
          <div>
            <h3>Plano e faturamento</h3>
            <p className="section-description">
              {plano ? (
                <>
                  Plano <strong>{plano.name}</strong> — mensalidade {plano.monthlyPriceBrl !== null ? formatBrl(plano.monthlyPriceBrl) : 'não confirmada'}, franquia de uso de IA {formatUsd(plano.includedCreditsUsd)} por mês. Ao acabar a franquia, o uso é bloqueado até você recarregar — não há cobrança de excedente.
                </>
              ) : (
                'Este ambiente não tem plano associado.'
              )}
            </p>
          </div>
          <Badge tone="blue">{invoices.length} fatura(s)</Badge>
        </div>

        {desconto && (
          <p className="section-description" style={{ color: 'var(--green-700, #15803d)', marginBottom: 12 }}>
            {desconto.motivo === 'founders' ? (
              <>
                <strong>Preço founders ativo</strong>
                {desconto.foundersSeq !== null && <> — você é o assinante nº {desconto.foundersSeq} do programa</>}:
                {' '}{desconto.descontoPercentual}% de desconto na mensalidade até {formatDate(desconto.vigenciaFim)}.
                Depois dessa data, o plano volta ao preço cheio automaticamente.
              </>
            ) : (
              <>
                <strong>Desconto ativo</strong>: {desconto.descontoPercentual}% na mensalidade até {formatDate(desconto.vigenciaFim)}.
              </>
            )}
            {' '}A fatura do período em que o desconto terminar já vem dividida — os dias com desconto e os dias
            no preço cheio aparecem como itens separados.
          </p>
        )}

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
                    {podeEditarFaturas && invoice.status === 'open' && invoice.dueDate < new Date().toISOString().slice(0, 10) && (
                      <button
                        className="secondary-btn"
                        title="Roda agora a mesma régua de inadimplência que o job agendado usaria"
                        disabled={executandoDunning === invoice.id}
                        onClick={() => handleRunDunning(invoice.id)}
                      >
                        {executandoDunning === invoice.id ? 'Executando...' : 'Executar cobrança agora'}
                      </button>
                    )}
                    <button
                      className="secondary-btn"
                      title="Baixar PDF da fatura"
                      disabled={baixandoPdf === invoice.id}
                      onClick={async () => {
                        const items = selectedInvoice?.id === invoice.id ? selectedInvoice.items : await listInvoiceItems(invoice.id);
                        await handleDownloadInvoicePdf(invoice, items);
                      }}
                    >
                      <FileDown size={15} />
                    </button>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4>Itens da fatura</h4>
              <button
                className="secondary-btn"
                disabled={baixandoPdf === selectedInvoice.id}
                onClick={() => {
                  const invoice = invoices.find((item) => item.id === selectedInvoice.id);
                  if (invoice) void handleDownloadInvoicePdf(invoice, selectedInvoice.items);
                }}
              >
                <FileDown size={15} /> {baixandoPdf === selectedInvoice.id ? 'Gerando...' : 'Baixar PDF'}
              </button>
            </div>
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
