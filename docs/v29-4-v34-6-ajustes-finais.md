# v29.4 até v34.6 — Ajustes finais consolidados

Inclui os apontamentos finais:

- Tema escuro global: topbar, botões, inputs, modais, painéis, tabelas, cards e textos com contraste melhor.
- Canais de Atendimento em lista, com botão Novo canal funcional e modal.
- Agentes com painel lateral até o fim da tela, Novo agente funcional, sem controle manual de tokens/execuções.
- Central de Atendimento tratada como demandas multicanal; botão Novo atendimento funcional; texto genérico Responder.
- Serviços sem indicadores e sem Novo registro; lista de tipos, filas, fluxos e SLA com modais.
- Roadmap/Tarefas com ícones de indicadores contextualizados e botão Criar tarefa funcional.
- Administração sem “liberações da plataforma”; lista agrupada com linguagem mais simples.
- Relatórios padrões sem Novo registro e sem indicadores grandes; exportação padrão com XLS/PDF e orientação no PDF.
- Relatório personalizado com seleção de campos expansível, busca reativa e carregamento dos 10 primeiros por ordem alfabética.
- Integrações em seções expandidas por padrão, sem barra lateral de categorias, usando favicon de marca quando disponível.
- Widget flutuante do assistente da plataforma no canto inferior direito, estilo Rovo.

Aplicação:

```powershell
node scripts/apply-v29-4-v34-6-ajustes-finais.cjs
npm run build
npm run dev
node scripts/audit-v29-4-v34-6-ajustes-finais.cjs
```

Observação: este pacote usa scripts Node e não PowerShell para evitar retorno do problema de charset.
