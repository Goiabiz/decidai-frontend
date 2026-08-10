# Handoff técnico — DecidAI (ex-Radar SUS)

Documento de handoff para a IA responsável por construir os **agentes de IA**. Este repositório (`radar-sus-frontend`) e o banco (`universo-conectasus-db`) são mantidos por outra IA (frontend + backend); este documento descreve o que já existe para que os agentes se conectem sem retrabalho.

## 0. Correção importante: já existe um pacote de agentes — `universo-conectasus-agent`

Ao escrever a primeira versão deste documento eu não tinha visto o repositório irmão `universo-conectasus-agent` (pasta ao lado de `radar-sus-frontend` e `universo-conectasus-db`). Ele **já existe e é substancial** — não é ponto de partida do zero:

- 6 agentes definidos em `src/agents/`: `conhecedor-mapeador`, `po-produto`, `suporte-atendimento`, `radar-monitoramento`, `chatbot-online`, `construtor-configurador` (nessa ordem de fase — o primeiro a ficar pronto é o Conhecedor/Mapeador, conforme `docs/manifesto-agente.md`).
- Conectores já esboçados em `src/connectors/`: discord, email, github, google-drive, jira, supabase, whatsapp.
- Camada de governança em `src/policies/` (`approval-rules.ts`, `blocked-actions.ts`, `permissions.ts`) e serviços em `src/services/` (`action-router`, `agent-registry`, `audit-log`, `context-builder`, `document-loader`, `integration-service`, `knowledge-service`, `llm-service`, `response-builder`, `supabase-log-store`).
- Uma migration própria já aplicada no mesmo banco (`universo-conectasus`): `agent_roles` (6 linhas, uma por agente acima), `agent_sources`, `agent_execution_logs` — hoje só usadas por uma CLI local (`npm run ask:local`), não pelo frontend.
- `docs/produto-arquitetura.md` já descreve, de forma independente, a mesma divisão que eu implementei hoje sob outro nome: "Ambiente Superior/Intranet" (cadastro de clientes, planos, ambientes, integrações e **agentes globais**) vs. "Ambiente do Cliente/Produção Operacional" — equivalente a `usuarios_sistema` (`platform_client_id IS NULL`) vs. `usuarios_cliente` nesta etapa. Os módulos que ele lista (Área de Trabalho, Cadastros, Central de Atendimento, Roadmap, Parametrização, Relatórios) batem com o menu real do app.
- `docs/produto-arquitetura.md` também já lista como pendência futura: "criar banco estruturado dos agentes" — **isso é exatamente o que a migration 020 desta etapa fez** (`client_agents`, `agent_permissions`, `agent_channel_bindings`, `agent_knowledge_scopes`, `agent_usage_events`, `agent_context_events` — ver seção 3). `agent_roles` (pacote agent, já populado) e `client_agents` (banco novo, vazio) não colidem em nome, mas representam o mesmo conceito em dois níveis: `agent_roles` = catálogo global de tipos de agente; `client_agents` = instância desse tipo por cliente. Antes de popular `client_agents`, vale decidir se `client_agents.agent_model` referencia `agent_roles.code`.
- **Antes de escrever qualquer código de agente novo**, leia `universo-conectasus-agent/docs/` inteiro (principalmente `manifesto-agente.md`, `produto-arquitetura.md`, `roadmap-v0.5-v1.4.md`, `governanca-execucao-v1.4.md`) — a visão de produto para os agentes já está documentada lá com bastante detalhe, escrita antes desta etapa.

## 0.1. Plano de negócio (2026-08-02) — modelo comercial e de agentes

O usuário compartilhou dois documentos de plano de negócio no mesmo dia desta etapa (`Plano_Negocio_Roadmap_Radar_SUS_Intranet_Agentes_Atualizado_2026-08-02.md` e `Complemento_Plano_Negocio_Modelagem_Agentes_Aprendizado_Controlado_2026-08-02.md`, compartilhados na conversa, não estão neste repositório como arquivo — peça ao usuário se precisar do texto completo). Pontos que afetam diretamente o trabalho dos agentes:

