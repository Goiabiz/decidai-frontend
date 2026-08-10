import StandardReportPage from './StandardReportPage';

export default function RelatorioAuditoria() {
  return (
    <StandardReportPage
      title="Auditoria"
      description="Consulta de acessos, alterações, integrações, exportações e execuções de agentes."
      filename="auditoria"
      typeOptions={["Todos os tipos", "Acesso", "Cadastro", "Integração", "Exportação", "Agente"]}
    />
  );
}
