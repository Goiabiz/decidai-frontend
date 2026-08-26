import { useEffect, useState } from 'react';
import StandardReportPage, { type StandardReportRow } from './StandardReportPage';
import { getReportDataset } from './reportAdapters';
import { useSession } from '../../contexts/SessionContext';

const dataset = getReportDataset('atendimentos')!;

export default function RelatorioAtendimentos() {
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
      title="Relatório de Atendimentos"
      description="Consulta de atendimentos por canal, status, prioridade e responsável."
      filename="relatorio-atendimentos"
      funcionalidade="relatorio_atendimentos"
      columns={dataset.columns}
      rows={rows}
      loading={loading}
      filters={dataset.filters}
      dateColumnKey={dataset.dateColumnKey}
    />
  );
}