- **Terminologia oficial**: "Intranet / Plataforma Central" (o que aqui chamei de camada `usuarios_sistema`/`platform_*`) vs. "Ambiente do Cliente" (`usuarios_cliente`). Mesmo conceito, nomes diferentes — considerar adotar "Intranet" como termo de UI se uma área administrativa dedicada for construída.
- **Canal vs. Integração, respondido**: Canal = o que o cliente vê/configura (WhatsApp, E-mail, Widget, Telegram, SMS, Teams, Slack, Discord). Integração = o provedor técnico por trás (Meta WhatsApp API, Blip, Zenvia, Twilio, Gmail, Jira...). Regra: "o cliente pensa em canal, a plataforma controla integração/provedor". Já corresponde ao par `platform_channels`/`client_channels` (canal) vs. `integration_providers` (integração) criado nesta etapa.
- **4 tipos de agente**: (1) **Agente da plataforma** — assistente que ajuda o usuário a usar o produto, widget flutuante, não bloqueia tela (já existe parcialmente como `src/components/FloatingPlatformAssistant.tsx`); (2) **Agente nosso de suporte** — agente interno da Intranet, pode (com autorização, log e mascaramento de dado sensível) conversar diretamente com o agente do cliente para diagnosticar problemas (conversa IA-IA); (3) **Agente nosso de consumo/orquestração** — roteador interno para serviços nativos (transcrição, tradução, etc.), normalmente invisível ao usuário; (4) **Agente do cliente** — criado e nomeado pelo cliente (ex.: ConectaSUS cria "SUSi"), pode haver múltiplos por cliente com papéis diferentes.
- **Modelos comerciais de agente**: Bel (atendimento/relacionamento), Kinho (processos/operação), Biel (suporte técnico/produto/documentação/dev) — são os "planos"/modelos que o cliente contrata e depois renomeia. **Ainda não reconciliado** com os 6 `agent_roles` do pacote `universo-conectasus-agent` (que são um catálogo técnico interno, não voltado à venda) — decidir se Bel/Kinho/Biel mapeiam para um subconjunto de `agent_roles` ou são uma camada comercial separada antes de construir a tela de catálogo de agentes.
- **"Minha Conta" já está conectada** (feito nesta etapa, depois do plano de negócio ser compartilhado): `src/pages/MinhaConta.tsx` + `src/services/account.ts`, item de menu próprio (não fica em Administração). Mostra plano atual, usuários/agentes/canais contratados vs. ativos, tokens/mensagens do mês, e permite trocar de plano (troca restrita a `admin_operadora`/`suporte` — ainda não há fluxo de billing self-service para o cliente trocar sozinho). "Contratar pacote adicional" ainda não está implementado (mostra aviso "fale com o suporte") — depende da área comercial/billing que os documentos do plano de negócio descrevem e que não existe ainda.
- **APIs/serviços nativos da plataforma** (não construído): IA de conversação, transcrição de áudio, voz, tradução, Correios/CEP, Google Maps, e-mail nativo, mensageria — gateways controlados pela Intranet e cobrados por plano/consumo, diferente de uma "integração" que o cliente configura.
- **Aprendizado controlado** (não construído, mas é regra explícita para quando os agentes existirem): nenhuma IA deve aprender livremente em produção sem avaliação, log, versionamento e aprovação (automática para risco baixo, humana para médio/alto). Pipeline: captura → normalização → diagnóstico → simulação → avaliação → sugestão → aprovação → publicação (versionada, com rollback) → monitoramento.

## 1. Arquitetura geral

- **Banco único**: projeto Supabase `universo-conectasus` (ref `ejclkqscqutvhtutextc`). Não existe mais um segundo banco em uso — um projeto `universe-poc` foi uma exploração de arquitetura anterior, seu desenho de multi-tenant/RBAC foi portado para dentro de `universo-conectasus` e o projeto em si **não é mais consumido pelo frontend**.
- **Repositório de banco canônico**: `universo-conectasus-db` (pasta irmã deste repositório) — TODA migration/seed de banco deve ser criada lá, seguindo `database/00_controle/` (convenções, ordem de execução, changelog obrigatório). Não crie migrations soltas dentro do frontend.
- **Frontend**: React 19 + TypeScript + Vite, sem router (troca de página via `useState<PageKey>` em `src/App.tsx`). Cliente Supabase único em `src/lib/supabase.ts` (`universoSupabase`).

