export type HelpTopicId =
  | 'primeiros-passos'
  | 'atendimento'
  | 'conhecimento-agentes'
  | 'usuarios-seguranca'
  | 'portal-cliente'
  | 'creditos';

export type HelpTopic = {
  id: HelpTopicId;
  title: string;
  description: string;
};

export const helpTopics: HelpTopic[] = [
  { id: 'primeiros-passos', title: 'Primeiros passos', description: 'Navegação, tema e configurações básicas da sua conta.' },
  { id: 'atendimento', title: 'Atendimento e Chamados', description: 'Fila de atendimento, fluxos, SLA e prioridade.' },
  { id: 'conhecimento-agentes', title: 'Conhecimento e Agentes de IA', description: 'Como o agente aprende e se conecta a outros sistemas.' },
  { id: 'usuarios-seguranca', title: 'Usuários, Permissões e Segurança', description: 'Convites, perfis de acesso e recuperação de conta.' },
  { id: 'portal-cliente', title: 'Portal do Cliente', description: 'Configurar e entender a área self-service dos seus clientes.' },
  { id: 'creditos', title: 'Créditos e Faturamento', description: 'Como o consumo de IA vira custo e onde acompanhar.' },
];

export type HelpGuideSection = { heading: string; body: string };

export type HelpGuide = {
  slug: string;
  topicId: HelpTopicId;
  title: string;
  summary: string;
  minutes: number;
  sections: HelpGuideSection[];
};

