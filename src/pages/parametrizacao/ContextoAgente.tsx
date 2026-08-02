import { Bot, CheckCircle2, Database, Eye, KeyRound, Layers, MousePointerClick, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/Badge';

const contextItems = [
  { icon: <UserRound size={18} />, title: 'Usuário e perfil', text: 'Identifica usuário, perfil, permissões, unidade e papel operacional.' },
  { icon: <Layers size={18} />, title: 'Módulo e funcionalidade', text: 'Informa onde o usuário está atuando dentro da aplicação.' },
  { icon: <MousePointerClick size={18} />, title: 'Registro selecionado', text: 'Permite que o agente entenda o item aberto ou a linha selecionada.' },
  { icon: <Database size={18} />, title: 'Base relacionada', text: 'Relaciona conhecimento ativo, documentos e modelos disponíveis para consulta.' },
  { icon: <KeyRound size={18} />, title: 'Ações permitidas', text: 'Define o que o agente pode responder, sugerir, criar como rascunho ou executar.' },
  { icon: <ShieldCheck size={18} />, title: 'Governança', text: 'Aplica aprovação humana, bloqueios, logs e limites do plano.' },
];

const contextPayload = [
  ['cliente', 'Organização ativa no ambiente de produção'],
  ['usuario', 'Usuário logado e perfil de acesso'],
  ['pagina', 'Tela atual e rota interna'],
  ['modulo', 'Módulo funcional da aplicação'],
  ['funcionalidade', 'Funcionalidade em uso'],
  ['registro', 'Registro selecionado quando existir'],
  ['permissoes', 'Ações liberadas para usuário/agente'],
  ['bases', 'Bases de conhecimento autorizadas'],
];

export function ContextoAgente() {
  return (
    <>
      <PageHeader title="Contexto do Agente" action={<button className="primary-small"><Sparkles size={16} /> Testar contexto</button>} />

      <section className="card agent-context-hero">
        <div>
          <Badge tone="blue">v29</Badge>
          <h3>Camada de contexto operacional</h3>
          <p>O agente deixa de ser apenas um chatbot e passa a receber contexto seguro da tela, do usuário, da funcionalidade e das permissões antes de responder ou sugerir ações.</p>
        </div>
        <div className="agent-context-bot"><Bot size={42} /></div>
      </section>

      <section className="agent-context-grid">
        {contextItems.map((item) => (
          <article className="card agent-context-card" key={item.title}>
            <span>{item.icon}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <section className="card agent-payload-card">
        <div className="section-title-row">
          <div>
            <h3>Payload previsto para o agente</h3>
            <p className="section-description">Estrutura inicial que o frontend poderá enviar ao backend/agente quando o usuário acionar ajuda contextual.</p>
          </div>
          <Badge tone="green">Preparado</Badge>
        </div>
        <div className="payload-list">
          {contextPayload.map(([key, value]) => (
            <div key={key}><code>{key}</code><span>{value}</span></div>
          ))}
        </div>
      </section>

      <section className="card agent-context-flow">
        <h3><Eye size={18} /> Fluxo de uso</h3>
        <ol>
          <li>Usuário aciona o agente dentro de uma tela.</li>
          <li>Frontend envia contexto seguro da tela e do registro.</li>
          <li>Backend valida plano, permissões e limites.</li>
          <li>Agente consulta base autorizada e modelos liberados.</li>
          <li>Agente responde, sugere ação ou cria rascunho com log.</li>
        </ol>
      </section>
    </>
  );
}

export default ContextoAgente;
