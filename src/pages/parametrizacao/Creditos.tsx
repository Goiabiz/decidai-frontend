import { useEffect, useMemo, useState } from 'react';
import { Wallet } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/Badge';
import { ExportAction } from '../../components/ExportAction';
import { useSession, usePermission } from '../../contexts/SessionContext';
import { getCreditsBalance, listCreditsLedger, type CreditsLedgerEntry, type CreditsLedgerTipo } from '../../services/creditos';

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

export function Creditos() {
  const { session } = useSession();
  const podeVer = usePermission('creditos.acessar.visualizar');
  const clienteId = session?.activeClientId ?? null;

  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState<CreditsLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!podeVer || !clienteId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([getCreditsBalance(clienteId), listCreditsLedger(clienteId)])
      .then(([balanceResult, ledgerResult]) => {
        setBalance(balanceResult.balance);
        setLedger(ledgerResult.items);
      })
      .finally(() => setLoading(false));
  }, [podeVer, clienteId]);

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
