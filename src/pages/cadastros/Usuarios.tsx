import { PageHeader } from '../../components/PageHeader';
import { KpiCard } from '../../components/KpiCard';

export function Usuarios() {
  return (
    <>
      <PageHeader title="Usuários" action={<button className="secondary-btn">Novo registro</button>} />

      <div className="kpi-grid four">
        <KpiCard label="Ativos" value="0" trend="aguardando conexão" tone="green" />
        <KpiCard label="Em análise" value="0" trend="sem pendência" tone="blue" />
        <KpiCard label="Pendentes" value="0" trend="sem atraso" tone="orange" />
        <KpiCard label="Arquivados" value="0" trend="histórico" tone="purple" />
      </div>

      <section className="workspace-settings-panel">
        <div className="workspace-settings-header">
          <div>
            <h2>Usuários</h2>
            <p>Cadastro de pessoas, contatos, lotações, vínculos e acesso operacional.</p>
          </div>
          <span className="badge badge-blue">Funcionalidade</span>
        </div>

        <div className="governance-grid">
          <div className="governance-card">
            <strong>Identificação</strong>
            <span>Nome, CPF, cargo, status e dados principais do usuário.</span>
            <small>Cadastro padrão</small>
          </div>
          <div className="governance-card">
            <strong>Contatos</strong>
            <span>Telefone, e-mail, WhatsApp, Teams, Slack e demais contas digitais.</span>
            <small>Multicanal</small>
          </div>
          <div className="governance-card">
            <strong>Lotações / Vínculos</strong>
            <span>Unidades, filas, funções operacionais e responsabilidades.</span>
            <small>Operacional</small>
          </div>
          <div className="governance-card">
            <strong>Login e Acesso</strong>
            <span>Perfil, permissões, bloqueios, MFA e último acesso.</span>
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
