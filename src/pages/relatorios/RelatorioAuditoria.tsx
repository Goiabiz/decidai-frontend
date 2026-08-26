import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import StandardReportPage, { type StandardReportRow } from './StandardReportPage';
import { getReportDataset } from './reportAdapters';
import { useSession } from '../../contexts/SessionContext';

const dataset = getReportDataset('auditoria')!;

export default function RelatorioAuditoria() {
  const { session, isSupport } = useSession();
  const clienteId = session?.activeClientId ?? null;
  const [rows, setRows] = useState<StandardReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    dataset.load({ clienteId, isSupport }).then((result) => {
      if (active) { setRows(result.rows); setLoading(false); }
    });
    return () => { active = false; };
  }, [clienteId, isSupport]);

  if (!isSupport) {
    return (
      <>
        <PageHeader title="Relatório de Auditoria" />
        <section className="card audit-clean-card">
          <p className="muted">
            A trilha de auditoria completa é visível apenas para a equipe de suporte da plataforma. Ações do seu
            ambiente continuam sendo registradas normalmente — fale com o suporte se precisar consultar um evento específico.
          </p>
        </section>
      </>
    );
  }

  return (
    <StandardReportPage
      title="Relatório de Auditoria"
      description="Consulta de acessos, alterações, integrações, exportações e execuções de agentes."
      filename="relatorio-auditoria"
      funcionalidade="relatorio_auditoria"
      columns={dataset.columns}
      rows={rows}
      loading={loading}
      filters={dataset.filters}
      dateColumnKey={dataset.dateColumnKey}
    />
  );
}
