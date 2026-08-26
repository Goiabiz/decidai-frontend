# DecidAI Frontend

Frontend da plataforma DecidAI (nasceu como POC vendável do Radar SUS, primeiro tenant ConectaSUS).

## Status desta versão

- Layout principal com menu lateral.
- Telas-resumo dos módulos principais.
- Painel contextual direito.
- Dados demonstrativos como fallback.
- Integração preparada com Supabase via `.env`.
- Leitura inicial das views:
  - `vw_radar_dashboard`
  - `vw_alertas_pendentes`
  - `vw_documentos_base`
  - `vw_impactos_produto`
  - `vw_decisoes_po`
  - `vw_universe_poc_atendimentos`
  - `clientes_contratantes`

## Rodar localmente

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Abra:

```text
http://localhost:5173/
```

## Configurar Supabase

Edite o arquivo `.env` e preencha as publishable keys dos projetos.

```env
VITE_SUPABASE_UNIVERSO_URL=https://ejclkqscqutvhtutextc.supabase.co
VITE_SUPABASE_UNIVERSO_ANON_KEY=cole_a_publishable_key_do_universo_conectasus

VITE_SUPABASE_POC_URL=https://yjazpxdyitevivbxnmfm.supabase.co
VITE_SUPABASE_POC_ANON_KEY=cole_a_publishable_key_do_universe_poc
```

Se o Supabase não estiver configurado ou a política RLS bloquear leitura pública, o sistema mantém os dados demonstrativos e exibe o aviso `Usando dados demonstrativos`.

## Próximos passos

1. Implementar autenticação Supabase.
2. Trocar fallback mock por dados reais após login.
3. Criar ações dos botões internos.
4. Criar detalhes das funcionalidades por módulo.
5. Criar Parametrização > Perfil e Aparência.


## Versão v3 — listas reais no dashboard

Esta versão mantém a integração Supabase da v2 e passa a usar dados reais também nas listas do Dashboard:

- `vw_alertas_pendentes` para **Últimos alertas**
- `vw_impactos_produto` para **Impactos recentes**
- `vw_radar_dashboard` para os cards executivos

A tela continua com fallback demonstrativo se alguma consulta falhar.


## Versão v4 — Impactos no Produto conectado

A tela **Impactos no Produto** passa a usar dados reais da view:

- `vw_impactos_produto`

A tela calcula indicadores a partir dos registros carregados e mantém fallback demonstrativo caso a consulta falhe.


## Versão v5 — Base de Conhecimento conectada

A tela **Base de Conhecimento** passa a exibir melhor os documentos reais vindos da view:

- `vw_documentos_base`

A alteração melhora:
- indicadores da base;
- tabela de documentos monitorados;
- tags e status;
- prévia do documento selecionado;
- preparação visual para as futuras áreas de Fontes, Curadoria e Conectores Externos.

A conexão com fontes externas reais permanece no roadmap e não faz parte desta versão do frontend.


## Versão v6 — Central de Atendimento conectada

A tela **Central de Atendimento** passa a usar dados reais da view:

- `vw_universe_poc_atendimentos`

A alteração melhora:
- indicadores de atendimentos;
- tickets externos vinculados;
- canais ativos;
- tabela de acompanhamento;
- prévia do atendimento selecionado.

Esta versão ainda não executa ações reais nos botões internos.


## Versão v7 — Parametrização conectada

A tela **Parametrização** passa a usar dados reais do projeto `universe-poc`:

- `clientes_contratantes`
- `integracoes`
- `usuarios_sistema`

A alteração inclui:
- indicadores de clientes, integrações, usuários e ambientes;
- tabela de clientes;
- tabela de integrações;
- tabela de usuários;
- nota de roadmap para perfil, aparência, permissões e conectores externos.


## Correção v7.1 — Parametrização

Corrige a tela **Parametrização** para usar corretamente o cliente Supabase POC já configurado no frontend.

Correção:
- resolve erro `getPocClient is not defined`;
- mantém fallback demonstrativo;
- preserva a leitura de clientes, integrações e usuários.


## Correção v7.2 — Parametrização por views

A tela **Parametrização** passa a consumir views próprias do frontend, em vez de consultar tabelas brutas:

- `vw_frontend_config_clientes`
- `vw_frontend_config_integracoes`
- `vw_frontend_config_usuarios`

Isso mantém a estratégia de segurança: o frontend lê views controladas, sem abrir acesso direto às tabelas internas.


## Correção v7.3 — Parametrização sem tela branca

Corrige a tela **Parametrização** para proteger listas antes de usar `.filter()`, `.map()` e `.length`.

