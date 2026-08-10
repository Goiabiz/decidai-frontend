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

export const impactos = [
  { modulo: 'Faturamento', funcionalidade: 'Geração de guia de cobrança', origem: 'Alerta crítico', criticidade: 'Crítico', cliente: 'Grupo Aurora Serviços', status: 'Em andamento' },
  { modulo: 'Integrações', funcionalidade: 'Validação de itens na autorização', origem: 'Impacto identificado', criticidade: 'Alto', cliente: 'Cooperativa Vértice', status: 'Em análise' },
  { modulo: 'Cadastros', funcionalidade: 'Sincronização de unidades', origem: 'Cliente', criticidade: 'Médio', cliente: 'Rede Horizonte', status: 'Monitorando' },
  { modulo: 'Atendimento', funcionalidade: 'Registro de atendimento', origem: 'Alerta crítico', criticidade: 'Crítico', cliente: 'Instituto Meridiano', status: 'Em andamento' }
];

export const documentos = [
  { titulo: 'Portaria Regulatória nº 3.222/2024', tipo: 'Portaria', fonte: 'Órgão Regulador', publicacao: '20/05/2024', status: 'Ativo', tags: ['Financiamento', 'Operação'] },
  { titulo: 'Nota Técnica nº 15/2024', tipo: 'Nota Técnica', fonte: 'Órgão Regulador', publicacao: '18/05/2024', status: 'Ativo', tags: ['Execução', 'Processos'] },
  { titulo: 'Relatório Anual de Gestão 2023', tipo: 'Relatório', fonte: 'Órgão Regulador', publicacao: '10/05/2024', status: 'Ativo', tags: ['Gestão', 'Planejamento'] },
  { titulo: 'Painel de Indicadores - 1º Trimestre', tipo: 'Planilha', fonte: 'Portal de Dados Abertos', publicacao: '07/05/2024', status: 'Ativo', tags: ['Indicadores', 'Monitoramento'] }
];

export const atendimentos = [
  { canal: 'WhatsApp', cliente: 'Grupo Aurora Serviços', assunto: 'Falha na integração', prioridade: 'Alta', responsavel: 'Bruno Oliveira', ultima: '20/05/2024 10:42', status: 'Aberto' },
  { canal: 'E-mail', cliente: 'Rede Horizonte - Filial Norte', assunto: 'Dúvida sobre relatório', prioridade: 'Média', responsavel: 'Juliana Costa', ultima: '20/05/2024 09:18', status: 'Em andamento' },
  { canal: 'Telefone', cliente: 'Cooperativa Vértice', assunto: 'Erro ao validar exportação', prioridade: 'Alta', responsavel: 'Rafael Mendes', ultima: '20/05/2024 08:33', status: 'Aberto' },
  { canal: 'Portal', cliente: 'Instituto Meridiano', assunto: 'Acesso ao sistema', prioridade: 'Baixa', responsavel: 'Camila Rocha', ultima: '20/05/2024 07:58', status: 'Respondido' }
];

export const acoes = [
  { origem: 'Alerta crítico', resumo: 'Aumento de alertas críticos', criticidade: 'Crítico', responsavel: 'Mariana Lima', prazo: '20/05/2024', status: 'Pendente' },
  { origem: 'Impacto identificado', resumo: 'Instabilidade no módulo de exportações', criticidade: 'Alta', responsavel: 'Carlos Mendes', prazo: '21/05/2024', status: 'Pendente' },
  { origem: 'Ação pendente', resumo: 'Atualização emergencial de versão', criticidade: 'Alta', responsavel: 'Juliana Rocha', prazo: '22/05/2024', status: 'Aguardando validação' }
];

export const clientes = [
  { cliente: 'Grupo Aurora Serviços', plano: 'Enterprise', ambiente: 'Produção', status: 'Ativo', integracoes: 6, atualizado: '20/05/2024 08:42' },
  { cliente: 'Rede Horizonte', plano: 'Enterprise', ambiente: 'Produção', status: 'Ativo', integracoes: 5, atualizado: '20/05/2024 08:15' },
  { cliente: 'Cooperativa Vértice', plano: 'Pro', ambiente: 'Produção', status: 'Ativo', integracoes: 3, atualizado: '20/05/2024 07:58' }
];