### Duas camadas de RBAC — não confundir

| Camada | Prefixo | Para quem | Onde |
|---|---|---|---|
| Regulatória (original) | `seguranca_*` | Equipe interna do pipeline Radar SUS (validar documento, aprovar alerta, PO) | `seguranca_usuarios`, `seguranca_perfis`, `seguranca_permissoes` |
| Produto multi-tenant (nova, desta etapa) | sem prefixo fixo / `platform_*` | Clientes pagantes (multi-tenant) + staff da operadora (suporte/admin) | `usuarios_sistema`, `usuarios_cliente`, `perfis_acesso`, `platform_clients`, `platform_plans` |

Os agentes de IA que forem operar **dentro do produto SaaS** (respondendo clientes, executando ações no ambiente de um cliente) devem usar a camada de produto (`usuarios_sistema`/`usuarios_cliente`/`platform_*`), não `seguranca_*`.

## 2. Autenticação, planos e acesso de suporte

- Login real via **Supabase Auth** (`auth.users` + `auth_user_id` nas tabelas de usuário). Serviço: `src/services/auth.ts`. Sessão: `src/contexts/SessionContext.tsx` (`useSession()`, `usePermission()`).
- `usuarios_sistema`: staff da operadora. `platform_client_id = NULL` = "Operadora" (acesso cross-tenant); `tipo_usuario_sistema` ∈ `suporte | admin_operadora | admin_cliente | operacional`.
- `usuarios_cliente`: usuários finais, sempre vinculados a um `platform_client_id`.
- `platform_plans` (code `basic|pro|enterprise`) + `platform_clients.plano_id`. Ranking de plano hoje é um mapa fixo em código (`PLAN_RANK` em `src/services/auth.ts`) — se os agentes precisarem checar plano, reaproveitem essa mesma lógica ou leiam `platform_plans` diretamente.
- **Acesso de suporte cross-tenant**: suporte nunca é cadastrado em `usuarios_cliente` do cliente acessado. Ao "entrar" num cliente (seletor no topo do app), grava-se apenas um log em `auditoria_usuario` (`cliente_acessado_id`, `acao='acesso_suporte_iniciado'|'acesso_suporte_encerrado'`). Reaproveitem esse padrão se os agentes também precisarem de acesso administrativo cross-tenant auditável.
- RBAC completo: `funcionalidades_sistema` → `permissoes_funcionalidade` → `perfis_acesso` → `perfis_permissoes` → `usuarios_perfis`. Funções `SECURITY DEFINER` `fn_current_usuario_sistema()` e `fn_current_usuario_cliente_platform_client_id()` existem especificamente para evitar recursão de RLS ao checar "quem sou eu" — reaproveitem essas funções em vez de reescrever a lógica.

## 3. Estrutura de dados dos agentes

Tabelas relacionadas a agentes hoje no banco, em duas camadas:

**Já populada (pacote `universo-conectasus-agent`, catálogo global de tipos de agente):**
- `agent_roles` (6 linhas — os 6 agentes do pacote), `agent_sources`, `agent_execution_logs` (log da CLI local, ver seção 0).

**Criada nesta etapa, ainda vazia (camada por cliente/instância):**
- `client_agents` — cadastro do agente **por cliente/ambiente** (nome, modelo, tom de voz, `autonomy_level`, `requires_human_approval`, `execution_limit`, `token_limit`). Provável FK conceitual: `client_agents.agent_model` → `agent_roles.code`.
- `client_channels` + `agent_channel_bindings` — em quais canais (WhatsApp, e-mail, etc., ver `platform_channels`) cada agente atua.
- `agent_permissions` — o que o agente pode fazer por módulo/funcionalidade/ação, com `risk_level` e `requires_approval` (equivalente em banco às regras hoje só em código em `universo-conectasus-agent/src/policies/`).
- `agent_knowledge_scopes` — que base de conhecimento o agente pode ler/sugerir/criar.
- `agent_usage_events` — telemetria de uso (tokens, custo, status) por execução.
- `agent_context_events` — contexto de tela/registro que o agente estava vendo ao ser acionado.
- `service_definitions` / `service_queues` / `service_sla_rules` — regras de fila/SLA que os agentes de atendimento devem respeitar.
- Tabelas legadas (já existiam, ainda com poucas linhas) para susi (assistente atual): `susi_consultas`, `susi_respostas`, `susi_memorias`, `susi_prompts`, `susi_regras_resposta`, `susi_feedbacks`. Avaliar se a nova geração de agentes substitui ou convive com essas.