Correção:
- evita tela branca quando uma consulta retorna `undefined`;
- mantém fallback demonstrativo;
- preserva uso das views de configuração.


## Correção v7.4 — Parametrização conectando nas views

Corrige a camada `radarApi.ts` e `supabase.ts` para a tela **Parametrização** consumir diretamente:

- `vw_frontend_config_clientes`
- `vw_frontend_config_integracoes`
- `vw_frontend_config_usuarios`

Também mantém proteção contra tela branca caso alguma consulta falhe.


## Correção v7.5 — Compatibilidade Supabase

Corrige a compatibilidade interna da camada de API:

- mantém `universoSupabase` e `pocSupabase`;
- restaura aliases `supabaseUniverso` e `supabasePoc` usados pelas telas já conectadas;
- evita retorno para dados demonstrativos por erro de variável indefinida;
- preserva as views de Parametrização.


## Correção v7.6 — Indicador Supabase em Parametrização

Corrige as funções de Parametrização para retornarem o mesmo formato usado pelas demais telas:

- `{ data, source, error }`

Com isso, a tela Parametrização passa a exibir corretamente **Dados conectados ao Supabase** quando as views responderem.


## Versão v9 — Detalhe expandido em modal

Evolui o painel lateral dinâmico para permitir abrir o item selecionado em uma visão expandida.

Inclui:
- botão **Abrir detalhe** no painel lateral;
- modal grande no estilo ferramenta de gestão/Jira;
- abas de Resumo, Histórico, Vínculos, Ações e Anexos;
- área de informações principais;
- linha do tempo;
- ações rápidas;
- botão visual **Abrir em aba** preparado para evolução futura.

Nesta versão, o modal é visual e contextual. As abas e ações ainda não executam fluxo real.


## Correção v9.1 — Ajuste de import em Parametrização

Corrige erro de parse em `src/pages/Configuracoes.tsx`, onde o import de `PageProps` havia sido inserido dentro de um import já aberto.

Correção:
- reposiciona `import type { PageProps } from '../App';`
- preserva modal de detalhe expandido
- preserva painel lateral dinâmico


## Correção v9.2 — Refinamento visual do detalhe expandido

Ajusta o detalhe expandido para ficar mais próximo do padrão visual do Radar SUS e da experiência inspirada no Jira.

Inclui:
- remoção do botão textual **Abrir detalhe**;
- inclusão de ícone de expandir no painel lateral;
- título do painel clicável para abrir o detalhe;
- modal com paleta visual do sistema;
- botões superiores em formato de ícone;
- cards e abas mais compactos e elegantes.


## Correção v9.3 — Padrão Jira e roadmap de componentes

Refina a experiência de detalhe para aproximar do padrão Jira:

- modal volta a abrir centralizada;
- remove redundância do botão textual de detalhe;
- adiciona ícone de expandir na linha para abrir detalhe direto;
- mantém clique no título/linha para atualizar painel direito;
- adiciona possibilidade de recolher o painel lateral direito;
- mantém painel lateral como prévia rápida.

Roadmap registrado para próximos componentes:
- editar título/resumo inline com ícone de lápis;
- alterar status diretamente na linha;
- alterar prioridade diretamente na linha;
- alterar responsável diretamente na linha;
- filtros dinâmicos no topo por status, módulo, responsável, prioridade e período;
- conectar esses componentes aos campos reais do Supabase;
- criar rotas próprias para abrir detalhe em aba/página dedicada.


## Versão v10 — Workspaces configuráveis por módulo

Consolida o conceito de **área de trabalho configurável por módulo**.

Inclui:
- botão **Personalizar área** no topo;
- modal de personalização por módulo;
- configuração visual de colunas, filtros rápidos, painel lateral e cards/KPIs;
- modelo padrão específico para cada módulo;
- registro de roadmap para salvar preferências por usuário/perfil no Supabase.

Conceito:
- Módulo = área de trabalho;
- Funcionalidade = visão/aba/bloco dentro da área;
- Usuário = personaliza layout, colunas, filtros e painel conforme seu uso.


## Correção v10.1 — Personalização movida para Parametrização

Remove a personalização do topo global e concentra a configuração da área de trabalho dentro de **Parametrização > Aparência/Área de trabalho**.

Inclui:
- preferências salvas em `localStorage`;
- nome, e-mail e foto do usuário;
- tema claro/escuro/sistema;
- cor principal e cor da dashboard;
- densidade confortável/compacta;
- painel lateral aberto ou recolhido por padrão;
- flags para KPIs, gráficos e filtros rápidos;
- preparação para gravar preferências por usuário/perfil no Supabase.

