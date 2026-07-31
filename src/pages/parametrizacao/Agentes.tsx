import { PageHeader } from '../../components/PageHeader';
import { KpiCard } from '../../components/KpiCard';

export function Agentes() {
  return (
    <>
      <PageHeader title="Agentes" action={<button className="secondary-btn">Novo registro</button>} />

      <div className="kpi-grid four">
        <KpiCard label="Ativos" value="0" trend="aguardando conexão" tone="green" />
        <KpiCard label="Em análise" value="0" trend="sem pendência" tone="blue" />
        <KpiCard label="Pendentes" value="0" trend="sem atraso" tone="orange" />
        <KpiCard label="Arquivados" value="0" trend="histórico" tone="purple" />
      </div>

      <section className="workspace-settings-panel">
        <div className="workspace-settings-header">
          <div>
            <h2>Agentes</h2>
            <p>Parametrização de papéis, limites, permissões e uso dos agentes no produto.</p>
          </div>
          <span className="badge badge-blue">Funcionalidade</span>
        </div>

        <div className="governance-grid">
          <div className="governance-card">
            <strong>Conhecedor / Mapeador</strong>
            <span>Lê conhecimento e estrutura respostas com base nas fontes autorizadas.</span>
            <small>Ativo</small>
          </div>
          <div className="governance-card">
            <strong>PO / Produto</strong>
            <span>Apoia requisitos, notas técnicas, manuais, TRs, Jira e BI.</span>
            <small>Planejado</small>
          </div>
          <div className="governance-card">
            <strong>Suporte / Atendimento</strong>
            <span>Apoia triagem, respostas, chatbot e encaminhamento.</span>
            <small>Planejado</small>
          </div>
          <div className="governance-card">
            <strong>Construtor / Configurador</strong>
            <span>Ajuda usuários a criar campos, telas e configurações permitidas.</span>
            <small>Planejado</small>
          </div>
        </div>
      </section>

      <section className="card roadmap-card">
        <div className="section-title-row">
          <h3>Itens cadastrados</h3>
          <span className="small-muted">0 registros</span>
        </div>
        <p className="empty-note">Tela estruturada para a próxima etapa de modelagem e conexão com Supabase.</p>
      </section>
    </>
  );
}
