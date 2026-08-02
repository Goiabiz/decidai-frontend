import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  BookOpen,
  Building2,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Cog,
  FileBarChart2,
  Headphones,
  Home,
  LayoutTemplate,
  ListChecks,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  UserCog,
  UserRound,
  Users,
  Workflow,
} from 'lucide-react';
import type { PageKey } from '../App';
import { loadWorkspacePreferences } from '../lib/preferences';

type NavChild = {
  key: PageKey;
  label: string;
  icon?: React.ReactNode;
};

type NavGroup = {
  key: string;
  label: string;
  icon: React.ReactNode;
  defaultPage?: PageKey;
  children: NavChild[];
};

const navGroups: NavGroup[] = [
  {
    key: 'workspace',
    label: 'Área de Trabalho',
    icon: <Home size={22} />,
    defaultPage: 'dashboard',
    children: [{ key: 'dashboard', label: 'Visão geral' }],
  },
  {
    key: 'cadastros',
    label: 'Cadastros',
    icon: <BookOpen size={22} />,
    defaultPage: 'base',
    children: [
      { key: 'base', label: 'Base de Conhecimento', icon: <BookOpen size={18} /> },
      { key: 'cad-campos', label: 'Campos', icon: <SlidersHorizontal size={18} /> },
      { key: 'cad-formularios', label: 'Telas', icon: <LayoutTemplate size={18} /> },
      { key: 'cad-unidades', label: 'Unidades', icon: <Building2 size={18} /> },
      { key: 'cad-usuarios', label: 'Usuários', icon: <Users size={18} /> },
    ],
  },
  {
    key: 'central-atendimento',
    label: 'Central de Atendimento',
    icon: <Headphones size={22} />,
    defaultPage: 'alertas',
    children: [
      { key: 'alertas', label: 'Alertas', icon: <ShieldAlert size={18} /> },
      { key: 'atendimento', label: 'Atendimentos', icon: <Headphones size={18} /> },
      { key: 'atendimento-servicos', label: 'Serviços', icon: <Workflow size={18} /> },
    ],
  },
  {
    key: 'roadmap',
    label: 'Roadmap',
    icon: <ChartNoAxesCombined size={22} />,
    defaultPage: 'analise',
    children: [{ key: 'analise', label: 'Tarefas', icon: <ClipboardList size={18} /> }],
  },
  {
    key: 'parametrizacao',
    label: 'Parametrização',
    icon: <Cog size={22} />,
    defaultPage: 'param-admin',
    children: [
      { key: 'param-admin', label: 'Administração', icon: <Cog size={18} /> },
      { key: 'param-agentes', label: 'Agentes', icon: <UserCog size={18} /> },
      { key: 'param-canais', label: 'Canais de Atendimento', icon: <Workflow size={18} /> },
      { key: 'param-integracoes', label: 'Integrações', icon: <Plug size={18} /> },
      { key: 'param-preferencias', label: 'Preferências', icon: <SlidersHorizontal size={18} /> },
      { key: 'param-seguranca', label: 'Auditoria', icon: <ShieldAlert size={18} /> },
    ],
  },
  {
    key: 'relatorios',
    label: 'Relatórios',
    icon: <FileBarChart2 size={22} />,
    defaultPage: 'rel-personalizado',
    children: [
      { key: 'rel-personalizado', label: 'Personalizado', icon: <SlidersHorizontal size={18} /> },
      { key: 'rel-alertas', label: 'Alertas', icon: <ShieldAlert size={18} /> },
      { key: 'rel-atendimentos', label: 'Atendimentos', icon: <Headphones size={18} /> },
      { key: 'rel-auditoria', label: 'Auditoria', icon: <ListChecks size={18} /> },
      { key: 'rel-conhecimentos', label: 'Conhecimentos', icon: <BookOpen size={18} /> },
      { key: 'rel-integracoes', label: 'Integrações', icon: <Plug size={18} /> },
      { key: 'rel-tarefas', label: 'Tarefas', icon: <ClipboardList size={18} /> },
    ],
  },
];

function getActiveGroupKey(activePage: PageKey) {
  return navGroups.find((group) => group.children.some((child) => child.key === activePage))?.key || 'workspace';
}