Esse bloco substitui o botão global **Personalizar área** e evita reconfiguração a cada abertura do navegador.


## Versão v11 — Bloco operacional completo do front

Consolida os 7 apontamentos do primeiro bloco do front:

1. Validação visual da base v10.1 preservada.
2. Ícone de detalhe padronizado nas listas principais.
3. Painel lateral direito mantido como prévia rápida, com recolhimento.
4. Modal de detalhe com abas funcionais: Resumo, Histórico, Vínculos, Ações e Anexos.
5. Filtros dinâmicos visuais e funcionais por texto, status, prioridade, responsável e módulo.
6. Edição inline simulada na linha: editar texto, status, prioridade e responsável.
7. Preferências persistentes no navegador, com roadmap para Supabase.

Observação:
- Edição inline e filtros funcionam em modo front/local para POC.
- Persistência real de edição, preferências por perfil e rotas dedicadas serão conectadas ao Supabase na próxima fase.


## Versão v12 — Nomenclatura comercial, Mapa de Impactos e Personas

Ajusta a narrativa do produto sem alterar a estrutura central construída.

Renomeações:
- Dashboard → Área de Trabalho
- Alertas Inteligentes → Central de Alertas
- Análise e Ações → Roadmap
- Impactos no Produto → Mapa de Impactos

Escopo consolidado:
- Base de Conhecimento alimenta o SUSi e a Central de Alertas;
- Central de Alertas identifica mudanças, riscos e sinais relevantes;
- Mapa de Impactos cruza produto, cliente, serviço, persona e risco;
- Roadmap transforma impacto em decisão, prioridade e entrega;
- Central de Atendimento alimenta a inteligência com demandas reais de cliente;
- Parametrização concentra clientes, integrações, usuários, preferências e personas.

Inclui:
- blocos visuais de alcance no Mapa de Impactos;
- camada de personas em Parametrização;
- orientação do SUSi por perfil impactado;
- preparação para comunicação executiva, gerencial, operacional e técnica.


## Versão v12.1 — Parametrização e ordem do menu

Ajusta nomenclatura e organização visual do menu.

Alterações:
- Configurações → Parametrização;
- Área de Trabalho permanece fixa no topo;
- demais módulos organizados em ordem alfabética:
  - Base de Conhecimento;
  - Central de Alertas;
  - Central de Atendimento;
  - Mapa de Impactos;
  - Parametrização;
  - Roadmap.

Observação:
- Os nomes técnicos dos arquivos/componentes foram preservados para evitar refatoração desnecessária nesta etapa.
- A alteração é visual/conceitual e mantém a estrutura construída.


## Versão v12.2 — Tipografia híbrida Montserrat + Inter

Ajusta a identidade visual do Radar SUS com uma composição híbrida:

- Montserrat para títulos, menu, botões, badges, cards e elementos de identidade;
- Inter para tabelas, textos longos, campos, filtros e leitura operacional.

Objetivo:
- manter aparência mais premium e comercial;
- preservar legibilidade em telas densas;
- melhorar leitura de tabelas, filtros e informações operacionais.

Esta versão já inclui os ajustes da v12.1:
- Configurações → Parametrização;
- menu em ordem alfabética com Área de Trabalho fixa no topo.


## Versão v12.3 — Refinamento fino da tipografia

Ajusta o peso visual da tipografia híbrida:

- mantém Montserrat nos títulos, identidade, menu e cards;
- reduz o peso da Montserrat no menu lateral;
- preserva Inter em tabelas, campos e textos operacionais;
- torna badges e tabelas menos pesados visualmente;
- melhora leitura em itens com quebra de linha, como Base de Conhecimento e Central de Atendimento.

Objetivo:
- preservar aparência premium;
- evitar excesso de negrito;
- melhorar conforto visual nas áreas operacionais.


## Versão v13 — Ações reais e persistência operacional

Transforma a camada operacional da POC em uma experiência funcional no front/local.

Inclui:
- edição inline persistente em `localStorage`;
- alteração de status, prioridade e responsável preservada ao recarregar;
- envio de item para o Roadmap a partir do painel ou modal;
- descarte operacional do item;
- marcação de revisão do PO;
- histórico operacional local por item;
- aba Histórico da modal alimentada por ações reais locais;
- Roadmap passa a exibir itens gerados localmente;
- store local preparado para futura troca por persistência no Supabase.

Observação:
- As alterações ainda não gravam no Supabase.
- A estrutura foi preparada para conectar escrita real em uma próxima etapa sem refazer a experiência.
- Mantém o refino tipográfico da v12.3.


