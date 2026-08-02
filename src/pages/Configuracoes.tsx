import { Building2, CheckCircle2, Cog, Database, LockKeyhole, MonitorCog, SlidersHorizontal } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import type { PageProps } from '../App';

const settings = [
  { icon: <MonitorCog size={20} />, title: 'Ambiente do cliente', description: 'Consulta do ambiente de produção, identificação do cliente e status de operação.', value: 'Produção' },
  { icon: <SlidersHorizontal size={20} />, title: 'Parâmetros operacionais', description: 'Regras gerais de funcionamento liberadas para este ambiente.', value: 'Configuração local' },
  { icon: <LockKeyhole size={20} />, title: 'Permissões recebidas da plataforma', description: 'Recursos disponíveis conforme plano, contrato e liberações da intranet.', value: 'Somente leitura' },
  { icon: <Database size={20} />, title: 'Serviços nativos', description: 'Recursos da plataforma, como CEP, geolocalização e mapas, consumidos sem configuração do cliente.', value: 'Gerenciado pela plataforma' },
  { icon: <Building2 size={20} />, title: 'Organização', description: 'Dados gerais da organização usados pela aplicação cliente.', value: 'Ambiente atual' },
  { icon: <CheckCircle2 size={20} />, title: 'Validações do ambiente', description: 'Checklist de configuração mínima para uso do sistema.', value: 'Em revisão' },
];

export function Configuracoes(_: PageProps) {
  return (
    <>
      <PageHeader title="Administração" />

      <section className="card settings-list-card">
        <div className="section-title-row">
          <div>
            <h3>Configurações administrativas</h3>
            <p className="section-description">Consulte e ajuste parâmetros do ambiente do cliente. Liberações comerciais, planos e serviços nativos são controlados pela plataforma.</p>
          </div>
        </div>

        <div className="settings-list">
          {settings.map((item) => (
            <button key={item.title} className="settings-list-item">
              <span className="settings-list-icon">{item.icon}</span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              <em>{item.value}</em>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

export default Configuracoes;
