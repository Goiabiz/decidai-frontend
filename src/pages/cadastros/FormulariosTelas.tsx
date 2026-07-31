import { PageHeader } from '../../components/PageHeader';
import { KpiCard } from '../../components/KpiCard';

export function FormulariosTelas() {
  return (
    <>
      <PageHeader title="Formulários / Telas" action={<button className="secondary-btn">Novo registro</button>} />

      <div className="kpi-grid four">
        <KpiCard label="Ativos" value="0" trend="aguardando conexão" tone="green" />
        <KpiCard label="Em análise" value="0" trend="sem pendência" tone="blue" />
        <KpiCard label="Pendentes" value="0" trend="sem atraso" tone="orange" />
        <KpiCard label="Arquivados" value="0" trend="histórico" tone="purple" />
      </div>

      <section className="workspace-settings-panel">
        <div className="workspace-settings-header">
          <div>
            <h2>Formulários / Telas</h2>
            <p>Define onde campos aparecem, em qual módulo, funcionalidade, bloco e condição.</p>
          </div>
          <span className="badge badge-blue">Funcionalidade</span>
        </div>

        <div className="governance-grid">
          <div className="governance-card">
            <strong>Formulário padrão</strong>
            <span>Modelo protegido do produto, com campos essenciais preservados.</span>
            <small>Produto</small>
          </div>
          <div className="governance-card">
            <strong>Formulário complementar</strong>
            <span>Modelo criado pelo cliente para contexto adicional.</span>
            <small>Cliente</small>
          </div>
          <div className="governance-card">
            <strong>Condições</strong>
            <span>Exibição, obrigatoriedade, edição e visibilidade por regra.</span>
            <small>Dinâmico</small>
          </div>
          <div className="governance-card">
            <strong>Permissão por campo</strong>
            <span>Quem visualiza, preenche, edita ou bloqueia campos.</span>
            <small>Segurança</small>
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