## Correção v13.1 — Loading e geração de Roadmap

Corrige problemas identificados no teste da v13:

- evita indicador preso em "Carregando dados";
- aplica timeout de carregamento e usa fallback demonstrativo quando necessário;
- corrige store operacional local;
- corrige geração de item no Roadmap;
- adiciona feedback visual no painel lateral e na modal;
- Roadmap atualiza ao receber novo item e ao retornar para a aba/janela;
- mantém ações locais em `localStorage`.


## Correção v13.2 — Timeout menos agressivo para Supabase

Ajusta a correção da v13.1 para não cair rápido demais em dados demonstrativos.

Alterações:
- tempo limite de carregamento aumentado para 12 segundos;
- mensagem de loading alterada para "Conectando ao Supabase...";
- mantém fallback demonstrativo apenas quando a consulta demora além do limite ou falha;
- preserva geração de Roadmap, histórico local e ações operacionais da v13.1.


## Correção v13.3 — Carregamento produtivo e Montserrat mais leve

Corrige a estratégia de carregamento:

- remove fallback automático para dados demonstrativos por timeout;
- mantém a tentativa de conexão com Supabase sem derrubar para mock por demora;
- usa fallback visual apenas como estrutura enquanto carrega;
- mostra erro/fallback demonstrativo somente em caso de erro real;
- limpa novamente a store operacional local;
- reduz mais o peso da Montserrat no menu, títulos e cards.

Objetivo:
- evitar falso demonstrativo em ambiente conectado;
- melhorar experiência de volume futuro;
- preservar legibilidade e leveza visual.


## Versão v13.4 — Roadmap de Governança, Auditoria, Relatórios e Links Seguros

Inclui no roadmap funcional do Radar SUS a frente de governança e segurança operacional.

Escopo previsto:

### Exportação de dados
- exportar listas, filtros, alertas, impactos, documentos, roadmap e atendimentos;
- formatos previstos: CSV, XLSX e PDF;
- controle por perfil, cliente, módulo e permissão.

### Impressão de relatórios
- impressão de relatórios sintéticos, analíticos e executivos;
- relatórios por módulo, cliente, período, status, criticidade, responsável e persona impactada;
- impressão/listagem de atividades e histórico operacional.

### Logs e auditoria de usuários
Registrar ações com:
- data;
- hora;
- usuário;
- nome;
- IP;
- módulo;
- funcionalidade;
- operação realizada;
- origem da ação;
- dados anteriores;
- dados novos;
- tipo de operação: insert, update, delete, login, exportação, impressão e acesso externo.

### Atividades e histórico
- histórico por item;
- histórico por usuário;
- histórico por módulo;
- histórico por cliente;
- linha do tempo de decisão, alteração, exportação e impressão.

### Links externos seguros
- registrar acesso a links externos;
- exibir aviso de segurança antes de abrir fonte externa;
- informar domínio, URL, origem, usuário, data/hora e IP;
- registrar confirmação de abertura.

### Auditoria do SUSi
Registrar quando o agente:
- consultar uma fonte externa;
- baixar informação;
- resumir documento;
- gerar orientação;
- recomendar ação;
- vincular documento, alerta, impacto ou item de roadmap.

Diretriz:
Toda ação que altere dados, gere impacto operacional, exporte informação, imprima relatório, consulte fonte externa ou acione o SUSi deverá gerar registro de auditoria consultável.


## Correção v13.5 — Conexão lenta sem travar tela

Ajusta o carregamento para não ficar preso em "Conectando ao Supabase".

Nova regra:
- tenta conectar ao Supabase normalmente;
- após 3,5 segundos, libera a tela e mostra aviso de conexão lenta;
- continua aguardando a resposta do Supabase em segundo plano;
- se o Supabase responder, troca para "Dados conectados ao Supabase";
- se houver erro real, mostra aviso de sem conexão;
- não troca automaticamente para modo demonstrativo por demora.

Objetivo:
- evitar carregamento infinito;
- não gerar falso modo demonstrativo;
- manter a tela utilizável enquanto o Supabase responde.


## Versão v14 — Persistência Supabase preparada + Auditoria técnica

Prepara a transição da persistência local para persistência real no Supabase.

Inclui:
- serviço `operationalSupabase.ts` com contratos de escrita futura;
- persistência local mantida como comportamento principal da POC;
- chamadas fire-and-forget preparadas, mas com escrita real desativada por flag;
- migração SQL sugerida `database/01_migrations/016_operacional_auditoria_workspace_roadmap.sql`;
- contratos para itens de Roadmap, alterações inline, histórico operacional, auditoria, links externos e auditoria do SUSi.