## 4. Catálogo de conectores

- Fonte única: `integration_providers` (55 conectores reais) + `integration_categories`. O antigo catálogo estático `src/lib/integrationCatalog.ts` (129 itens hardcoded, órfão, nunca importado) foi **removido** nesta etapa — não recriar.
- Campos relevantes: `is_visible_to_client` (aparece pro cliente) / `is_native_product_service` (uso interno da operadora) / `min_plan_code` (gate por plano) / `category_code`.
- **Categoria `agentes_ia`** já foi criada em `integration_categories` especificamente para os conectores/plugins que os agentes forem expor — ao registrar um agente como "conector", use essa categoria em vez de criar uma tela nova.
- Tela de catálogo: `src/pages/parametrizacao/Integracoes.tsx`. Tem um painel de administração (visível só para `tipo_usuario_sistema='admin_operadora'`) para alternar visibilidade/plano/intranet por conector, consumindo `listV35AllProvidersForAdmin`/`updateV35IntegrationProvider` em `src/services/v35Supabase.ts`.

## 5. Convenções confirmadas nesta sessão

- Um arquivo por página: este repositório tem histórico de páginas duplicadas (`src/pages/X.tsx` vs `src/pages/parametrizacao/X.tsx` etc.) de scripts automatizados antigos. Antes de editar, confirme qual cópia está de fato importada em `App.tsx`.
- Não usar scripts `apply-vXX.cjs/.ps1` para gerar código em massa — causaram a maior parte dos bugs de contrato entre arquivos (exports, props) nesta sessão. Editar diretamente.
- Sistema de cores: `--surface`/`--surface-soft`/`--slate-*` em `src/styles/global.css`; sempre com fallback correto quando usar `var(--nome, fallback)`.
- Todo SQL estrutural (`create table`, `alter table`, RLS) vai em `universo-conectasus-db/database/01_migrations/`, numerado sequencialmente, registrado em `database/00_controle/changelog_banco.md`. Seeds em `database/02_seeds/`.
- Branding: nome do produto vem de `src/lib/branding.ts` (`getBrandingConfig().companyName`, default `"DecidAI"`), não hardcoded. Ao adicionar telas novas, sempre puxar daí.

## 6. O que falta (conhecido, não resolvido nesta etapa)

- `client_agents`/`agent_permissions`/etc. estão com schema pronto mas **zero linhas** — é o ponto de entrada esperado para conectar o pacote `universo-conectasus-agent` (que já roda via CLI local) ao produto multi-tenant/frontend de verdade.
- O pacote `universo-conectasus-agent` hoje não tem nenhuma chamada HTTP/API nem é importado pelo frontend — é uma CLI standalone (`npm run ask:local`). Definir como ele passa a ser acionado a partir do produto (Edge Function? serviço separado com API? import direto?) é uma decisão em aberto.
- Não há ranking de plano formalizado no banco (é um mapa fixo no frontend) — se o número de planos crescer, vale migrar para uma coluna `nivel` em `platform_plans`.
- `platform_entitlements`/`servicos_liberados_ambiente`-style (liberação pontual de recurso fora do plano padrão) existe como tabela (`platform_entitlements`) mas ainda não está conectada a nenhuma tela.
- KPIs "Novas tarefas" e "Tarefas por status" no Dashboard (`src/pages/Dashboard.tsx`) são 100% mockados (array fixo no código) — não existe tabela de tarefas no banco ainda.
