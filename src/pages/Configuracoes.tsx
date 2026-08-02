import { Building2, KeyRound, SlidersHorizontal } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';

const configGroups = [
  {
    title: 'Ambiente atual',
    description: 'Dados do ambiente operacional liberado para o cliente.',
    icon: Building2,
    items: ['Nome do ambiente', 'Plano contratado', 'Status do ambiente', 'Domínio e identificação visual'],
  },
  {
    title: 'Parâmetros operacionais',
    description: 'Configurações gerais usadas pelas funcionalidades do cliente.',
    icon: SlidersHorizontal,
    items: ['Prazos padrão', 'Responsáveis padrão', 'Regras de exibição', 'Preferências de operação'],
  },
  {
    title: 'Permissões gerais',
    description: 'Regras de acesso aplicadas aos usuários do ambiente.',
    icon: KeyRound,
    items: ['Perfis administrativos', 'Ações sensíveis', 'Aprovação humana', 'Bloqueios operacionais'],
  },
];

export function Configuracoes() {
  return (
    <>
      <PageHeader title="Administração" />

      <section className="admin-clean-grid">
        {configGroups.map((group) => {
          const Icon = group.icon;

          return (
            <article className="card admin-clean-card" key={group.title}>
              <div className="admin-clean-icon"><Icon size={24} /></div>
              <div>
                <h3>{group.title}</h3>
                <p>{group.description}</p>
              </div>
              <div className="admin-clean-list">
                {group.items.map((item) => (
                  <button key={item}>
                    <span>{item}</span>
                    <Badge tone="blue">Configuração</Badge>
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <section className="card admin-clean-note">
        <h3>Regra da aplicação cliente</h3>
        <p>
          Esta tela exibe somente configurações operacionais do ambiente do cliente. Planos, clientes,
          liberações globais, marketplace de modelos e serviços nativos pertencem à intranet/plataforma.
        </p>
      </section>
    </>
  );
}

export default Configuracoes;
