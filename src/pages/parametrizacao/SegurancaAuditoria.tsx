import { PageHeader } from '../../components/PageHeader';
import { KpiCard } from '../../components/KpiCard';

export function SegurancaAuditoria() {
  return (
    <>
      <PageHeader title="Segurança / Auditoria" action={<button className="secondary-btn">Novo registro</button>} />

      <div className="kpi-grid four">
        <KpiCard label="Ativos" value="0" trend="aguardando conexão" tone="green" />
        <KpiCard label="Em análise" value="0" trend="sem pendência" tone="blue" />
        <KpiCard label="Pendentes" value="0" trend="sem atraso" tone="orange" />
        <KpiCard label="Arquivados" value="0" trend="histórico" tone="purple" />
      </div>

      <section className="workspace-settings-panel">
        <div className="workspace-settings-header">
          <div>
            <h2>Segurança / Auditoria</h2>
            <p>Controle de logs, ações sensíveis, exportações, acessos externos e auditoria dos agentes.</p>
          </div>
          <span className="badge badge-blue">Funcionalidade</span>
        </div>

        <div className="governance-grid">
          <div className="governance-card">
            <strong>Logs de usuário</strong>
            <span>Inclusões, alterações, exclusões, login, exportações e ações sensíveis.</span>
            <small>Auditoria</small>
          </div>
          <div className="governance-card">
            <strong>Auditoria do agente</strong>
            <span>Consultas, recomendações, fontes usadas e ações propostas.</span>
            <small>IA</small>
          </div>
          <div className="governance-card">
            <strong>Permissões críticas</strong>
            <span>Ações que exigem aprovação, bloqueio ou dupla validação.</span>
            <small>Segurança</small>
          </div>
          <div className="governance-card">
            <strong>Links externos</strong>
            <span>Registro e confirmação de abertura de fontes externas.</span>
            <small>Rastreio</small>
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
