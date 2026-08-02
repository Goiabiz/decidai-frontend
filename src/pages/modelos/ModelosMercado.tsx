import { BookOpen, Building2, CheckCircle2, Copy, Layers, Plus, Search, Sparkles } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/Badge';

const models = [
  { mercado: 'Atendimento digital', tipo: 'Operação multicanal', telas: 5, campos: 28, agente: 'Atendimento', status: 'Pronto' },
  { mercado: 'Suporte técnico', tipo: 'Triagem e SLA', telas: 6, campos: 34, agente: 'Suporte', status: 'Modelo base' },
  { mercado: 'Gestão comercial', tipo: 'Lead e proposta', telas: 4, campos: 22, agente: 'Comercial', status: 'Em análise' },
  { mercado: 'Operação pública', tipo: 'Solicitação e protocolo', telas: 7, campos: 41, agente: 'Operacional', status: 'Modelo base' },
];

export function ModelosMercado() {
  return (
    <>
      <PageHeader title="Modelos de Mercado" action={<button className="primary-small"><Plus size={16} /> Novo modelo</button>} />

      <section className="card models-hero-card">
        <div>
          <Badge tone="blue">v32</Badge>
          <h3>Base de modelos do produto</h3>
          <p>Biblioteca de modelos prontos para acelerar implantação, sugerir telas, campos, fluxos, agentes e relatórios por segmento.</p>
        </div>
        <Sparkles size={40} />
      </section>

      <section className="card models-table-card">
        <div className="section-title-row">
          <h3>Modelos disponíveis</h3>
          <span className="small-muted">{models.length} modelos</span>
        </div>
        <div className="smart-search agent-search"><Search size={18} /><input placeholder="Buscar mercado, tipo de operação ou agente..." /></div>
        <div className="model-card-grid">
          {models.map((model) => (
            <article key={model.mercado} className="model-market-card">
              <span className="model-icon"><Building2 size={20} /></span>
              <h3>{model.mercado}</h3>
              <p>{model.tipo}</p>
              <div className="model-metrics">
                <span><Layers size={15} /> {model.telas} telas</span>
                <span><BookOpen size={15} /> {model.campos} campos</span>
                <span>{model.agente}</span>
              </div>
              <div className="model-actions">
                <Badge tone={model.status === 'Pronto' ? 'green' : 'blue'}>{model.status}</Badge>
                <button><Copy size={15} /> Usar modelo</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card models-learning-card">
        <h3><CheckCircle2 size={18} /> Regra de aprendizado</h3>
        <p>A base do cliente pode gerar padrões anônimos e consolidados para enriquecer os modelos do produto, respeitando contrato, LGPD, anonimização e aprovação interna.</p>
      </section>
    </>
  );
}

export default ModelosMercado;
