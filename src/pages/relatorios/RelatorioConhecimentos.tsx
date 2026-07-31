import { PageHeader } from '../../components/PageHeader';
import { KpiCard } from '../../components/KpiCard';

export function RelatorioConhecimentos() {
  return (
    <>
      <PageHeader title="Relatório de Conhecimentos" action={<button className="secondary-btn">Novo registro</button>} />

      <div className="kpi-grid four">
        <KpiCard label="Ativos" value="0" trend="aguardando conexão" tone="green" />
        <KpiCard label="Em análise" value="0" trend="sem pendência" tone="blue" />
        <KpiCard label="Pendentes" value="0" trend="sem atraso" tone="orange" />
        <KpiCard label="Arquivados" value="0" trend="histórico" tone="purple" />
      </div>

      <section className="workspace-settings-panel">
        <div className="workspace-settings-header">
          <div>
            <h2>Relatório de Conhecimentos</h2>
            <p>Consulta consolidada dos conhecimentos registrados, ativos, arquivados e cancelados.</p>
          </div>
          <span className="badge badge-blue">Funcionalidade</span>
        </div>

        <div className="governance-grid">
          <div className="governance-card">
            <strong>Filtros</strong>
            <span>Período, cliente, usuário, status, origem e módulo.</span>
            <small>Consulta</small>
          </div>
          <div className="governance-card">
            <strong>Exportação</strong>
            <span>Preparado para CSV, XLSX e PDF conforme permissão.</span>
            <small>Roadmap</small>
          </div>
          <div className="governance-card">
            <strong>Auditoria</strong>
            <span>Registros vinculados a usuário, data, origem e ação.</span>
            <small>Rastreabilidade</small>
          </div>
          <div className="governance-card">
            <strong>Indicadores</strong>
            <span>Totais, tendências e agrupamentos por período.</span>
            <small>BI</small>
          </div>
        </div>
      </section>

      <section className="card roadmap-card">
        <div className="section-title-row">
          <h3>Resultado da consulta</h3>
          <span className="small-muted">0 registros</span>
        </div>
        <p className="empty-note">Tela estruturada para a próxima etapa de modelagem e conexão com Supabase.</p>
      </section>
    </>
  );
}
