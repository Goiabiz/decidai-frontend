# v29 — Consolidação Parametrização, Integrações, Campos API e Ajustes Finais

## Objetivo

Consolidar a aplicação de produção do cliente antes de avançar para o agente real. Esta versão corrige o menu, reorganiza Parametrização, separa Canal de Integração, prepara API guiada e leva os apontamentos recentes para código, documentação e banco.

## Decisões conceituais

### Aplicação cliente

A aplicação cliente deve conter apenas operação e configuração do ambiente contratado:

- Área de Trabalho
- Cadastros
- Central de Atendimento
- Roadmap
- Parametrização
- Relatórios

### Fora do menu do cliente

Os itens abaixo pertencem à intranet/plataforma e não devem aparecer como módulos operacionais do cliente neste momento:

- Modelos por mercado
- Construtor de modelos
- Plataforma/Intranet
- Planos e liberações globais
- Marketplace de templates
- Serviços nativos da plataforma

## Canal x Integração x Fonte x Serviço Nativo

### Canal

Forma operacional de entrada/saída dentro do produto.

Exemplos:

- Atendimento via WhatsApp
- Atendimento via Widget
- Atendimento via E-mail
- Atendimento interno
- Monitoramento de comunidade

### Integração

Conexão técnica com aplicativo, provedor, plataforma, API, banco, webhook ou arquivo recorrente.

Exemplos:

- WhatsApp Business
- Discord
- Google Drive
- Jira
- Salesforce
- Bling
- API REST personalizada

### Fonte de conhecimento

Origem documental ou informacional que alimenta Base de Conhecimento e agente.

Exemplos:

- Google Drive
- SharePoint
- Confluence
- Notion
- Sites/páginas web
- RSS/Feeds
- Upload manual

### Serviço nativo da plataforma

Serviço controlado pela nossa intranet/plataforma, não configurado como integração opcional pelo cliente.

- Correios / CEP
- Maps / geolocalização / rotas

## Governo e saúde

Sistemas produtivos como e-SUS APS, RNDS, CADSUS, SISAB, BNAFAR, CNES e SIGTAP não entram como conectores padrão da aplicação cliente.

O foco em governo/saúde nesta plataforma é informação e conhecimento:

- páginas oficiais
- portarias
- manuais
- normas
- diários oficiais
- documentos técnicos
- bases públicas informacionais

Se um cliente quiser conectar uma API específica de um sistema produtivo, isso deve entrar como **API personalizada guiada**, não como conector padrão.

## Agentes

A tela de agentes foi ajustada para retirar bases, módulos e ações fixas.

O agente agora deve ser configurado por:

- identidade
- papel/modelo
- tom de voz
- saudação
- prompt/contexto
- autonomia
- limites
- fluxos vinculados
- pontos de uso
- testes
- logs

Regra:

> O agente consulta o que o fluxo, o canal, o contexto e as permissões autorizarem. Ele não escolhe manualmente uma “base” no cadastro.

## Canais de Atendimento

A tela Canais agora representa o canal operacional. Cada canal aponta para:

- integração usada
- agente padrão
- fluxo de atendimento
- fila
- SLA
- regras futuras de transbordo

Exemplo:

```text
Canal: Atendimento via WhatsApp
Integração: WhatsApp Business
Agente: SUSi
Fluxo: Atendimento padrão
Fila: Suporte
SLA: 4h
```

## Integrações por tipo de serviço

A tela Integrações passa a organizar conectores por categoria:

1. Comunicação e mensageria
2. Redes sociais
3. Documentos, arquivos e conhecimento
4. Atlassian, desenvolvimento e produto
5. Gestão de projetos e trabalho
6. CRM, comercial e marketing
7. ERP, estoque, produtos e financeiro
8. Suporte e service desk
9. APIs e conectores customizados
10. Inteligência artificial e voz

Inclui pontos pedidos:

- monday.com
- Trello
- produtos Atlassian: Jira, Jira Service Management, Confluence, Trello e Bitbucket
- Bling
- CRMs como Salesforce, HubSpot, Pipedrive, RD Station, Zoho CRM, Agendor, PipeRun, Kommo
- Redes X/Twitter e Threads
- API REST personalizada
- API GraphQL personalizada
- Webhooks
- Bancos e arquivos recorrentes

## API personalizada guiada pelo agente

Fluxo previsto:

1. Cliente informa sistema/API
2. Agente pergunta URL base
3. Agente pergunta tipo de autenticação
4. Cliente informa credencial em área segura
5. Backend testa conexão
6. Agente identifica endpoints
7. Agente lê amostra de resposta
8. Agente monta dicionário de dados
9. Cliente aprova campos
10. Sistema libera campos para Telas, Alertas, Relatórios e Agente

## Campos com origem externa

A tela Campos passa a prever origem do dado:

- Manual
- Sistema
- Calculado/Fórmula
- Integração/API

Quando a origem for Integração/API, o campo pode apontar para:

- integração
- endpoint
- campo externo
- modo de atualização
- cache
- sensibilidade
- uso em alerta
- uso em relatório
- uso pelo agente

## Telas personalizadas

Roadmap técnico: o builder de telas deverá permitir arrastar campos por origem:

- Sistema
- Personalizados
- Calculados
- Integrações/API

Exemplo:

```text
Bling / Produtos / Saldo estoque
Salesforce / Oportunidades / Etapa do funil
API personalizada / Pedidos / Status
```

## Administração

A tela Administração não é dashboard.

Removido conceitualmente:

- botão Nova parametrização
- indicadores
- seção de governança administrativa

Novo foco:

- ambiente do cliente
- parâmetros operacionais
- permissões recebidas da plataforma
- serviços nativos
- organização
- validações do ambiente

## Preferências

Preferências passa para layout em lista:

- aparência
- nome no menu
- logo
- idioma
- formato de data/hora
- notificações

## Auditoria

Nome ajustado para Auditoria.

Removido:

- indicadores
- botão novo registro

Foco:

- logs de usuário
- logs do agente
- ações sensíveis
- integrações
- exportações
- filtros

## Alertas

Ajustado para:

- botão Cadastrar alerta no padrão verde
- criação com canais de disparo
- canais vinculados às integrações/canais configurados
- lista sem edição direta em coluna

## Relatórios

Incluída base para Relatório Personalizado:

- escolher origem
- escolher campos
- escolher filtros
- escolher agrupamentos
- exportar XLS
- exportar PDF em paisagem

## Banco

Nova migration:

- `022_external_api_dictionary.sql`

Cria/prepara:

- `external_connections`
- `external_connection_credentials`
- `external_api_endpoints`
- `external_api_fields`
- `custom_field_external_mapping`
- `external_api_cache`
- `external_api_logs`
- `integration_catalog`

Seed:

- `022_integration_catalog_seed.sql`

Diagnóstico:

- `diagnostico_022_integracoes_api_campos.sql`

## Próximo foco após validação

Depois de validar essa consolidação:

1. aplicar migration/seed 022;
2. validar Integrações, Canais, Agentes e Campos;
3. focar no agente real com contexto, fluxo de atendimento e API guiada.
