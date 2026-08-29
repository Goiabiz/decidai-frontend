import { useEffect, useState } from 'react';
import StandardReportPage, { type StandardReportRow } from './StandardReportPage';
import { getReportDataset } from './reportAdapters';
import { useSession } from '../../contexts/SessionContext';

const dataset = getReportDataset('work-items')!;

export default function RelatorioTrabalho() {
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
      title="Trabalho (Work Item Universal)"
      description="Tarefa, atendimento, alerta e decisão numa régua única (§9 do Plano Mestre v4) -- mesmo item, uma visão só, sem trocar de tela pra saber o que está pendente."
      filename="relatorio-work-item-universal"
      funcionalidade="relatorio_work_item_universal"
      columns={dataset.columns}
      rows={rows}
      loading={loading}
      filters={dataset.filters}
      dateColumnKey={dataset.dateColumnKey}
    />
  );
}