A escrita real permanece desativada:

```ts
const ENABLE_SUPABASE_WRITES = false;
```

Antes de ativar:
1. aplicar a migração no Supabase correto;
2. definir policies RLS;
3. revisar permissões por perfil;
4. testar insert/update/delete com usuário autenticado;
5. ativar a flag de escrita real.


## Correção v14.1 — Compatibilidade com cliente Supabase existente

Corrige o import do serviço operacional.

A v14 usava `supabasePoc`, mas o projeto exporta:

```ts
pocSupabase
universoSupabase
```

A correção altera `operationalSupabase.ts` para usar `pocSupabase` e mantém a escrita real desativada por flag.


## Versão v15 — Painel direito operacional + Base de Conhecimento semântica

Pacote focado em layout, semântica e comportamento local, sem alteração estrutural de banco.

### Base de Conhecimento
- `Novo documento` → `Adicionar Conhecimento`;
- abas: Conhecimentos, Fontes e Análises;
- indicadores:
  - Conhecimentos ativos;
  - Fontes monitoradas;
  - Grupos;
  - Análises pendentes;
- indicadores com tooltip e clique para atalho/filtro;
- remoção dos textos pequenos de tendência nos indicadores da Base de Conhecimento;
- busca: `Buscar conhecimento por descrição, fonte, grupo ou assunto...`;
- tabela ajustada para linguagem de negócio:
  - Descrição;
  - Origem;
  - Fonte;
  - Incluído em;
  - Data da fonte;
  - Grupo;
  - Status;
  - Classificação;
  - Responsável;
  - Ações;
- status do conhecimento simplificado:
  - Novo;
  - Em análise;
  - Ativo;
  - Cancelado;
- classificação substitui prioridade/relevância na Base de Conhecimento;
- edição fica junto da descrição;
- ações agrupadas por linha:
  - Expandir em modal;
  - Acessar em nova guia;
  - Mais opções.

### Painel direito
- remove título genérico `Documento selecionado` para conhecimento;
- painel passa a iniciar pelo item selecionado;
- botão de abrir em nova guia;
- botão de expandir em modal;
- botão de mais opções;
- botão de recolher painel;
- botão de largura dinâmica: compacto, médio e expandido;
- blocos recolhíveis:
  - Resumo;
  - Informações;
  - Relações do conhecimento;
  - Ações rápidas;
  - Histórico;
  - Governança;
- relações do conhecimento com contadores:
  - Alertas gerados;
  - Impactos associados;
  - Tarefas relacionadas;
  - Orientações registradas;
  - Versões do conhecimento;
  - Atendimentos vinculados.

### Roadmap funcional registrado
- largura do painel salva por usuário;
- arrastar largura do painel como evolução futura;
- campos personalizáveis controlados;
- visões personalizadas por usuário;
- colunas configuráveis por módulo;
- blocos configuráveis no painel direito;
- controle de quais campos podem ser editados inline.


## Correção v15.1 — Ajustes finos de usabilidade da Base de Conhecimento

Ajustes após validação visual:

- o painel direito não abre automaticamente ao entrar no módulo;
- painel direito abre somente após selecionar um item;
- abas Fontes e Análises permanecem visíveis, mas sem ação por enquanto;
- cards da Base de Conhecimento voltam ao padrão visual dos demais módulos;
- tooltips passam a usar texto neutro, sem depender do nome do agente SUSi;
- ícones de origem ganham cores e significado visual por tipo;
- lápis de edição fica em coluna discreta e aparece apenas ao passar o mouse na linha;
- Governança foi renomeado para Mais ações;
- painel direito recebe barra lateral para arrastar e ajustar a largura;
- o botão de tamanho do painel permanece alternando compacto, médio e expandido.

Sem alteração estrutural de banco.


## Correção v15.2 — Ícones do topo do painel direito

Ajusta a barra superior do painel direito:

- remove duplicidade visual do ícone de expandir;
- `↔` passa a representar ajuste de largura do painel;
- `⛶` permanece para expandir em modal;
- `⋯` fica ao lado do botão de fechar;
- ordem padronizada:
  - abrir em nova guia;
  - expandir;
  - ajustar largura;
  - mais opções;
  - fechar/recolher.


## Correção v15.3 — Origem, edição e compartilhamento

Ajustes visuais e funcionais:

