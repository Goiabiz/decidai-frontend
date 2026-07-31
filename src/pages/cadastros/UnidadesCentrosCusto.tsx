import { PageHeader } from '../../components/PageHeader';
import { KpiCard } from '../../components/KpiCard';

export function UnidadesCentrosCusto() {
  return (
    <>
      <PageHeader title="Unidades / Centros de Custo" action={<button className="secondary-btn">Novo registro</button>} />

      <div className="kpi-grid four">
        <KpiCard label="Ativos" value="0" trend="aguardando conexão" tone="green" />
        <KpiCard label="Em análise" value="0" trend="sem pendência" tone="blue" />
        <KpiCard label="Pendentes" value="0" trend="sem atraso" tone="orange" />
        <KpiCard label="Arquivados" value="0" trend="histórico" tone="purple" />
      </div>

      <section className="workspace-settings-panel">
        <div className="workspace-settings-header">
          <div>
            <h2>Unidades / Centros de Custo</h2>
            <p>Cadastro de estruturas internas, externas, públicas, institucionais e centros de custo.</p>
          </div>
          <span className="badge badge-blue">Funcionalidade</span>
        </div>

        <div className="governance-grid">
          <div className="governance-card">
            <strong>Estrutura interna</strong>
            <span>Matriz, filial, unidade própria, setor, departamento e equipe.</span>
            <small>Operação</small>
          </div>
          <div className="governance-card">
            <strong>Relacionamento externo</strong>
            <span>Fornecedor, prestador, parceiro, terceiro e órgão externo.</span>
            <small>Relacionamento</small>
          </div>
          <div className="governance-card">
            <strong>Cliente atendido</strong>
            <span>Conta, contrato, unidade atendida e cliente final.</span>
            <small>Atendimento</small>
          </div>
          <div className="governance-card">
            <strong>Saúde / Assistência</strong>
            <span>UBS, UPA, hospital, ambulatório, laboratório e farmácia.</span>
            <small>Template</small>
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
