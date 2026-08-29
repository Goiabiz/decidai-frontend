import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { PlanosPrecificacao } from './pages/parametrizacao/PlanosPrecificacao';
import { Configuracoes } from './pages/Configuracoes';
import { Integracoes } from './pages/parametrizacao/Integracoes';
import { Agentes, CLIENT_AGENT_STATUS_EVENT } from './pages/parametrizacao/Agentes';
import { getActiveClientAgent, type AgentRecord } from './services/canaisAgentes';
import { ConectoresCredenciais } from './pages/parametrizacao/ConectoresCredenciais';
import { Canais } from './pages/parametrizacao/Canais';
import { CamposContexto } from './pages/cadastros/CamposContexto';
import { FormulariosTelas } from './pages/cadastros/FormulariosTelas';
import { EnterpriseKnowledgeIntranet } from './pages/intranet/EnterpriseKnowledgeIntranet';
import { ObjetosDinamicos } from './pages/ObjetosDinamicos';
import { Preferencias } from './pages/parametrizacao/Preferencias';
import RelatorioAuditoria from './pages/relatorios/RelatorioAuditoria';
import RelatorioAtendimentos from './pages/relatorios/RelatorioAtendimentos';
import RelatorioSLA from './pages/relatorios/RelatorioSLA';
import RelatorioAlertas from './pages/relatorios/RelatorioAlertas';
import RelatorioConhecimentos from './pages/relatorios/RelatorioConhecimentos';
import RelatorioIntegracoes from './pages/relatorios/RelatorioIntegracoes';
import RelatorioTarefas from './pages/relatorios/RelatorioTarefas';
import RelatorioTrabalho from './pages/relatorios/RelatorioTrabalho';
import { RelatorioPersonalizado } from './pages/relatorios/RelatorioPersonalizado';
import { Decisoes } from './pages/Decisoes';
import { SegurancaAuditoria } from './pages/parametrizacao/SegurancaAuditoria';
import { ServicosFilas } from './pages/central-atendimento/ServicosFilas';
import { Flows } from './pages/Flows';
import { Reputacao } from './pages/Reputacao';
import { EngajamentoSocial } from './pages/EngajamentoSocial';
import { CampanhasMarketing } from './pages/CampanhasMarketing';
import { Concorrentes } from './pages/Concorrentes';
import { CrmContatos } from './pages/crm/Contatos';
import { CrmPipeline } from './pages/crm/Pipeline';
import { UnidadesCentrosCusto } from './pages/cadastros/UnidadesCentrosCusto';
import { Usuarios } from './pages/cadastros/Usuarios';
import { MinhaConta } from './pages/MinhaConta';
import { CentralAjuda } from './pages/CentralAjuda';
import { Login } from './pages/Login';
import { CriarConta } from './pages/CriarConta';
import { AguardandoAprovacao } from './pages/AguardandoAprovacao';
import { PortalCliente } from './pages/portal/PortalCliente';
import { PartnerSubmission } from './pages/PartnerSubmission';
import { ConfirmarAcesso } from './pages/ConfirmarAcesso';
import { GithubAppCallback } from './pages/GithubAppCallback';
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
  | 'flows'
  | 'market-reputacao'
  | 'market-social'
  | 'market-campanhas'
  | 'market-concorrentes'
  | 'crm-contatos'
  | 'crm-pipeline'
  | 'analise'
  | 'decisoes'
  | 'param-admin'
  | 'param-integracoes'
  | 'param-agentes'
  | 'param-conectores'
  | 'param-canais'
  | 'param-portal'
  | 'param-marketplace'
  | 'param-creditos'
  | 'param-planos'
  | 'param-preferencias'
  | 'param-seguranca'
  | 'rel-personalizado'
  | 'rel-conhecimentos'
  | 'rel-atendimentos'
  | 'rel-sla-atendimento'
  | 'rel-alertas'
  | 'rel-tarefas'
  | 'rel-integracoes'
  | 'rel-auditoria'
  | 'rel-work-items'
  | 'intranet-conhecimento'
  | 'objetos-dinamicos'
  | 'ajuda';

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
  flows: 'config',
  'market-reputacao': 'config',
  'market-social': 'config',
  'market-campanhas': 'config',
  'market-concorrentes': 'config',
  'crm-contatos': 'config',
  'crm-pipeline': 'config',
  analise: 'acao',
  decisoes: 'acao',
  'param-admin': 'config',
  'param-integracoes': 'config',
  'param-agentes': 'config',
  'param-conectores': 'config',
  'param-canais': 'config',
  'param-portal': 'config',
  'param-marketplace': 'config',
  'param-creditos': 'config',
  'param-planos': 'config',
  'param-preferencias': 'config',
  'param-seguranca': 'config',
  'rel-personalizado': 'config',
  'rel-conhecimentos': 'documento',
  'rel-atendimentos': 'atendimento',
  'rel-sla-atendimento': 'atendimento',
  'rel-alertas': 'alerta',
  'rel-tarefas': 'acao',
  'rel-integracoes': 'config',
  'rel-auditoria': 'config',
  'rel-work-items': 'acao',
  'intranet-conhecimento': 'documento',
  'objetos-dinamicos': 'config',
  ajuda: 'config',
};