export const helpGuides: HelpGuide[] = [
  {
    slug: 'menu-lateral',
    topicId: 'primeiros-passos',
    title: 'Como o menu lateral funciona',
    summary: 'Grupos, fixar aberto e o atalho de busca no topo.',
    minutes: 2,
    sections: [
      {
        heading: 'Grupos e telas',
        body: 'O menu lateral é organizado por grupo (Área de Trabalho, Cadastros, Central de Atendimento, Parametrização...), não por tela solta. Passe o mouse sobre um grupo pra ver as telas dentro dele — depois de um instante parado, o grupo expande sozinho.',
      },
      {
        heading: 'Fixar o menu aberto',
        body: 'Clicar no ícone de recolher (canto superior do menu) fixa o menu sempre expandido, sem depender de passar o mouse. O estado fica salvo no seu navegador — a próxima vez que você entrar, o menu abre do jeito que você deixou.',
      },
      {
        heading: 'Busca rápida',
        body: 'A barra de busca na topbar filtra por atendimentos, alertas, conhecimentos e tarefas ao mesmo tempo — não precisa saber em qual tela a coisa está antes de procurar.',
      },
    ],
  },
  {
    slug: 'conta-e-tema',
    topicId: 'primeiros-passos',
    title: 'Personalizando sua conta e ativando 2FA',
    summary: 'Tema claro/escuro, foto de perfil e verificação em duas etapas.',
    minutes: 3,
    sections: [
      {
        heading: 'Tema',
        body: 'Por padrão, o sistema segue o tema do seu sistema operacional (claro ou escuro). Pra forçar um dos dois independente do sistema, use o seletor de tema no menu do seu perfil (canto superior direito).',
      },
      {
        heading: 'Ativando 2FA',
        body: 'Em Minha Conta → Segurança, "Ativar verificação em duas etapas" gera um QR code de verdade (não é decoração) — leia com qualquer app autenticador (Google Authenticator, Authy) e confirme com o código de 6 dígitos. Uma vez ativo, todo login futuro vai pedir esse código depois da senha.',
      },
      {
        heading: 'Recuperando a senha',
        body: 'Esqueceu a senha? Veja o guia "Recuperando uma senha perdida" no tópico Usuários, Permissões e Segurança.',
      },
    ],
  },
  {
    slug: 'central-atendimento-visao-geral',
    topicId: 'atendimento',
    title: 'Como funciona a Central de Atendimento',
    summary: 'Fila à esquerda, conversa à direita, nota pública vs. interna.',
    minutes: 4,
    sections: [
      {
        heading: 'A tela',
        body: 'Central de Atendimento é dividida em duas colunas: a fila de chamados à esquerda (filtrável por status, prioridade, responsável) e a conversa do chamado selecionado à direita.',
      },
      {
        heading: 'Comentário público vs. nota interna',
        body: 'Ao responder um chamado, escolha entre "Comentário público" (o solicitante vê, inclusive se ele abriu pelo Portal do Cliente) e "Nota interna" (só sua equipe vê). Use nota interna pra combinar algo com um colega sem misturar com a conversa oficial.',
      },
      {
        heading: 'Aba Atividade',
        body: 'A aba Atividade junta comentário, mudança de status e criação numa linha do tempo só — não precisa procurar em lugares diferentes pra entender o histórico completo do chamado.',
      },
    ],
  },
  {
    slug: 'criar-fluxo-atendimento',
    topicId: 'atendimento',
    title: 'Criando um fluxo de atendimento do zero',
    summary: 'O editor em canvas de Serviços e Filas, e os 6 modelos prontos.',
    minutes: 5,
    sections: [
      {
        heading: 'Onde criar',
        body: 'Em Central de Atendimento → Serviços, a aba "Fluxos" abre um editor em canvas: você arrasta nós (status) e desenha as transições entre eles arrastando de um nó pro outro.',
      },
      {
        heading: 'Partindo de um modelo pronto',
        body: 'No modal de criar fluxo, o seletor "Modelo de fluxo" já carrega 6 modelos prontos (Desenvolvimento de Produto, Suporte de Produto, Atendimento ao Cliente, Gestão de Incidentes, Onboarding de Cliente, Solicitação de Acesso) — todos editáveis no canvas antes de salvar, não precisam ser usados exatamente como vêm.',
      },
      {
        heading: 'As 4 categorias de status',
        body: 'Todo status pertence a uma categoria: Aberto, Em andamento, Concluído ou Cancelar (esta última cobre Cancelado/Recusado/Rejeitado). É essa categoria que determina como o chamado aparece nos indicadores da Área de Trabalho, não o nome do status em si.',
      },
    ],
  },
  {
    slug: 'sla-prioridade',
    topicId: 'atendimento',
    title: 'Configurando SLA e prioridade',
    summary: 'Calendário 24x7 vs. comercial, pausa por categoria, carry-over.',
    minutes: 4,
    sections: [
      {
        heading: 'Serviço antes de fila',
        body: 'Fila e regra de SLA sempre pertencem a um Serviço — é preciso escolher o Serviço primeiro no formulário antes de configurar a fila ou a régua de prazo.',
      },
      {
        heading: 'Calendário',
        body: 'Cada regra de SLA escolhe entre calendário 24x7 (conta toda hora corrida) ou comercial (só conta dentro do horário de expediente configurado). Isso muda completamente o prazo real de entrega calculado.',
      },
      {
        heading: 'Pausa por categoria',
        body: 'É possível pausar a contagem do prazo quando o chamado está numa categoria de status específica — por exemplo, "Aguardando resposta do cliente" não deveria consumir o SLA da sua equipe.',
      },
    ],
  },
  {
    slug: 'de-onde-vem-conhecimento',
    topicId: 'conhecimento-agentes',
    title: 'De onde vem o conhecimento da Base',
    summary: 'Publicado pelo agente a partir de conversas reais — não é cadastro manual.',
    minutes: 3,
    sections: [
      {
        heading: 'Quem publica',
        body: 'Ao contrário do que o nome pode sugerir, você não cadastra conhecimento manualmente em Base de Conhecimento. É o próprio agente (Bel/Kinho/Biel) que decide publicar uma solução ali, a partir de uma conversa real — por exemplo, depois de resolver um problema técnico que pode se repetir.',
      },
      {
        heading: 'O que você faz nessa tela',
        body: 'A tela é de curadoria: revisar o que foi publicado, corrigir um texto que ficou impreciso, ou remover algo que não devia estar ali. Editar o conteúdo pode deixar a busca do agente temporariamente menos precisa, até o texto ser reprocessado.',
      },
      {
        heading: 'Por que funciona assim',
        body: 'A ideia é que o conhecimento nasça de uso real, não de alguém precisar lembrar de documentar depois. Se uma pessoa da sua equipe resolveu algo que outra também vai precisar, a Base cresce sozinha.',
      },
    ],
  },
  {
    slug: 'conectar-agente-sistemas-externos',
    topicId: 'conhecimento-agentes',
    title: 'Conectando o agente a sistemas externos',
    summary: 'Credenciais de Conectores — Jira, Confluence, GitHub, MariaDB.',
    minutes: 4,
    sections: [
      {
        heading: 'Onde configurar',
        body: 'Em Parametrização → Credenciais de Conectores, cada conector tem seu próprio formulário (Jira e Confluence pedem URL + e-mail + token de API; GitHub pede um token único; MariaDB pede host, porta, usuário, senha e nome do banco).',
      },
      {
        heading: 'A credencial nunca reaparece',
        body: 'Depois de salvar, você não consegue ver a credencial de novo pela tela — só o status "Configurado". Pra trocar, cadastre uma nova por cima; não existe "editar o valor existente" porque o valor nunca volta pro navegador.',
      },
      {
        heading: 'Sem credencial própria',
        body: 'Sem uma credencial configurada aqui, o agente usa a credencial de plataforma quando existir uma (por exemplo, pra testes). Configurar sua própria credencial garante que o agente está agindo com o acesso real da sua empresa, isolado de qualquer outro tenant.',
      },
    ],
  },
  {
    slug: 'canais-e-agentes',
    topicId: 'conhecimento-agentes',
    title: 'Entendendo Canais e Agentes',
    summary: 'Canal é o meio de contato; Agente é quem responde.',
    minutes: 2,
    sections: [
      {
        heading: 'Canal ≠ Integração',
        body: 'Canal é o uso operacional — "Atendimento via WhatsApp", por exemplo. Integração é a conexão técnica por trás (Meta API, Blip, Twilio). São conceitos diferentes de propósito, mesmo que um dependa do outro pra funcionar de verdade.',
      },
      {
        heading: 'O que é um Agente aqui',
        body: 'Em Parametrização → Agentes você cadastra qual agente de IA atende em qual contexto — propósito, prompt/contexto e quais conectores ele pode usar. Um agente só enxerga o que o plano do seu tenant libera.',
      },
    ],
  },
  {
    slug: 'convidar-pessoa',
    topicId: 'usuarios-seguranca',
    title: 'Convidando uma nova pessoa pro sistema',
    summary: 'Convite obrigatório por e-mail — motivado por LGPD.',
    minutes: 3,
    sections: [
      {
        heading: 'Por que é só por convite',
        body: 'Cadastro de usuário não aceita mais só digitar um nome — precisa convidar por e-mail (link mágico) porque o sistema precisa identificar de verdade quem é a pessoa dona daquele acesso, exigência de LGPD. A pessoa confirma clicando no link recebido.',
      },
      {
        heading: 'Status "Pendente"',
        body: 'Enquanto o convite não é aceito, a pessoa aparece como "Pendente" na lista de Usuários. O botão "Reenviar convite" só aparece nesse estado — some assim que o acesso é confirmado.',
      },
      {
        heading: 'Se o e-mail não chegar',
        body: 'Verifique a caixa de spam primeiro. Provedores como Outlook/Hotmail costumam ser mais rigorosos com e-mail transacional — se o problema persistir, fale com quem administra a conta pra investigar a entrega.',
      },
    ],
  },
  {
    slug: 'perfis-de-acesso',
    topicId: 'usuarios-seguranca',
    title: 'Entendendo perfis de acesso e permissões',
    summary: 'Perfil é permissão de verdade, não um rótulo decorativo.',
    minutes: 3,
    sections: [
      {
        heading: 'Perfil vira permissão real',
        body: 'O perfil atribuído a uma pessoa (ex.: Administrador do Cliente, Operacional) controla de verdade quais telas e ações ela enxerga — não é só um texto informativo na lista de usuários.',
      },
      {
        heading: 'Conta de staff vs. conta de cliente',
        body: 'Contas da equipe da operadora (suporte/admin_operadora) podem "Acessar como" um tenant específico pela sidebar, pra ajudar ou configurar em nome dele — isso fica registrado em log, mas nunca cria um vínculo permanente com aquele tenant.',
      },
    ],
  },
  {
    slug: 'recuperar-senha',
    topicId: 'usuarios-seguranca',
    title: 'Recuperando uma senha perdida',
    summary: 'Fluxo real de "esqueci minha senha", com link por e-mail.',
    minutes: 2,
    sections: [
      {
        heading: 'Como pedir a recuperação',
        body: 'Na tela de login, clique em "Esqueceu sua senha?", informe seu e-mail e confirme. Por segurança, a mensagem de confirmação aparece igual esteja ou não cadastrado esse e-mail — isso evita que alguém descubra quais e-mails têm conta só tentando recuperar senha.',
      },
      {
        heading: 'Depois de clicar no link',
        body: 'O link do e-mail abre uma tela pra você escolher a nova senha (mínimo 6 caracteres). Depois de salvar, você volta automaticamente pro lugar certo — o login principal ou o Portal do Cliente, dependendo de onde pediu a recuperação.',
      },
      {
        heading: 'Link expirado',
        body: 'Links de recuperação têm validade curta. Se aparecer "link expirado ou já usado", volte à tela de login e peça um novo — é mais rápido do que tentar reaproveitar um antigo.',
      },
    ],
  },
  {
    slug: 'configurar-portal-cliente',
    topicId: 'portal-cliente',
    title: 'Configurando o Portal do Cliente',
    summary: 'Marca, cores e banners da área self-service dos seus clientes.',
    minutes: 3,
    sections: [
      {
        heading: 'Onde configurar',
        body: 'Em Parametrização → Portal do Cliente, defina nome do portal, logo, cor primária/destaque e banners de anúncio. Esse portal fica disponível num link próprio ("/portal/" seguido do identificador do seu tenant) que você compartilha com seus clientes.',
      },
      {
        heading: 'Disponibilidade por plano',
        body: 'O Portal do Cliente é um recurso de plano Pro/Enterprise — tenants em planos menores não têm acesso a essa configuração.',
      },
    ],
  },
  {
    slug: 'como-cliente-usa-portal',
    topicId: 'portal-cliente',
    title: 'Como seus clientes usam o Portal',
    summary: 'Cadastro próprio, login e abertura de chamado — sem sua intervenção.',
    minutes: 2,
    sections: [
      {
        heading: 'Conta própria do Portal',
        body: 'Seus clientes criam a própria conta direto no Portal (nome, e-mail, senha) — é uma conta separada da conta de usuário interno do sistema, vinculada só àquele portal específico.',
      },
      {
        heading: 'Esqueceu a senha do Portal',
        body: 'O Portal tem o próprio fluxo de "Esqueceu sua senha?", igual ao login principal — seu cliente não precisa falar com ninguém da sua equipe pra recuperar acesso.',
      },
      {
        heading: 'Abrindo e acompanhando chamados',
        body: 'Depois de logado, o cliente vê os próprios chamados (com número de protocolo), pode abrir um novo e responder — essas mensagens chegam na mesma Central de Atendimento que sua equipe usa.',
      },
    ],
  },
  {
    slug: 'entender-saldo-creditos',
    topicId: 'creditos',
    title: 'Entendendo seu saldo de créditos',
    summary: 'Cada chamada real de IA debita do saldo, com histórico completo.',
    minutes: 3,
    sections: [
      {
        heading: 'O que consome crédito',
        body: 'Toda vez que um agente de IA processa uma mensagem em nome do seu tenant, o consumo real de tokens daquela chamada é convertido em custo e debitado automaticamente do seu saldo — não é uma estimativa arredondada.',
      },
      {
        heading: 'Onde ver o histórico',
        body: 'Em Parametrização → Créditos e Consumo, o saldo atual fica no topo e o histórico completo do ledger (cada débito, com data e origem) fica logo abaixo — dá pra entender exatamente de onde veio cada cobrança.',
      },
    ],
  },
];

