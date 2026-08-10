import StandardReportPage from './StandardReportPage';

export default function RelatorioIntegracoes() {
  return (
    <StandardReportPage
      title="Relatório de Integrações"
      description="Consulta de conexões, provedores, testes, falhas, chamadas e uso por canal ou agente."
      filename="relatorio-integracoes"
      typeOptions={["Todos os tipos", "OAuth", "API", "Webhook", "Canal", "Arquivo"]}
    />
  );
}
