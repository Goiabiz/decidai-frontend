import { useState } from 'react';
import { Building2, CheckCircle2, KeyRound, Save, SlidersHorizontal, UsersRound, X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { showAppToast } from '../lib/appToast';
import type { PageKey } from '../App';

type ConfigItem = {
  label: string;
  target: PageKey;
} | {
  label: string;
  display: true;
} | {
  label: string;
  soon: true;
} | {
  label: string;
  modal: 'responsaveis-padrao';
};

const configGroups: Array<{ title: string; description: string; icon: typeof Building2; items: ConfigItem[] }> = [
  {
    title: 'Ambiente atual',
    description: 'Dados do ambiente operacional liberado para o cliente.',
    icon: Building2,
    items: [
      { label: 'Nome do ambiente', target: 'minha-conta' },
      { label: 'Plano contratado', target: 'minha-conta' },
      { label: 'Status do ambiente', display: true },
      { label: 'Domínio e identificação visual', target: 'param-preferencias' },
    ],
  },
  {
    title: 'Parâmetros operacionais',
    description: 'Configurações gerais usadas pelas funcionalidades do cliente.',
    icon: SlidersHorizontal,
    items: [
      { label: 'Prazos padrão', soon: true },
      { label: 'Responsáveis padrão', modal: 'responsaveis-padrao' },
      { label: 'Regras de exibição', soon: true },
      { label: 'Preferências de operação', soon: true },
    ],
  },
  {
    title: 'Permissões gerais',
    description: 'Regras de acesso aplicadas aos usuários do ambiente.',
    icon: KeyRound,
    items: [
      { label: 'Perfis administrativos', target: 'param-seguranca' },
      { label: 'Ações sensíveis', target: 'param-seguranca' },
      { label: 'Aprovação humana', soon: true },
      { label: 'Bloqueios operacionais', target: 'param-seguranca' },
    ],
  },
];

const responsaveis = ['Moises Mattos', 'SUSi', 'Equipe de Atendimento', 'Equipe de Operação', 'Equipe de Produto'];
const canais = ['Atendimento geral', 'Alertas', 'Tarefas', 'Conhecimento', 'Integrações'];

function ResponsaveisPadraoModal({ onClose }: { onClose: () => void }) {
  const [responsavelGeral, setResponsavelGeral] = useState('Moises Mattos');
  const [responsavelAlertas, setResponsavelAlertas] = useState('SUSi');
  const [canalPadrao, setCanalPadrao] = useState('Atendimento geral');
  const [saved, setSaved] = useState(false);

  const salvar = () => {
    setSaved(true);
    showAppToast('Responsáveis padrão salvos para este ambiente.', 'success');
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="modal-backdrop small-action-modal-backdrop">
      <div className="small-action-modal">
        <div className="user-modal-header">
          <strong>Responsáveis padrão</strong>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="small-action-modal-body">
          <div className="v363-admin-title">
            <span><UsersRound size={22} /></span>
            <p>Defina quem será sugerido inicialmente nas rotinas do ambiente. O usuário ainda poderá alterar durante o uso, quando tiver permissão.</p>
          </div>

          <div className="v363-admin-form">
            <label>
              Responsável geral
              <select value={responsavelGeral} onChange={(event) => setResponsavelGeral(event.target.value)}>
                {responsaveis.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            <label>
              Responsável por alertas
              <select value={responsavelAlertas} onChange={(event) => setResponsavelAlertas(event.target.value)}>
                {responsaveis.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            <label>
              Canal inicial de atendimento
              <select value={canalPadrao} onChange={(event) => setCanalPadrao(event.target.value)}>
                {canais.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>

          <footer className="v363-admin-footer">
            <span>{saved ? <><CheckCircle2 size={16} /> Alterações salvas</> : 'Essas preferências serão usadas apenas como sugestão inicial.'}</span>
            <button className="v363-primary-action" onClick={salvar}><Save size={16} /> Salvar</button>
          </footer>
        </div>
      </div>
    </div>
  );
}

export function Configuracoes({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  const [openModal, setOpenModal] = useState<'responsaveis-padrao' | null>(null);

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
                {group.items.map((item) => {
                  if ('display' in item) {
                    return (
                      <div className="admin-clean-row" key={item.label}>
                        <span>{item.label}</span>
                        <Badge tone="green">Ativo</Badge>
                      </div>
                    );
                  }

                  if ('soon' in item) {
                    return (
                      <div className="admin-clean-row" key={item.label}>
                        <span>{item.label}</span>
                        <Badge tone="yellow">Em breve</Badge>
                      </div>
                    );
                  }

                  if ('modal' in item) {
                    return (
                      <button key={item.label} onClick={() => setOpenModal(item.modal)}>
                        <span>{item.label}</span>
                        <Badge tone="blue">Configurar</Badge>
                      </button>
                    );
                  }

                  return (
                    <button key={item.label} onClick={() => onNavigate(item.target)}>
                      <span>{item.label}</span>
                      <Badge tone="blue">Configuração</Badge>
                    </button>
                  );
                })}
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

      {openModal === 'responsaveis-padrao' && <ResponsaveisPadraoModal onClose={() => setOpenModal(null)} />}
    </>
  );
}

export default Configuracoes;
