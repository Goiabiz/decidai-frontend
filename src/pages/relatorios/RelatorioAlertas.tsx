import StandardReportPage from './StandardReportPage';

export default function RelatorioAlertas() {
  return (
    <StandardReportPage
      title="Relatório de Alertas"
      description="Consulta de alertas por período, origem, status, canal, responsável e criticidade."
      filename="relatorio-alertas"
      typeOptions={["Todos os tipos", "Comunicado", "Tratativa", "Pendência", "Conclusão"]}
    />
  );
}
