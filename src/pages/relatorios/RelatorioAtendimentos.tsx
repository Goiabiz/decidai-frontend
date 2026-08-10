import StandardReportPage from './StandardReportPage';

export default function RelatorioAtendimentos() {
  return (
    <StandardReportPage
      title="Relatório de Atendimentos"
      description="Consulta consolidada de demandas por canal, cliente, fila, status, SLA e responsável."
      filename="relatorio-atendimentos"
      typeOptions={["Todos os tipos", "WhatsApp", "E-mail", "Widget", "Formulário", "API"]}
    />
  );
}
