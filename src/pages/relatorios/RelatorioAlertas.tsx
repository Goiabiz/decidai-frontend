import { useEffect, useState } from 'react';
import StandardReportPage, { type StandardReportRow } from './StandardReportPage';
import { getReportDataset } from './reportAdapters';
import { useSession } from '../../contexts/SessionContext';

const dataset = getReportDataset('alertas')!;

export default function RelatorioAlertas() {
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

  return (
    <StandardReportPage
      title="Relatório de Alertas"
      description="Consulta de alertas operacionais por status, prioridade e responsável."
      filename="relatorio-alertas"
      funcionalidade="relatorio_alertas"
      columns={dataset.columns}
      rows={rows}
      loading={loading}
      filters={dataset.filters}
    />
  );
}