export function findGuide(slug: string): HelpGuide | undefined {
  return helpGuides.find((guide) => guide.slug === slug);
}

export function guidesByTopic(topicId: HelpTopicId): HelpGuide[] {
  return helpGuides.filter((guide) => guide.topicId === topicId);
}

export type GuidedFlowOption = {
  label: string;
  guideSlug: string;
};

export const guidedFlowQuestion = 'O que você precisa fazer agora?';

export const guidedFlowOptions: GuidedFlowOption[] = [
  { label: 'Convidar uma pessoa nova pro sistema', guideSlug: 'convidar-pessoa' },
  { label: 'Recuperar uma senha perdida', guideSlug: 'recuperar-senha' },
  { label: 'Criar um fluxo de atendimento novo', guideSlug: 'criar-fluxo-atendimento' },
  { label: 'Entender por que a Base de Conhecimento está vazia', guideSlug: 'de-onde-vem-conhecimento' },
  { label: 'Conectar o agente a um sistema externo (Jira, GitHub...)', guideSlug: 'conectar-agente-sistemas-externos' },
  { label: 'Configurar o Portal pros meus clientes', guideSlug: 'configurar-portal-cliente' },
  { label: 'Entender de onde vem uma cobrança de crédito', guideSlug: 'entender-saldo-creditos' },
  { label: 'Ativar verificação em duas etapas (2FA)', guideSlug: 'conta-e-tema' },
];
