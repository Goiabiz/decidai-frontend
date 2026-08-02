# v29.4-v34 — Consolidação Cliente + API Guiada + Agente Operacional

## Objetivo

Fechar a organização conceitual da aplicação de produção do cliente e preparar o produto para a próxima fase: agente real, contexto operacional, API guiada e dados externos em campos/telas.

## Decisões consolidadas

### Aplicação cliente

A aplicação cliente mantém apenas operação e parametrização do ambiente contratado.

Menu recomendado:

```text
Área de Trabalho

Cadastros
- Base de Conhecimento
- Campos
- Telas
- Unidades
- Usuários

Central de Atendimento
- Atendimentos
- Alertas
- Serviços

Roadmap

Parametrização
- Administração
- Agentes
- Canais de Atendimento
- Integrações
- Preferências
- Auditoria

Relatórios
- Alertas
- Atendimentos
- Auditoria
- Conhecimentos
- Integrações
- Tarefas
- Relatório Personalizado
```

Remover da aplicação cliente:

```text
Modelos
Plataforma
Contexto do Agente como item isolado
```

Esses itens pertencem à intranet/plataforma ou ao roadmap futuro.

## Canal x Integração

```text
Canal = uso operacional dentro do produto.
Integração = conexão técnica com sistema externo.
```

Exemplo:

```text
Integração: WhatsApp Business
Canal: Atendimento via WhatsApp
Fluxo: Atendimento via WhatsApp usa integração, agente, fila, SLA e transbordo.
```

## Serviços nativos

Correios/CEP e Maps/Geolocalização são serviços nativos da plataforma, não integrações opcionais do cliente.

## Governo/Saúde

Sistemas produtivos como e-SUS, RNDS, CADSUS, SISAB, BNAFAR, CNES e SIGTAP não entram como conectores padrão. Podem ser conectados via API personalizada se o cliente tiver autorização.

## API personalizada guiada

Fluxo previsto:

```text
1. Cliente informa sistema/API
2. Agente pergunta URL base
3. Agente pergunta autenticação
4. Cliente informa token/chave em área segura
5. Sistema testa conexão
6. Agente identifica endpoints
7. Agente lê amostra de resposta
8. Agente monta dicionário de dados
9. Cliente aprova campos
10. Sistema libera uso em Campos, Telas, Alertas, Relatórios e Agente
```

## Campos com origem externa

Origem do dado:

```text
Manual
Sistema
Fórmula
Integração/API
```

Quando Integração/API:

```text
Integração
Endpoint
Campo externo
Sensível
Usar em tela
Usar em alerta
Usar em relatório
Usar pelo agente
```

## Agentes

Agente não deve escolher “bases” manualmente. Ele consulta o que o fluxo, permissões, canal e contexto autorizarem.

Cadastro do agente:

```text
Identidade
Papel
Tom de voz
Saudação
Prompt / Contexto
Autonomia
Fluxos vinculados
Pontos de uso
Canais/integrações vinculadas
Limites
Testes
Logs
```

## Próxima fase

Depois de validar esse pacote, o foco passa a ser:

```text
Agente real + backend + execução guiada de API + fluxo na Central de Atendimento.
```
