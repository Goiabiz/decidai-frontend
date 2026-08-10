import { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { RightPanel, type PanelDetail } from './components/RightPanel';
import { DetailModal } from './components/DetailModal';
import { AppConfirmModal } from './components/AppConfirmModal';
import { FloatingPlatformAssistant } from './components/FloatingPlatformAssistant';
import { Dashboard } from './pages/Dashboard';
import { Alertas } from './pages/Alertas';
import AnaliseAcoes from './pages/AnaliseAcoes';
import { BaseConhecimento } from './pages/BaseConhecimento';
import { CentralAtendimento } from './pages/CentralAtendimento';
import { FilaChamados } from './pages/central-atendimento/FilaChamados';
import { PortalConfiguracao } from './pages/parametrizacao/PortalConfiguracao';
import { Marketplace } from './pages/parametrizacao/Marketplace';
import { Creditos } from './pages/parametrizacao/Creditos';
import { Configuracoes } from './pages/Configuracoes';
import { Integracoes } from './pages/Integracoes';
import { Agentes } from './pages/parametrizacao/Agentes';
import { Canais } from './pages/parametrizacao/Canais';
import { CamposContexto } from './pages/cadastros/CamposContexto';
import { FormulariosTelas } from './pages/cadastros/FormulariosTelas';
import { Preferencias } from './pages/parametrizacao/Preferencias';
import RelatorioAuditoria from './pages/relatorios/RelatorioAuditoria';
import RelatorioAtendimentos from './pages/relatorios/RelatorioAtendimentos';
import RelatorioAlertas from './pages/relatorios/RelatorioAlertas';
import RelatorioConhecimentos from './pages/relatorios/RelatorioConhecimentos';
import RelatorioIntegracoes from './pages/relatorios/RelatorioIntegracoes';
import RelatorioTarefas from './pages/relatorios/RelatorioTarefas';
import { RelatorioPersonalizado } from './pages/relatorios/RelatorioPersonalizado';
import { SegurancaAuditoria } from './pages/parametrizacao/SegurancaAuditoria';
import { ServicosFilas } from './pages/central-atendimento/ServicosFilas';
import { UnidadesCentrosCusto } from './pages/cadastros/UnidadesCentrosCusto';
import { Usuarios } from './pages/cadastros/Usuarios';
import { MinhaConta } from './pages/MinhaConta';
import { Login } from './pages/Login';
import { PortalCliente } from './pages/portal/PortalCliente';
import { PartnerSubmission } from './pages/PartnerSubmission';
import { ConfirmarAcesso } from './pages/ConfirmarAcesso';
import { useSession } from './contexts/SessionContext';
import { applyWorkspacePreferences, loadWorkspacePreferences } from './lib/preferences';

export type PageKey =
  | 'dashboard'
  | 'minha-conta'
  | 'cad-usuarios'
  | 'cad-unidades'
  | 'cad-campos'
  | 'cad-formularios'
  | 'base'
  | 'atendimento'
  | 'atendimento-fila'
  | 'alertas'
  | 'atendimento-servicos'
  | 'analise'
  | 'param-admin'
  | 'param-integracoes'
  | 'param-agentes'
  | 'param-canais'
  | 'param-portal'
  | 'param-marketplace'
  | 'param-creditos'
  | 'param-preferencias'
  | 'param-seguranca'
  | 'rel-personalizado'
  | 'rel-conhecimentos'
  | 'rel-atendimentos'
  | 'rel-alertas'
  | 'rel-tarefas'
  | 'rel-integracoes'
  | 'rel-auditoria';

const rightPanelByPage: Record<PageKey, React.ComponentProps<typeof RightPanel>['variant']> = {
  dashboard: 'dashboard',
  'minha-conta': 'config',
  'cad-usuarios': 'config',
  'cad-unidades': 'config',
  'cad-campos': 'config',
  'cad-formularios': 'config',
  base: 'documento',
  atendimento: 'atendimento',
  'atendimento-fila': 'atendimento',
  alertas: 'alerta',
  'atendimento-servicos': 'config',
  analise: 'acao',
  'param-admin': 'config',
  'param-integracoes': 'config',
  'param-agentes': 'config',
  'param-canais': 'config',
  'param-portal': 'config',
  'param-marketplace': 'config',
  'param-creditos': 'config',
  'param-preferencias': 'config',
  'param-seguranca': 'config',
  'rel-personalizado': 'config',
  'rel-conhecimentos': 'documento',
  'rel-atendimentos': 'atendimento',
  'rel-alertas': 'alerta',
  'rel-tarefas': 'acao',
  'rel-integracoes': 'config',
  'rel-auditoria': 'config',
};

export type PageProps = {
  onSelectDetail?: (detail: PanelDetail) => void;
  onOpenDetail?: (detail: PanelDetail) => void;
  onNavigate?: (page: PageKey) => void;
};

export function App() {
  const { loading, session } = useSession();
  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const [selectedDetail, setSelectedDetail] = useState<PanelDetail | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<PanelDetail | null>(null);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(false);

  const handleSelectDetail = (detail: PanelDetail) => {
    setSelectedDetail(detail);
    setIsRightPanelVisible(true);
  };

  useEffect(() => {
    applyWorkspacePreferences(loadWorkspacePreferences());
  }, []);

  if (window.location.pathname.startsWith('/portal')) {
    return <PortalCliente />;
  }

  if (window.location.pathname.startsWith('/parceiros')) {
    return <PartnerSubmission />;
  }

  if (window.location.pathname.startsWith('/confirmar-acesso')) {
    return <ConfirmarAcesso />;
  }

  if (loading) {
    return <div className="app-loading">Carregando...</div>;
  }

  if (!session) {
    return <Login />;
  }

  const handleNavigate = (page: PageKey) => {
    setActivePage(page);
    setSelectedDetail(null);
    setExpandedDetail(null);
    setIsRightPanelVisible(false);
  };

  const pages: Record<PageKey, React.ReactNode> = {
    dashboard: <Dashboard onOpenDetail={setExpandedDetail} onNavigate={handleNavigate} />,
    'minha-conta': <MinhaConta />,
    'cad-usuarios': <Usuarios />,
    'cad-unidades': <UnidadesCentrosCusto />,
    'cad-campos': <CamposContexto />,
    'cad-formularios': <FormulariosTelas />,
    base: <BaseConhecimento onSelectDetail={handleSelectDetail} onOpenDetail={setExpandedDetail} />,
    atendimento: <CentralAtendimento onSelectDetail={handleSelectDetail} onOpenDetail={setExpandedDetail} />,
    'atendimento-fila': <FilaChamados />,
    alertas: <Alertas />,
    'atendimento-servicos': <ServicosFilas onSelectDetail={handleSelectDetail} onOpenDetail={setExpandedDetail} />,
    analise: <AnaliseAcoes />,
    'param-admin': <Configuracoes onNavigate={handleNavigate} />,
    'param-integracoes': <Integracoes />,
    'param-agentes': <Agentes />,
    'param-canais': <Canais />,
    'param-portal': <PortalConfiguracao />,
    'param-marketplace': <Marketplace />,
    'param-creditos': <Creditos />,
    'param-preferencias': <Preferencias />,
    'param-seguranca': <SegurancaAuditoria />,
    'rel-personalizado': <RelatorioPersonalizado />,
    'rel-conhecimentos': <RelatorioConhecimentos />,
    'rel-atendimentos': <RelatorioAtendimentos />,
    'rel-alertas': <RelatorioAlertas />,
    'rel-tarefas': <RelatorioTarefas />,
    'rel-integracoes': <RelatorioIntegracoes />,
    'rel-auditoria': <RelatorioAuditoria />,
  };

  return (
    <Layout
      activePage={activePage}
      onNavigate={handleNavigate}
      rightPanel={isRightPanelVisible ? <RightPanel variant={rightPanelByPage[activePage]} detail={selectedDetail} onExpand={setExpandedDetail} onClose={() => setIsRightPanelVisible(false)} /> : undefined}
    >
      {pages[activePage]}
      <DetailModal detail={expandedDetail} onClose={() => setExpandedDetail(null)} />
      <AppConfirmModal />
      <FloatingPlatformAssistant />
    </Layout>
  );
}
