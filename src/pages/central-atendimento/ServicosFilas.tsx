import { PageHeader } from '../../components/PageHeader';
import { KpiCard } from '../../components/KpiCard';

export function ServicosFilas() {
  return (
    <>
      <PageHeader title="Serviços e Filas" action={<button className="secondary-btn">Novo registro</button>} />

      <div className="kpi-grid four">
        <KpiCard label="Ativos" value="0" trend="aguardando conexão" tone="green" />
        <KpiCard label="Em análise" value="0" trend="sem pendência" tone="blue" />
        <KpiCard label="Pendentes" value="0" trend="sem atraso" tone="orange" />
        <KpiCard label="Arquivados" value="0" trend="histórico" tone="purple" />
      </div>

      <section className="workspace-settings-panel">
        <div className="workspace-settings-header">
          <div>
            <h2>Serviços e Filas</h2>
            <p>Configuração de tipos de atendimento, filas, fluxo, SLA, canais e ações permitidas.</p>
          </div>
          <span className="badge badge-blue">Funcionalidade</span>
        </div>

        <div className="governance-grid">
          <div className="governance-card">
            <strong>Serviço</strong>
            <span>Tipo de trabalho tratado pela Central de Atendimento.</span>
            <small>Estrutura</small>
          </div>
          <div className="governance-card">
            <strong>Fila</strong>
            <span>Local de tratamento e responsabilidade operacional.</span>
            <small>Operação</small>
          </div>
          <div className="governance-card">
            <strong>Fluxo</strong>
            <span>Caminho do atendimento entre status e filas.</span>
            <small>Processo</small>
          </div>
          <div className="governance-card">
            <strong>SLA</strong>
            <span>Prazos por prioridade, horário e regra de pausa.</span>
            <small>Gestão</small>
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
