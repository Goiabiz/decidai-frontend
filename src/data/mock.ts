export const kpis = [
  { label: 'Documentos monitorados', value: '1.248', trend: '+12%', tone: 'green' },
  { label: 'Alertas críticos', value: '23', trend: '+15%', tone: 'red' },
  { label: 'Impactos identificados', value: '57', trend: '+8%', tone: 'blue' },
  { label: 'Ações pendentes', value: '31', trend: '+3%', tone: 'orange' },
  { label: 'Integrações ativas', value: '8', trend: 'sem alterações', tone: 'cyan' }
];

export const alertas = [
  { criticidade: 'Crítico', titulo: 'Atualização na tabela de tarifas impacta cálculo de faturamento', fonte: 'Nota Técnica 2024/118', data: '20/05/2024 08:42', modulo: 'Faturamento', funcionalidade: 'Cálculo de cobrança', status: 'Novo' },
  { criticidade: 'Alto', titulo: 'Novo layout de exportação a partir da competência 06/2024', fonte: 'Comunicado Regulatório 2.234/24', data: '20/05/2024 07:15', modulo: 'Exportações', funcionalidade: 'Importação', status: 'Em análise' },
  { criticidade: 'Médio', titulo: 'Alteração de regra de validação para cadastro inativo/ativo', fonte: 'Comunicado Operacional 43/2024', data: '19/05/2024 16:30', modulo: 'Cadastros', funcionalidade: 'Cadastro', status: 'Em andamento' },
  { criticidade: 'Baixo', titulo: 'Ajuste na descrição do campo Tipo de Unidade', fonte: 'Nota Informativa 12/2024', data: '19/05/2024 10:20', modulo: 'Cadastros', funcionalidade: 'Relatórios', status: 'Monitorando' }
];

export const documentos = [
  { titulo: 'Portaria Regulatória nº 3.222/2024', tipo: 'Portaria', fonte: 'Órgão Regulador', publicacao: '20/05/2024', status: 'Ativo', tags: ['Financiamento', 'Operação'] },
  { titulo: 'Nota Técnica nº 15/2024', tipo: 'Nota Técnica', fonte: 'Órgão Regulador', publicacao: '18/05/2024', status: 'Ativo', tags: ['Execução', 'Processos'] },
  { titulo: 'Relatório Anual de Gestão 2023', tipo: 'Relatório', fonte: 'Órgão Regulador', publicacao: '10/05/2024', status: 'Ativo', tags: ['Gestão', 'Planejamento'] },
  { titulo: 'Painel de Indicadores - 1º Trimestre', tipo: 'Planilha', fonte: 'Portal de Dados Abertos', publicacao: '07/05/2024', status: 'Ativo', tags: ['Indicadores', 'Monitoramento'] }
];
