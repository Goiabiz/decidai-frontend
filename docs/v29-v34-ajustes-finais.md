# v29-v34 — Ajustes finais antes do foco total no agente

## Ajustes pedidos

- Hover do menu lateral reduzido para 1 segundo.
- Base de Conhecimento com exemplos genéricos, sem termos específicos de saúde ou faturamento.
- Remoção do campo `Versão` da seção Fonte na Base de Conhecimento.
- Campos: botões de editar e duplicar agora executam ação.
- Campos: confirmação de exclusão passa a ser modal do sistema, não `window.confirm` do navegador.
- Auditoria atualizada para impedir retorno de `window.confirm`, `replaceAll`, `as any`, BOM e mojibake.
- Scripts antigos de charset podem ser arquivados em `_deprecated_charset_scripts`.

## V29 a V34

### v29 — Contexto do Agente

Inclui tela `Parametrização > Contexto do Agente`, com:

- contexto de usuário/perfil;
- módulo e funcionalidade atual;
- registro selecionado;
- base de conhecimento relacionada;
- permissões e ações permitidas;
- governança, aprovação e limites.

### v30 — Central de Atendimento conectada ao Agente

Mantém a Central de Atendimento como base e documenta o próximo vínculo operacional:

- atendimento aciona agente;
- agente consulta base;
- agente sugere resposta, tarefa, alerta ou conhecimento;
- execução sempre com log.

### v31 — Serviços, Filas e SLA por Canal

Banco preparado com:

- `service_definitions`;
- `service_queues`;
- `service_sla_rules`.

### v32 — Base de Modelos por Mercado

Inclui grupo `Modelos > Mercados` para validar biblioteca de templates por segmento.

### v33 — Agente Construtor

Inclui grupo `Modelos > Construtor`, com a visão do agente que simula cenários e gera modelos reutilizáveis.

### v34 — Início da Intranet/Plataforma

Inclui tela `Plataforma > Intranet` como prévia conceitual. Ela representa o futuro ambiente de controle da plataforma, não a operação do cliente.

## Banco

Inclui:

- `020_agent_context_services_models.sql`;
- `021_platform_intranet_control_base.sql`;
- seed `020_agent_context_services_models_seed.sql`;
- diagnóstico `diagnostico_020_021_contexto_modelos_plataforma.sql`.

## Como aplicar

Extraia o ZIP na raiz do projeto, substituindo os arquivos.

Depois rode:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v29-v34-ajustes-finais.ps1
npm run build
npm run dev
powershell -ExecutionPolicy Bypass -File scripts/audit-v29-v34.ps1
```
