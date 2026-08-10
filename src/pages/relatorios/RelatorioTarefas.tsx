import StandardReportPage from './StandardReportPage';

export default function RelatorioTarefas() {
  return (
    <StandardReportPage
      title="Relatório de Tarefas"
      description="Consulta de tarefas por origem, responsável, status, prioridade, prazo e vínculo operacional."
      filename="relatorio-tarefas"
      typeOptions={["Todos os tipos", "Manual", "Atendimento", "Alerta", "Integração", "Agente"]}
    />
  );
}
