import { useEffect, useState } from 'react';
import StandardReportPage, { type StandardReportRow } from './StandardReportPage';
import { getReportDataset } from './reportAdapters';
import { useSession } from '../../contexts/SessionContext';

const dataset = getReportDataset('integracoes')!;

export default function RelatorioIntegracoes() {
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
      title="Relatório de Integrações"
      description="Consulta de conectores e credenciais configurados pelo tenant."
      filename="relatorio-integracoes"
      funcionalidade="relatorio_integracoes"
      columns={dataset.columns}
      rows={rows}
      loading={loading}
      filters={dataset.filters}
      dateColumnKey={dataset.dateColumnKey}
    />
  );
}