- lápis de edição alinhado na linha e visível apenas no hover;
- ícones de origem maiores, mais fortes e com cores por tipo;
- exportações renomeadas por tipo de arquivo:
  - PDF;
  - XLS;
  - DOC;
  - XML;
  - CSV;
- `Copiar link` foi substituído por `Compartilhar`;
- compartilhar abre popover com:
  - destinatário;
  - mensagem opcional;
  - copiar link;
  - enviar por e-mail;
- enviar por e-mail exibe aviso para conectar uma conta em Parametrização > Integrações.


## Correção v15.4 — Largura da tela, lápis e origem

Corrige pontos visuais da v15.3:

- quando o painel direito está fechado, a área central volta a ocupar a largura disponível;
- remove a área branca reservada indevidamente ao painel direito;
- lápis de edição fica alinhado ao título e aparece somente no hover da linha;
- remove coluna discreta separada quando ela não melhora a leitura;
- ícones de origem ficam maiores, mais contrastados e visíveis;
- mantém compartilhamento, exportações e painel redimensionável.


## Correção v15.5 — Menu único, origem e roadmap do agente

Ajustes implementados:
- menu de ações unificado para linha e painel direito;
- exportações padronizadas como tipos de arquivo: PDF, XLS, DOC, XML e CSV;
- `Copiar link` substituído por `Compartilhar`;
- compartilhamento com destinatário, mensagem, copiar link e envio por e-mail;
- menus fecham ao clicar fora;
- ao abrir um menu, o outro é recolhido;
- ícone de origem ajustado para leitura mais clara;
- origem `Guia/Wiki/Site` passa a usar ícone de acesso/fonte externa.

Roadmap funcional registrado:
- Classificações personalizáveis por produto, cliente ou operação;
- administrador poderá cadastrar e ordenar classificações;
- o campo Classificação deverá aceitar valores parametrizados;
- cada produto poderá definir classificações próprias;
- agente contratado poderá atuar como guia de preenchimento;
- o agente deverá fazer perguntas orientadas ao usuário;
- o usuário responde e o agente sugere preenchimento dos campos;
- os campos só serão aplicados após validação do usuário;
- registrar histórico da orientação, sugestão e decisão validada.


## Versão v16 — Área de Trabalho executiva

Ajusta a Home para ser uma visão de resumo, não uma tela operacional.

### Área de Trabalho
- Remove uso de painel direito na Home;
- clique em itens abre modal de resumo;
- remove filtros da Home;
- remove ações inline da Home;
- padroniza cards com tooltip e sem texto pequeno abaixo do valor;
- indicadores principais:
  - Conhecimentos ativos;
  - Alertas;
  - Ações pendentes;
  - Novas tarefas;
  - Fontes monitoradas;
- remove `Trechos indexados` da Home por ser informação técnica;
- remove `Impactos identificados` como indicador fixo;
- substitui o gráfico decorativo por:
  - Tarefas por status;
  - Movimento dos últimos 7 dias;
- troca `Mapa de impactos recente` por `Tarefas recentes`;
- `Últimos 5 alertas` vira lista de resumo sem ações.

### Conceito registrado
- Conhecimento é fonte/conteúdo capturado, cadastrado ou monitorado;
- Alerta é sinal emitido a partir de conhecimento, regra, mudança, risco ou oportunidade;
- Impacto é consequência analisada, não indicador fixo da Home;
- Tarefa é ação operacional criada a partir de alerta, análise, orientação ou decisão.

### Roadmap registrado
- Canais monitorados como fonte de conhecimento;
- fontes do tipo rede social ou canal de vídeo exigem plataforma, perfil/canal/página e URL/identificador externo;
- rede social e canal de vídeo não mudam a estrutura principal: continuam sendo Fonte → Conhecimento → Análise → Ativo/Cancelado → Alerta/Impacto/Tarefa;
- ajustar ícones de origem para não usar `Alerta` como origem;
- redes sociais devem usar ícones próprios ou equivalentes claros por plataforma.


## Correção v16.1 — Home executiva refinada

Ajustes na Área de Trabalho:
- troca o gráfico de barras de tarefas por uma rosca de tarefas por status;
- renomeia `Movimento dos últimos 7 dias` para `Atualizações da Base de Conhecimento`;
- troca o gráfico de movimento por rosca de origem da base;
- remove a ideia de evolução temporal da Home por enquanto;
- mantém a Home como resumo executivo, não tela de trabalho;
- separa `Tarefas recentes` e `Alertas recentes` em dois blocos sequenciais de largura total;
- remove textos do tipo `últimos 5` dos títulos;
- mantém clique em item abrindo modal, sem painel direito.