export type PageProps = {
  onSelectDetail?: (detail: PanelDetail) => void;
  onOpenDetail?: (detail: PanelDetail) => void;
  onNavigate?: (page: PageKey) => void;
};

const PAGE_KEYS = new Set(Object.keys(rightPanelByPage) as PageKey[]);

// Reforma de arquitetura 29/08: antes, activePage era só useState, sem URL própria -- sem link
// compartilhável, sem voltar/avançar do navegador funcionando. Mudança mínima (não reestrutura
// as 44 páginas em <Route> uma por uma): a URL vira a fonte de verdade de qual PageKey está
// ativa, mas o mapa `pages` continua igual, só trocando de onde ele lê o valor.
function pageKeyFromPathname(pathname: string): PageKey {
  const segment = pathname.replace(/^\//, '').split('/')[0];
  return PAGE_KEYS.has(segment as PageKey) ? (segment as PageKey) : 'dashboard';
}

export function App() {
  const { loading, session } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = useMemo(() => pageKeyFromPathname(location.pathname), [location.pathname]);
  const [selectedDetail, setSelectedDetail] = useState<PanelDetail | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<PanelDetail | null>(null);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(false);
  const [activeClientAgent, setActiveClientAgent] = useState<AgentRecord | null>(null);

  const handleSelectDetail = (detail: PanelDetail) => {
    setSelectedDetail(detail);
    setIsRightPanelVisible(true);
  };

  useEffect(() => {
    applyWorkspacePreferences(loadWorkspacePreferences());
  }, []);

  // Ícone do agente de cliente ativado (Parametrização > Agentes) precisa ficar disponível em
  // QUALQUER tela pra QUALQUER usuário do ambiente, não só enquanto alguém está na tela
  // Agentes -- achado real testando ao vivo (usuário: "isso não é funcional"). Busca 1x por
  // troca de tenant + reage na hora quando alguém ativa/desativa em Agentes (mesma aba),
  // via CLIENT_AGENT_STATUS_EVENT -- sem precisar de reload.
  const clientId = session?.activeClientId;
  useEffect(() => {
    if (!clientId) { setActiveClientAgent(null); return; }
    let cancelled = false;
    const refresh = () => { void getActiveClientAgent(clientId).then((agent) => { if (!cancelled) setActiveClientAgent(agent); }); };
    refresh();
    window.addEventListener(CLIENT_AGENT_STATUS_EVENT, refresh);
    return () => { cancelled = true; window.removeEventListener(CLIENT_AGENT_STATUS_EVENT, refresh); };
  }, [clientId]);

  if (window.location.pathname.startsWith('/portal')) {
    return <PortalCliente />;
  }

  if (window.location.pathname.startsWith('/parceiros')) {
    return <PartnerSubmission />;
  }

  if (window.location.pathname.startsWith('/confirmar-acesso')) {
    return <ConfirmarAcesso />;
  }

  if (window.location.pathname.startsWith('/criar-conta')) {
    return <CriarConta />;
  }

  if (window.location.pathname.startsWith('/parametrizacao/conectores/github/callback')) {
    return <GithubAppCallback />;
  }

  if (loading) {
    return <div className="app-loading">Carregando...</div>;
  }

  if (!session) {
    return <Login />;
  }

  if (session.user.kind === 'cliente' && session.user.status === 'Solicitação') {
    return <AguardandoAprovacao />;
  }

  const handleNavigate = (page: PageKey) => {
    navigate(`/${page}`);
    setSelectedDetail(null);
    setExpandedDetail(null);
    setIsRightPanelVisible(false);
  };

  const pages: Record<PageKey, React.ReactNode> = {
    dashboard: <Dashboard onOpenDetail={setExpandedDetail} onNavigate={handleNavigate} />,
    'minha-conta': <MinhaConta />,
    'cad-usuarios': <Usuarios onSelectDetail={handleSelectDetail} onOpenDetail={setExpandedDetail} />,
    'cad-unidades': <UnidadesCentrosCusto />,
    'cad-campos': <CamposContexto />,
    'cad-formularios': <FormulariosTelas />,
    base: <BaseConhecimento onSelectDetail={handleSelectDetail} onOpenDetail={setExpandedDetail} />,
    atendimento: <CentralAtendimento onSelectDetail={handleSelectDetail} onOpenDetail={setExpandedDetail} />,
    'atendimento-fila': <FilaChamados />,
    alertas: <Alertas />,
    'atendimento-servicos': <ServicosFilas onSelectDetail={handleSelectDetail} onOpenDetail={setExpandedDetail} />,
    flows: <Flows />,
    'market-reputacao': <Reputacao />,
    'market-social': <EngajamentoSocial />,
    'market-campanhas': <CampanhasMarketing />,
    'market-concorrentes': <Concorrentes />,
    'crm-contatos': <CrmContatos />,
    'crm-pipeline': <CrmPipeline />,
    analise: <AnaliseAcoes />,
    decisoes: <Decisoes />,
    'param-admin': <Configuracoes onNavigate={handleNavigate} />,
    'param-integracoes': <Integracoes />,
    'param-agentes': <Agentes />,
    'param-conectores': <ConectoresCredenciais />,
    'param-canais': <Canais />,
    'param-portal': <PortalConfiguracao />,
    'param-marketplace': <Marketplace />,
    'param-creditos': <Creditos />,
    'param-planos': <PlanosPrecificacao />,
    'param-preferencias': <Preferencias />,
    'param-seguranca': <SegurancaAuditoria />,
    'rel-personalizado': <RelatorioPersonalizado />,
    'rel-conhecimentos': <RelatorioConhecimentos />,
    'rel-atendimentos': <RelatorioAtendimentos />,
    'rel-sla-atendimento': <RelatorioSLA />,
    'rel-alertas': <RelatorioAlertas />,
    'rel-tarefas': <RelatorioTarefas />,
    'rel-integracoes': <RelatorioIntegracoes />,
    'rel-auditoria': <RelatorioAuditoria />,
    'rel-work-items': <RelatorioTrabalho />,
    'intranet-conhecimento': <EnterpriseKnowledgeIntranet />,
    'objetos-dinamicos': <ObjetosDinamicos />,
    ajuda: <CentralAjuda />,
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
      {activeClientAgent && (
        <FloatingPlatformAssistant
          mode="usuario-cliente"
          iconUrl={activeClientAgent.avatarUrl || undefined}
          iconBackground={activeClientAgent.color || undefined}
          enableFirstContact={false}
          instanceId="client-agent-live"
          pageTitle={activeClientAgent.name}
        />
      )}
    </Layout>
  );
}
