import type { PageKey } from '../App';

export type HelpEntry = {
  /** Título mostrado no painel — se omitido, usa o rótulo do item de menu. */
  title?: string;
  summary: string;
  tips: string[];
};

// Conteúdo do painel de ajuda ("?" na topbar) por tela. `Record<PageKey, ...>` é
// exaustivo de propósito: ao adicionar uma PageKey nova em App.tsx, o TypeScript
// obriga a preencher a entrada aqui também — é assim que o padrão "toda tela nova
// já tem ajuda" se sustenta sem depender de alguém lembrar de fazer isso à parte.
export const helpContent: Record<PageKey, HelpEntry> = {
  dashboard: {
    summary: 'Panorama geral do ambiente: atendimentos, alertas e tarefas em aberto num só lugar.',
    tips: [
      'Os cartões de KPI refletem o cliente ativo no momento — troque de cliente pelo seletor de suporte na topbar para ver outro ambiente.',
      'Clique em qualquer item de lista para abrir os detalhes no painel lateral direito.',
    ],
  },
  'minha-conta': {
    summary: 'Seu perfil, plano contratado, consumo do período e segurança da própria conta.',
    tips: [
      'A ativação de 2FA aqui é real: gera um QR code de verdade via Supabase Auth, não é só um botão decorativo.',
      'O consumo mostrado (usuários, agentes, canais, tokens) é limitado pelo plano — para aumentar, é preciso upgrade de plano, não uma configuração nesta tela.',
    ],
  },
  'cad-usuarios': {
    summary: 'Cadastro dos usuários que acessam o sistema (equipe do cliente), convites e perfis de acesso.',
    tips: [
      '"Reenviar convite" só aparece enquanto o convite está pendente — some sozinho assim que o usuário aceita.',
      'Excluir um usuário é reversível por trás dos panos (soft delete + log de auditoria) — mas não existe tela de "lixeira" ainda para desfazer pela UI.',
      'Importar por CSV exige colunas de nome e e-mail; os demais campos são opcionais.',
    ],
  },
  'cad-unidades': {
    summary: 'Unidades e centros de custo do cliente (matriz, filiais, prestadores, fornecedores) usados para segmentar dados.',
    tips: [
      'O tipo da unidade (Matriz/Filial/Prestador/Fornecedor/Cliente) organiza a hierarquia — escolha o mais específico possível.',
      'Endereço é opcional na criação rápida, mas vale preencher se a unidade aparecer em relatórios geográficos.',
    ],
  },
  'cad-campos': {
    summary: 'Campos de contexto reutilizáveis em formulários e telas do produto — o "dicionário de dados" do cliente.',
    tips: [
      'Um campo criado aqui fica disponível para ser arrastado dentro do construtor de Telas.',
      'Excluir um campo em uso pode quebrar uma tela que dependa dele — confira onde está sendo usado antes.',
    ],
  },
  'cad-formularios': {
    summary: 'Construtor de telas por abas/seções com arraste-e-solte — monta a estrutura visual de um formulário.',
    tips: [
      'Arraste um campo já cadastrado em "Campos" para dentro de uma seção para adicioná-lo à tela.',
      'A largura de cada coluna é ajustável arrastando a borda do campo dentro da seção.',
      'Hoje isto monta a definição da tela; a renderização de uma tela real a partir dela ainda não existe — é um construtor visual, ainda sem um "publicar".',
    ],
  },
  base: {
    summary: 'Base de Conhecimento: artigos, procedimentos e materiais que agentes e atendentes podem consultar.',
    tips: [
      'Marcar um artigo como "autorizado para agente" permite que a IA o use como fonte ao responder — sem isso, o agente não enxerga o conteúdo.',
      'Exclusão é soft delete com log de auditoria — o conteúdo some da lista, mas não é apagado do banco.',
    ],
  },
  atendimento: {
    summary: 'Conversa com o solicitante: fila à esquerda, thread de mensagens à direita, com distinção entre resposta pública e nota interna.',
    tips: [
      '"Nota interna" nunca é vista pelo solicitante — use para deixar contexto para outro atendente.',
      'A aba "Atividade" junta mensagens e mudanças de status numa linha do tempo única.',
      'Trocar o status do atendimento aqui já grava uma mensagem de sistema real na conversa, não é só cosmético.',
    ],
  },
  'atendimento-fila': {
    summary: 'Visão gerencial de todos os chamados em colunas: status, quem abriu, quem está atendendo, e tempo em aberto por SLA.',
    tips: [
      'O tempo em aberto é calculado ao vivo (atualiza sozinho) e não pausa — cruze com a régua de SLA definida em Serviços.',
      'Clique num chamado para ir direto para a conversa em Atendimentos.',
    ],
  },
  alertas: {
    summary: 'Avisos operacionais disparados para um ou mais canais configurados, com prioridade e duração de exibição.',
    tips: [
      '"Enviado para" é uma contagem real de canais registrados no disparo — ainda não existe confirmação de leitura, então não há métrica de "visto".',
      'A lista de canais de disparo no cadastro reflete os canais já configurados em Parametrização → Canais.',
    ],
  },
  'atendimento-servicos': {
    summary: 'Governança de Serviços, Filas, Grupos de filas, Fluxos (editor em canvas) e SLA — a espinha dorsal do atendimento.',
    tips: [
      'Uma Fila sempre pertence a um Serviço — cadastre o Serviço primeiro.',
      'O editor de Fluxo é um canvas arrastável: clique para criar um status, arraste entre eles para desenhar uma transição.',
      'SLA é definido por Serviço + Prioridade — cada combinação só pode ter uma régua ativa.',
      'Grupo de filas permite transferência de atendimento entre as filas do mesmo grupo.',
    ],
  },
  flows: {
    summary: 'Motor de automação: sequências de passos que o agente segue, com disparo manual ou agendado (cron).',
    tips: [
      'Passo "Instrução" faz o agente responder/decidir de verdade — passo "Ação" tem efeito real e sempre para esperando confirmação humana, qualquer que seja o risco.',
      'Os passos rodam sempre em ordem, de cima para baixo — use as setas em cada passo do canvas para reordenar, não é possível ramificar ainda.',
      'Uma execução parada em "Aguardando confirmação" só continua depois que alguém clica em "Confirmar ação" na lista de execuções do flow.',
      'Disparo agendado roda sozinho, no intervalo definido pela expressão cron — o disparo manual só roda quando alguém clica em "Rodar agora".',
    ],
  },
  'market-reputacao': {
    summary: 'Sinais de reputação (avaliações, NPS, CSAT) agregados de fontes externas -- v1 cobre só Google Business Profile, leitura-só.',
    tips: [
      'Cadastre o identificador do local (formato "accounts/.../locations/...") em "Nova fonte" antes de sincronizar.',
      '"Sincronizar agora" busca avaliações reais direto do Google -- não escreve nem responde nada em nome do tenant.',
      'Desativar uma fonte para de sincronizá-la, mas não apaga o histórico de avaliações já coletadas.',
    ],
  },
  'crm-contatos': {
    summary: 'Contatos e empresas do CRM, com o perfil 360: casos do pipeline e atendimentos de cada contato num só lugar.',
    tips: [
      'Vincular um contato a uma empresa é opcional — útil quando várias pessoas da mesma organização aparecem em casos diferentes.',
      'O perfil 360 (painel à direita) só mostra atendimentos que já têm o contato vinculado — atendimentos antigos, criados antes deste vínculo existir, não aparecem sozinhos.',
      'A aba "Empresas" é um cadastro simples — o vínculo de fato acontece ao escolher a empresa no formulário de um contato.',
    ],
  },
  'crm-pipeline': {
    summary: 'Casos em andamento, organizados por estágio configurável — arraste um card para mudar de estágio.',
    tips: [
      'Mover um card para um estágio marcado como "Ganho" ou "Perdido" fecha o caso automaticamente — mover de volta para um estágio intermediário reabre.',
      'Os estágios padrão (Novo, Qualificando, Proposta, Ganho, Perdido) são criados sozinhos na primeira vez que o ambiente usa o Pipeline.',
      'Um caso sempre pertence a um contato — cadastre o contato em "Contatos" antes de criar o caso, se ainda não existir.',
    ],
  },
  analise: {
    summary: 'Lista de tarefas com status, prioridade, responsável e prazo — o "a fazer" operacional do cliente.',
    tips: [
      'Clique no badge de status de uma tarefa para trocar rapidamente sem abrir um formulário.',
      'Excluir pede confirmação e é soft delete com log de auditoria — não é definitivo no banco.',
    ],
  },
  'param-admin': {
    summary: 'Atalho central para as demais páginas de configuração do ambiente (plano, identidade visual, parâmetros operacionais).',
    tips: [
      'A maioria dos itens aqui é um atalho para outra tela (ex.: "Plano contratado" leva para Minha Conta) — não é uma tela de edição própria.',
    ],
  },
  'param-integracoes': {
    summary: 'Catálogo de conectores técnicos disponíveis por plano (Gmail, WhatsApp, Jira, API personalizada, etc.).',
    tips: [
      'Um conector "travado" no catálogo exige upgrade de plano para ser ativado — não é um bug, é o próprio modelo de venda.',
      'É esta tela que alimenta os dropdowns de "Integração técnica" em Canais e "Conectores permitidos" em Agentes.',
    ],
  },
  'param-agentes': {
    summary: 'Cadastro dos agentes de IA do cliente: propósito, prompt/contexto, fluxos e conectores autorizados.',
    tips: [
      'O prompt/contexto aqui define como o agente se comporta — é a peça mais importante do cadastro.',
      'Conectores permitidos vêm do catálogo de Integrações; um agente só pode usar o que o plano libera.',
    ],
  },
  'param-conectores': {
    summary: 'Credenciais que os agentes usam pra acessar Jira, Confluence, GitHub e outros conectores em nome do seu tenant.',
    tips: [
      'Depois de salva, a credencial nunca é mostrada de novo — só o status "configurado". Pra trocar, basta cadastrar uma nova.',
      'Sem credencial própria configurada, o agente usa a credencial de plataforma (quando existir) — configurar aqui garante que o acesso é só do seu tenant.',
    ],
  },
  'param-canais': {
    summary: 'Canais de atendimento (WhatsApp, e-mail, widget etc.) e qual integração técnica cada um usa por trás.',
    tips: [
      'Canal é o uso operacional (ex.: "Atendimento via WhatsApp"); Integração é a conexão técnica (Blip, Twilio, Meta API) — são conceitos diferentes de propósito.',
      'Fila e SLA informados aqui são só referência textual — a régua de verdade é configurada em Central de Atendimento → Serviços.',
    ],
  },
  'param-portal': {
    summary: 'Configuração visual do Portal do Cliente que os clientes finais do seu cliente acessam (marca, cores, banners, anúncio).',
    tips: [
      'Recurso de plano Pro/Enterprise — se aparecer bloqueado, é o plano contratado que não libera, não um bug.',
      'Banners e links de rodapé são listas — dá para ter mais de um, ao contrário do anúncio único no topo.',
    ],
  },
  'param-marketplace': {
    summary: 'Vitrine de conectores e apps — nativos DecidAI, oficiais, e de parceiros externos, com o formulário público de cadastro de parceiro.',
    tips: [
      'O selo "Parceiro" mostra o percentual de revenue-share (75/25 padrão, ou a taxa promocional quando ativa) — os selos "Nativo"/"Oficial" não têm split, são feitos pela própria DecidAI.',
      'A aba "Solicitações de parceiros" só aparece para staff da operadora — é onde as submissões do formulário público são aprovadas ou rejeitadas.',
      'Aprovar uma submissão não cria o conector automaticamente no catálogo ainda — isso é um passo manual por enquanto, até haver um parceiro real testado.',
    ],
  },
  'param-preferencias': {
    summary: 'Preferências gerais do ambiente: nome exibido, logo, tema (claro/escuro/sistema), idioma e formato de data.',
    tips: [
      'O logo enviado aqui aparece na sidebar e no cabeçalho do sistema inteiro para este cliente.',
    ],
  },
  'param-seguranca': {
    summary: 'Trilha de auditoria de ações realizadas no sistema — quem fez o quê, quando, em qual módulo.',
    tips: [
      'Toda exclusão feita nas telas de cadastro gera uma linha aqui automaticamente.',
      'Use os filtros de período, módulo e criticidade para investigar um incidente específico.',
    ],
  },
  'param-creditos': {
    summary: 'Saldo de créditos, histórico de consumo de IA e faturas deste ambiente.',
    tips: [
      'Cada débito é gerado automaticamente a partir de uma chamada real de IA (tokens reais, não estimados) — você não lança isso manualmente.',
      'Só administradores do ambiente veem esta tela.',
      'Uso de modelos sem preço cadastrado ainda não é descontado do saldo (aparece como custo zero até o preço ser confirmado).',
      '"Fechar período e gerar fatura" e "Marcar como paga" só aparecem pra suporte/administrador da operadora — soma o consumo real do período com a mensalidade do plano.',
      'Mensalidade e preço de excedente aparecem como "não confirmado" até alguém cadastrar o valor comercial real do plano — nada é inventado.',
    ],
  },
  'rel-personalizado': {
    summary: 'Relatório configurável: escolha origem, colunas e filtros para montar uma visão sob medida.',
    tips: [
      'O resultado pode ser exportado direto pelo botão de exportar no canto superior.',
    ],
  },
  'rel-conhecimentos': {
    summary: 'Relatório de uso e cobertura da Base de Conhecimento.',
    tips: [
      'Use os filtros de período e responsável para comparar produção de conteúdo entre equipes.',
    ],
  },
  'rel-atendimentos': {
    summary: 'Relatório consolidado de atendimentos: volume, origem, status e responsável.',
    tips: [
      'Cruze com a Fila de Chamados se precisar investigar um atendimento específico em vez de só o agregado.',
    ],
  },
  'rel-alertas': {
    summary: 'Relatório de alertas disparados: prioridade, canal e volume por período.',
    tips: [
      'Reflete os mesmos dados de Central de Atendimento → Alertas, só que em formato tabular exportável.',
    ],
  },
  'rel-tarefas': {
    summary: 'Relatório de tarefas: status, prazo, responsável e origem.',
    tips: [
      'Útil para achar tarefas vencidas fora do quadro principal de Tarefas.',
    ],
  },
  'rel-integracoes': {
    summary: 'Relatório de uso das integrações técnicas ativas do cliente.',
    tips: [
      'Ajuda a identificar conectores contratados e nunca configurados.',
    ],
  },
  'rel-auditoria': {
    summary: 'Versão em relatório exportável da trilha de auditoria (mesma fonte de Parametrização → Auditoria).',
    tips: [
      'Prefira esta tela quando precisar exportar o log de auditoria para fora do sistema.',
    ],
  },
  ajuda: {
    summary: 'Tópicos, guias passo a passo e um assistente de autoajuda guiada pra encontrar a resposta certa rápido.',
    tips: [
      'A busca no topo filtra por título, resumo e conteúdo dos guias ao mesmo tempo.',
      'A "Autoajuda guiada" pergunta o que você quer fazer e já leva direto pro guia certo, sem precisar navegar por tópico.',
    ],
  },
};

export function getHelpEntry(page: PageKey): HelpEntry {
  return helpContent[page];
}