Roadmap registrado:
- agente contratado deve permitir interação por voz;
- agente deve ouvir o usuário, transcrever a solicitação e pedir validação antes de preencher ou executar;
- agente deve responder por voz quando habilitado;
- voz deve respeitar permissão do usuário, contexto do cliente, perfil de acesso e auditoria;
- todos os comandos por voz devem gerar histórico de solicitação, sugestão e confirmação.


## Correção v16.2 — Tooltips da Área de Trabalho e textos orientados

Ajustes:
- adiciona tooltips visíveis nos cards da Área de Trabalho;
- mantém os tooltips da Base de Conhecimento como já estavam;
- troca subtítulos das telas para orientar o usuário sobre o que acompanhar ou fazer;
- remove menção genérica ao agente/persona nos textos gerais;
- padrão de escrita: subtítulo deve orientar uso prático, não explicar tecnicamente o módulo.


## Correção v16.3 — Tooltip interno no KPI Card

Ajuste técnico:
- `KpiCard` passa a aceitar a propriedade `tooltip`;
- o ícone de informação é renderizado dentro do próprio card;
- a Área de Trabalho passa os textos de tooltip diretamente para o card;
- evita perda visual por wrapper externo ou sobreposição de CSS.


## Versão v17 — Central de Alertas conceitual

Central de Alertas ajustada para refletir o conceito de produto:

- alerta é um aviso/sinal que precisa ser monitorado, divulgado e tratado;
- conhecimento pode gerar alerta e tarefa;
- alerta pode gerar tarefa;
- tarefa pode gerar novo conhecimento e novo alerta;
- o valor do alerta está na difusão da informação e nas ações posteriores.

### Regras da Central de Alertas
- status simples: `Novo`, `Em andamento`, `Concluído`;
- `Críticos em aberto` conta somente alertas críticos não concluídos, não cancelados e não excluídos;
- alerta concluído deixa de contar como crítico aberto;
- cancelamento e exclusão são ações, não status principal da operação;
- manter controle de quem recebeu o alerta e quais atividades posteriores foram geradas;
- ao encaminhar alerta para tarefa, a tarefa deve nascer vinculada ao alerta;
- se a tarefa já existir, permitir vincular tarefa existente;
- vínculo com conhecimento não deve ser ação principal, pois o alerta já nasce de uma origem/contexto quando aplicável.

### Divulgação do alerta
O alerta deve suportar divulgação por:
- usuários do sistema;
- equipes;
- e-mail;
- WhatsApp;
- contatos externos;
- clientes ou grupos configurados.

### Ações do alerta
Ações adequadas:
- Cadastrar alerta;
- Divulgar alerta;
- Encaminhar para tarefa;
- Vincular tarefa existente;
- Gerar orientação;
- Acionar agente;
- Compartilhar;
- Concluir alerta;
- Cancelar;
- Excluir.

Ações removidas do contexto de alerta:
- Ativar conhecimento;
- Arquivar conhecimento;
- Exportar alerta individual;
- Imprimir alerta individual.

### Campos e personalização
- tabela principal usa campos universais: descrição, status, criticidade, responsável, emitido em, divulgação, tarefas e ações;
- módulo, funcionalidade, montadora, fornecedor, produto, serviço ou outros dados devem ser tratados como campos de contexto personalizáveis;
- fonte do conhecimento fica em detalhe/desdobramento, não como coluna principal do alerta.


## Correção v17.1 — Menu único e alerta simplificado

Ajustes:
- cria `AlertActionsMenu` como componente único para ações de alerta;
- linha da tabela e painel direito usam o mesmo componente de ações;
- menu fecha ao clicar fora;
- remove coluna `Divulgação` da tabela principal;
- divulgação permanece no detalhe do alerta;
- coluna `Tarefas` passa a exibir somente número;
- troca o rótulo visual `Criticidade` por `Prioridade`;
- painel direito de alerta passa a editar Status, Prioridade e Responsável;
- `Desdobramentos do alerta` passa a priorizar divulgações realizadas, tarefas geradas e orientações registradas.


## Correção v17.2 — Alinhamento da tabela de alertas

Ajustes:
- remove conteúdo de divulgação do corpo da tabela principal;
- divulgação permanece apenas no detalhe do alerta;
- coluna `Tarefas` passa a exibir somente valor numérico;
- coluna `Ações` passa a exibir somente ícones e menu;
- remove lápis duplicado nas ações da linha;
- mantém lápis de edição somente no hover da descrição do alerta.


## Versão v18 — Central de Atendimento em conversas

