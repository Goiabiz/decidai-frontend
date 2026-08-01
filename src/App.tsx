import { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { RightPanel, type PanelDetail } from './components/RightPanel';
import { DetailModal } from './components/DetailModal';
import { Dashboard } from './pages/Dashboard';
import { Alertas } from './pages/Alertas';
import { AnaliseAcoes } from './pages/AnaliseAcoes';
import { BaseConhecimento } from './pages/BaseConhecimento';
import { CentralAtendimento } from './pages/CentralAtendimento';
import { Configuracoes } from './pages/Configuracoes';
import { Integracoes } from './pages/Integracoes';
import { Agentes } from './pages/parametrizacao/Agentes';
import { Canais } from './pages/parametrizacao/Canais';
import { CamposContexto } from './pages/cadastros/CamposContexto';
import { FormulariosTelas } from './pages/cadastros/FormulariosTelas';
import { Preferencias } from './pages/parametrizacao/Preferencias';
import { RelatorioAuditoria } from './pages/relatorios/RelatorioAuditoria';
import { RelatorioAtendimentos } from './pages/relatorios/RelatorioAtendimentos';
import { RelatorioAlertas } from './pages/relatorios/RelatorioAlertas';
import { RelatorioConhecimentos } from './pages/relatorios/RelatorioConhecimentos';
import { RelatorioIntegracoes } from './pages/relatorios/RelatorioIntegracoes';
import { RelatorioTarefas } from './pages/relatorios/RelatorioTarefas';
import { SegurancaAuditoria } from './pages/parametrizacao/SegurancaAuditoria';
import { ServicosFilas } from './pages/central-atendimento/ServicosFilas';
import { UnidadesCentrosCusto } from './pages/cadastros/UnidadesCentrosCusto';
import { Usuarios } from './pages/cadastros/Usuarios';
import { applyWorkspacePreferences, loadWorkspacePreferences } from './lib/preferences';

export type PageKey =
  | 'dashboard'
  | 'cad-usuarios'
  | 'cad-unidades'
  | 'cad-campos'
  | 'cad-formularios'
  | 'base'
  | 'atendimento'
  | 'alertas'
  | 'atendimento-servicos'
  | 'analise'
  | 'param-admin'
  | 'param-integracoes'
  | 'param-agentes'
  | 'param-canais'
  | 'param-preferencias'
  | 'param-seguranca'
  | 'rel-conhecimentos'
  | 'rel-atendimentos'
  | 'rel-alertas'
  | 'rel-tarefas'
  | 'rel-integracoes'
  | 'rel-auditoria';

const rightPanelByPage: Record<PageKey, React.ComponentProps<typeof RightPanel>['variant']> = {
  dashboard: 'dashboard',
  'cad-usuarios': 'config',
  'cad-unidades': 'config',
  'cad-campos': 'config',
  'cad-formularios': 'config',
  base: 'documento',
  atendimento: 'atendimento',
  alertas: 'alerta',
  'atendimento-servicos': 'config',
  analise: 'acao',
  'param-admin': 'config',
  'param-integracoes': 'config',
  'param-agentes': 'config',
  'param-canais': 'config',
  'param-preferencias': 'config',
  'param-seguranca': 'config',
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
};

export function App() {
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

  const handleNavigate = (page: PageKey) => {
    setActivePage(page);
    setSelectedDetail(null);
    setExpandedDetail(null);
    setIsRightPanelVisible(false);
  };

  const pages: Record<PageKey, React.ReactNode> = {
    dashboard: <Dashboard onOpenDetail={setExpandedDetail} />,

    'cad-usuarios': <Usuarios />,
    'cad-unidades': <UnidadesCentrosCusto />,
    'cad-campos': <CamposContexto />,
    'cad-formularios': <FormulariosTelas />,
    base: <BaseConhecimento onSelectDetail={handleSelectDetail} onOpenDetail={setExpandedDetail} />,

    atendimento: <CentralAtendimento onOpenDetail={setExpandedDetail} />,
    alertas: <Alertas onSelectDetail={handleSelectDetail} onOpenDetail={setExpandedDetail} />,
    'atendimento-servicos': <ServicosFilas />,

    analise: <AnaliseAcoes onSelectDetail={handleSelectDetail} onOpenDetail={setExpandedDetail} />,

    'param-admin': <Configuracoes onSelectDetail={handleSelectDetail} onOpenDetail={setExpandedDetail} />,
    'param-integracoes': <Integracoes />,
    'param-agentes': <Agentes />,
    'param-canais': <Canais />,
    'param-preferencias': <Preferencias />,
    'param-seguranca': <SegurancaAuditoria />,

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
    </Layout>
  );
}



