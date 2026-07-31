import { PageHeader } from '../../components/PageHeader';
import { KpiCard } from '../../components/KpiCard';

export function CamposContexto() {
  return (
    <>
      <PageHeader title="Campos de Contexto" action={<button className="secondary-btn">Novo registro</button>} />

      <div className="kpi-grid four">
        <KpiCard label="Ativos" value="0" trend="aguardando conexão" tone="green" />
        <KpiCard label="Em análise" value="0" trend="sem pendência" tone="blue" />
        <KpiCard label="Pendentes" value="0" trend="sem atraso" tone="orange" />
        <KpiCard label="Arquivados" value="0" trend="histórico" tone="purple" />
      </div>

      <section className="workspace-settings-panel">
        <div className="workspace-settings-header">
          <div>
            <h2>Campos de Contexto</h2>
            <p>Define dados complementares e tipo de preenchimento para uso em formulários e telas.</p>
          </div>
          <span className="badge badge-blue">Funcionalidade</span>
        </div>

        <div className="governance-grid">
          <div className="governance-card">
            <strong>Tipos de campo</strong>
            <span>Texto, número, data, opção, usuário, unidade, serviço, canal e arquivo.</span>
            <small>Configuração</small>
          </div>
          <div className="governance-card">
            <strong>Regras de preenchimento</strong>
            <span>Máscara, valor padrão, ajuda, placeholder e validação.</span>
            <small>Entrada</small>
          </div>
          <div className="governance-card">
            <strong>Opções dependentes</strong>
            <span>Listas com níveis e dependências entre valores.</span>
            <small>Cascata</small>
          </div>
          <div className="governance-card">
            <strong>Uso controlado</strong>
            <span>O campo é usado quando vinculado a um Formulário/Tela.</span>
            <small>Regra</small>
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