Central de Atendimento alterada de tabela para estrutura operacional inspirada em atendimento/ticket:

- lista lateral de demandas multicanal;
- detalhe central do atendimento com abas;
- painel direito contextual com resumo, SLA, origem, desdobramentos e ações rápidas;
- atendimento pode nascer de WhatsApp, e-mail, portal, API, telefone ou ticket externo;
- campos exibidos variam conforme origem;
- atendimento pode gerar tarefa, alerta, conhecimento e análise de impacto;
- agente aparece como ação auxiliar, sempre com validação do usuário.

### Abas do atendimento
- Solicitação;
- Conversa;
- Atividades;
- Anexos;
- Histórico;
- Desdobramentos;
- Base de Conhecimento.

### Campos universais
- ID do atendimento;
- canal;
- origem da demanda;
- cliente/organização;
- assunto;
- status;
- prioridade;
- responsável;
- fila/equipe;
- recebido em;
- última interação;
- SLA;
- desdobramentos gerados.

### Diretriz de produto
Central de Atendimento não é apenas chat. Ela é caixa de entrada multicanal com contexto operacional, ações futuras e rastreabilidade.


## Correção v18.1 — Central de Atendimento mais operacional

Ajustes:
- remove botões textuais `Detalhes` e `Expandir` do cabeçalho do atendimento;
- troca por ícones no padrão das demais telas;
- reduz abas da Central de Atendimento para `Conversa` e `Anexos`;
- conversa passa a ser a visão inicial;
- remove `Atividades`, `Desdobramentos`, `Solicitação` e `Base de Conhecimento` como abas da tela principal;
- adiciona modal `Gerar ação` para criar tarefa, alerta, conhecimento, solicitação, impacto, orientação ou acionar agente;
- remove bloco gerencial de desdobramentos do painel direito;
- mantém apenas contagem discreta de ações vinculadas na origem da demanda;
- cria componente `CollapsibleKpiSection` para recolher/expandir indicadores;
- aplica seção de indicadores recolhível nas telas principais.


## Correção v18.2 — Atendimento sem painel global

Ajustes:
- Central de Atendimento não aciona mais o painel direito global da aplicação;
- remove o ícone de abrir detalhes no painel global;
- mantém a operação no painel interno da própria Central de Atendimento;
- troca exemplo `HDK` por número próprio automático de atendimento `ATD-YYYYMMDD-0001`;
- prioridade fica registrada no bloco interno `Resumo` como `Prioridade do atendimento`.


## Correção v18.3 — Atendimentos operacionais

Ajustes:
- renomeia a seção lateral de `Demandas` para `Atendimentos`;
- remove as abas `Todas` e `SLA`;
- mantém apenas `Novos` e `Em andamento`;
- atendimentos `Aguardando resposta` entram na visão `Em andamento`;
- concluídos, cancelados e históricos devem ser consultados via relatórios/consultas;
- SLA passa a ser informação/sinalizador do atendimento, não aba operacional.


## v19 — Consolidação visual e estrutural antes dos inserts

Ajustes consolidados:
- remove `Mapa de Impactos` do menu lateral;
- impacto passa a ser tratado como campo/qualificação dentro de análise/tarefa;
- Área de Trabalho fica sem recolher indicadores;
- demais telas mantêm indicadores antes das abas/filtros, com recolher/expandir somente por ícone;
- remove textos de recolher/expandir de indicadores;
- compacta os topos das telas, removendo subtítulos operacionais;
- troca títulos internos para nomes de funcionalidade:
  - Conhecimentos registrados
  - Alertas
  - Atendimentos
  - Tarefas
  - Administração
- remove abas `Fontes` e `Análises` da Base de Conhecimento;
- mantém fontes, análise e monitoramento dentro do detalhe/modal do conhecimento;
- ajusta Central de Atendimento para lista operacional `Novos` e `Em andamento`;
- remove `Todas` e `SLA` da lista operacional de atendimentos;
- padroniza Roadmap como lista de tarefas efetivas;
- Roadmap passa a usar colunas: Descrição da tarefa, Origem, Status, Prioridade, Responsável, Prazo e Ações;
- Roadmap ganha indicadores operacionais e abas de consulta;
- Parametrização passa a prever Administração, Cadastros, Integrações, Agentes, Campos de contexto, Modelos de tela e Preferências;
- menu lateral passa a recolher/expandir por ícone.


## v19.1 — Correção Central de Atendimento

Correção:
- adiciona o estado `inboxStatus` usado nas abas operacionais `Novos` e `Em andamento`;
- corrige erro de renderização da Central de Atendimento ao abrir a tela.
