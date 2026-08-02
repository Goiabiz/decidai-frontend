import { Building2, CheckCircle2, KeyRound, Layers, Lock, ServerCog, ShieldCheck, Sparkles } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/Badge';

const platformBlocks = [
  { title: 'Clientes e ambientes', text: 'Controle de organizações, ambientes de produção, homologação e contratos.', icon: <Building2 size={20} /> },
  { title: 'Planos e liberações', text: 'Básico, Student, Pro e Enterprise com limites e recursos liberados.', icon: <KeyRound size={20} /> },
  { title: 'Módulos e funcionalidades', text: 'Catálogo global do produto consumido pela aplicação do cliente.', icon: <Layers size={20} /> },
  { title: 'Consumo e cobrança futura', text: 'Tokens, mensagens, agentes, usuários, canais, integrações e armazenamento.', icon: <ServerCog size={20} /> },
  { title: 'Segurança e auditoria', text: 'Logs, limites, bloqueios, LGPD, rastreabilidade e aprovação humana.', icon: <ShieldCheck size={20} /> },
  { title: 'Modelos do produto', text: 'Publicação e versionamento de templates por mercado.', icon: <Sparkles size={20} /> },
];

export function IntranetPlataforma() {
  return (
    <>
      <PageHeader title="Plataforma" />

      <section className="card platform-hero-card">
        <div>
          <Badge tone="orange">v34 · prévia</Badge>
          <h3>Ambiente de controle da plataforma</h3>
          <p>Esta tela representa a futura intranet da plataforma. Ela não substitui a aplicação do cliente; ela controla o que cada ambiente de produção pode consumir.</p>
        </div>
        <Lock size={42} />
      </section>

      <section className="platform-grid">
        {platformBlocks.map((block) => (
          <article className="card platform-block-card" key={block.title}>
            <span>{block.icon}</span>
            <h3>{block.title}</h3>
            <p>{block.text}</p>
          </article>
        ))}
      </section>

      <section className="card platform-rule-card">
        <h3><CheckCircle2 size={18} /> Regra arquitetural</h3>
        <p>A intranet é dona da regra do produto, planos, limites e liberações. A aplicação do cliente apenas consome o que foi liberado para o ambiente contratado.</p>
      </section>
    </>
  );
}

export default IntranetPlataforma;