export function Layout({ activePage, onNavigate, children, rightPanel }: { activePage: PageKey; onNavigate: (page: PageKey) => void; children: React.ReactNode; rightPanel?: React.ReactNode }) {
  const [prefs, setPrefs] = useState(() => loadWorkspacePreferences());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.localStorage.getItem('radar-sus-sidebar-collapsed') === 'true');
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [panelSize, setPanelSize] = useState(() => window.localStorage.getItem('radar-sus-right-panel-size') || 'medium');
  const [panelWidth, setPanelWidth] = useState(() => Number(window.localStorage.getItem('radar-sus-right-panel-width') || 0));
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const activeGroup = getActiveGroupKey(activePage);
    return { [activeGroup]: true };
  });
  const isResizing = useRef(false);
  const sidebarHoverTimer = useRef<number | null>(null);

  const isSidebarExpanded = !isSidebarCollapsed || isSidebarHovered;
  const activeGroupKey = useMemo(() => getActiveGroupKey(activePage), [activePage]);

  useEffect(() => {
    setOpenGroups((current) => ({ ...current, [activeGroupKey]: true }));
  }, [activeGroupKey]);

  useEffect(() => {
    const refresh = () => setPrefs(loadWorkspacePreferences());
    const refreshPanel = () => {
      setPanelSize(window.localStorage.getItem('radar-sus-right-panel-size') || 'medium');
      setPanelWidth(Number(window.localStorage.getItem('radar-sus-right-panel-width') || 0));
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing.current) return;
      const width = Math.min(680, Math.max(340, window.innerWidth - event.clientX));
      setPanelWidth(width);
      window.localStorage.setItem('radar-sus-right-panel-width', String(width));
      window.localStorage.setItem('radar-sus-right-panel-size', 'custom');
      window.dispatchEvent(new CustomEvent('radar-sus-panel-size-changed'));
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.classList.remove('is-resizing-right-panel');
    };

    window.addEventListener('storage', refresh);
    window.addEventListener('radar-sus-panel-size-changed', refreshPanel);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('radar-sus-panel-size-changed', refreshPanel);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const toggleSidebarPinned = () => {
    const next = !isSidebarCollapsed;
    setIsSidebarCollapsed(next);
    if (sidebarHoverTimer.current) {
      window.clearTimeout(sidebarHoverTimer.current);
      sidebarHoverTimer.current = null;
    }
    setIsSidebarHovered(false);
    window.localStorage.setItem('radar-sus-sidebar-collapsed', String(next));
  };

  return (
    <div className={`app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isSidebarExpanded ? 'sidebar-expanded' : ''}`}>
      <aside
        className="sidebar"
        onMouseEnter={() => {
          if (!isSidebarCollapsed) return;
          if (sidebarHoverTimer.current) window.clearTimeout(sidebarHoverTimer.current);
          sidebarHoverTimer.current = window.setTimeout(() => {
            setIsSidebarHovered(true);
          }, 1000);
        }}
        onMouseLeave={() => {
          if (sidebarHoverTimer.current) {
            window.clearTimeout(sidebarHoverTimer.current);
            sidebarHoverTimer.current = null;
          }
          if (isSidebarCollapsed) setIsSidebarHovered(false);
        }}
      >
        <div className="brand">
          <div className="brand-left">
            <Menu size={23} />
            <span>Radar <strong>SUS</strong></span>
          </div>
          <div className="radar-mark" />
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group) => {
            const isActiveGroup = activeGroupKey === group.key;
            const isOpen = isSidebarExpanded && (openGroups[group.key] || isActiveGroup);
            const singleChild = group.children.length === 1;

            if (singleChild) {
              const onlyChild = group.children[0];

              return (
                <button
                  key={group.key}
                  className={`nav-group-button ${activePage === onlyChild.key ? 'active' : ''}`}
                  onClick={() => onNavigate(onlyChild.key)}
                  title={group.label}
                >
                  {group.icon}
                  <span>{group.label}</span>
                  <ChevronDown size={17} className="nav-group-chevron nav-group-chevron-placeholder" />
                </button>
              );
            }

            return (
              <div key={group.key} className={`nav-group ${isOpen ? 'open' : ''} ${isActiveGroup ? 'active-group' : ''}`}>
                <button
                  type="button"
                  className={`nav-group-button ${isActiveGroup ? 'active' : ''}`}
                  onClick={() => {
                    if (!isSidebarExpanded && group.defaultPage) {
                      onNavigate(group.defaultPage);
                      return;
                    }

                    setOpenGroups((current) => ({
                      ...current,
                      [group.key]: !isOpen,
                    }));
                  }}
                  title={group.label}
                >
                  {group.icon}
                  <span>{group.label}</span>
                  <ChevronDown size={17} className="nav-group-chevron" />
                </button>

                {isOpen && (
                  <div className="nav-submenu">
                    {group.children.map((child) => (
                      <button
                        key={child.key}
                        type="button"
                        className={activePage === child.key ? 'active' : ''}
                        onClick={() => onNavigate(child.key)}
                      >
                        {child.icon}
                        <span>{child.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="topbar-left-tools">
            <button
              className="topbar-tool-btn"
              title={isSidebarCollapsed ? 'Fixar menu aberto' : 'Recolher menu'}
              onClick={toggleSidebarPinned}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
          </div>

          <div className="search-box"><Search size={18} /><input placeholder="Buscar por atendimentos, alertas, conhecimentos ou tarefas..." /><kbd>⌘ K</kbd></div>
          <div className="topbar-actions">
            <button className="environment"><span /> Ambiente: <strong>Produção</strong></button>
            <button className="icon-btn"><Bell size={19} /><em>12</em></button>
            <button className="icon-btn"><CircleHelp size={19} /></button>
            <div className="user-area"><div className="avatar">{prefs.userPhotoUrl ? <img src={prefs.userPhotoUrl} alt={prefs.userName} /> : <UserRound size={18} />}</div><div><strong>{prefs.userName}</strong><small>{prefs.userEmail || 'Administrador'}</small></div></div>
          </div>
        </header>

        <div className={`content-grid ${rightPanel ? `panel-${panelSize}` : 'panel-hidden'}`} style={rightPanel && panelWidth ? ({ '--right-panel-width': `${panelWidth}px` } as React.CSSProperties) : undefined}>
          <section className="page-content">{children}</section>
          {rightPanel && (
            <aside className="right-panel">
              <button
                className="right-panel-resizer"
                title="Arraste para ajustar a largura do painel"
                onMouseDown={() => {
                  isResizing.current = true;
                  document.body.classList.add('is-resizing-right-panel');
                }}
              />
              {rightPanel}
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}


