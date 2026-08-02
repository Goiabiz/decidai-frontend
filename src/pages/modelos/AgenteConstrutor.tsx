import { Bot, CheckCircle2, FileText, Layers, PlayCircle, Plus, Sparkles, Wand2 } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/Badge';

const steps = [
  'Selecionar mercado e tipo de operação',
  'Simular persona, dores e fluxo operacional',
  'Sugerir telas, campos, regras e relatórios',
  'Gerar rascunhos para aprovação do PO',
  'Publicar modelo na base do produto',
];

const suggestions = [
  { title: 'Tela de solicitação', detail: 'Cadastro principal com status, responsável, prazo, anexos e histórico.' },
  { title: 'Fluxo de triagem', detail: 'Entrada, classificação, validação, encaminhamento e encerramento.' },
  { title: 'Agente de atendimento', detail: 'Tom claro, coleta de dados mínimos e transbordo quando necessário.' },
];

export function AgenteConstrutor() {
  return (
    <>
      <PageHeader title="Agente Construtor" action={<button className="primary-small"><PlayCircle size={16} /> Simular cenário</button>} />

      <section className="card builder-hero-card">
        <div>
          <Badge tone="purple">v33</Badge>
          <h3>Agente para criar modelos reutilizáveis</h3>
          <p>Simula cenários de mercado e cria rascunhos de telas, campos, fluxos e agentes para acelerar implantação dos clientes.</p>
        </div>
        <div className="builder-bot"><Bot size={42} /></div>
      </section>

      <section className="builder-grid">
        <section className="card builder-flow-card">
          <h3><Wand2 size={18} /> Processo de construção</h3>
          <ol>{steps.map((step) => <li key={step}>{step}</li>)}</ol>
        </section>

        <section className="card builder-suggestions-card">
          <h3><Sparkles size={18} /> Sugestões geradas</h3>
          {suggestions.map((item) => (
            <article key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </article>
          ))}
        </section>
      </section>

      <section className="card builder-rules-card">
        <h3><CheckCircle2 size={18} /> Governança</h3>
        <div className="builder-rule-list">
          <span><FileText size={16} /> Gera rascunho, não publica sozinho</span>
          <span><Layers size={16} /> Vincula modelo à base do produto</span>
          <span><Plus size={16} /> Pode sugerir melhorias a partir de clientes reais</span>
        </div>
      </section>
    </>
  );
}

export default AgenteConstrutor;
