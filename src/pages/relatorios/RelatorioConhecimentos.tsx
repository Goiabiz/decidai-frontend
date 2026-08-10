import StandardReportPage from './StandardReportPage';

export default function RelatorioConhecimentos() {
  return (
    <StandardReportPage
      title="Relatório de Conhecimentos"
      description="Consulta de conteúdos, origens, vínculos, atualização e uso pelos agentes."
      filename="relatorio-conhecimentos"
      typeOptions={["Todos os tipos", "Documento", "Página", "Arquivo", "Link", "Base externa"]}
    />
  );
}
