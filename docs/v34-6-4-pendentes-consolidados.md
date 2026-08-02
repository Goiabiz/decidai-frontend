# v34.6.4 — pendências consolidadas

Inclui os pontos que ficaram fora do hotfix v34.6.3:
- Novo canal, Novo atendimento, Novo agente e Criar tarefa funcionais com modal interno.
- Exportação padrão XLS/PDF com orientação retrato/paisagem para PDF.
- Relatórios padrões sem Novo registro e sem indicadores grandes, mantendo totalizadores.
- Relatório personalizado com busca reativa e 10 campos em ordem alfabética.
- Serviços sem indicadores, em lista com modais.
- Administração em lista agrupada, sem liberações da plataforma.
- Agentes sem configuração manual de tokens/execuções.
- Integrações em seções expandidas com favicon das marcas quando disponível.
- Widget flutuante do assistente da plataforma no canto inferior direito.
- Correção preventiva do import inválido “Canais de Atendimento”.

Aplicação:
```powershell
node scripts/apply-v34-6-4-pendentes-consolidados.cjs
npm run build
npm run dev
node scripts/audit-v34-6-4-pendentes-consolidados.cjs
```
