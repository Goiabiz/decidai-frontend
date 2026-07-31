import { Integracoes } from './Integracoes';
import { useEffect, useMemo, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { CollapsibleKpiSection } from '../components/CollapsibleKpiSection';
import { Badge } from '../components/Badge';
import { DataSourceNotice } from '../components/DataSourceNotice';
import { InlineRowActions } from '../components/InlineRowActions';
import { SmartFilters, normalizeFilterText } from '../components/SmartFilters';
import { useAsyncData } from '../hooks/useAsyncData';
import {
  fetchClientesConfig,
  fetchIntegracoesConfig,
  fetchUsuariosConfig,
  type ClienteConfig,
  type IntegracaoConfig,
  type UsuarioConfig,
} from '../services/radarApi';
import type { PageProps } from '../App';
import type { PanelDetail } from '../components/RightPanel';
import {
  applyWorkspacePreferences,
  defaultWorkspacePreferences,
  loadWorkspacePreferences,
  resetWorkspacePreferences,
  saveWorkspacePreferences,
  type WorkspacePreferences
} from '../lib/preferences';

const mockClientes: ClienteConfig[] = [
  { nome: 'ConectaSUS', tipo: 'cliente_contratante', status: 'ativo', plano: 'Personalizado', ambiente: 'Produção', integracoes: '3', atualizadoEm: '2026-07-19' }
];

const mockIntegracoes: IntegracaoConfig[] = [
  { nome: 'Confluence - Base de Conhecimento POC', provedor: 'confluence', status: 'pendente_configuracao', autenticacao: 'api_token', cliente: 'ConectaSUS', atualizadoEm: '2026-07-19' },
  { nome: 'Jira Service Management - POC', provedor: 'jira', status: 'pendente_configuracao', autenticacao: 'api_token', cliente: 'ConectaSUS', atualizadoEm: '2026-07-19' },
  { nome: 'WhatsApp Meta - POC', provedor: 'whatsapp_meta', status: 'pendente_configuracao', autenticacao: 'token_api', cliente: 'ConectaSUS', atualizadoEm: '2026-07-19' }
];

const mockUsuarios: UsuarioConfig[] = [
  { nome: 'Administrador IMG', email: 'admin.img@universo-poc.local', perfil: 'administrador_master', status: 'ativo', cliente: 'Cliente vinculado', ultimoLogin: '-' },
  { nome: 'Gestor ConectaSUS', email: 'gestor@conectasus.com.br', perfil: 'gestor_ambiente', status: 'ativo', cliente: 'Cliente vinculado', ultimoLogin: '-' },
  { nome: 'Operador Radar SUS', email: 'operador@conectasus.com.br', perfil: 'operador', status: 'ativo', cliente: 'Cliente vinculado', ultimoLogin: '-' }
];

const formatDate = (value?: string) => {
  if (!value || value === '-') return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getSource = (sources: string[]) => sources.every((source) => source === 'supabase') ? 'supabase' : 'mock';

export function Configuracoes({ onSelectDetail, onOpenDetail }: PageProps) {
  const [preferences, setPreferences] = useState<WorkspacePreferences>(() => loadWorkspacePreferences());
  const [savedMessage, setSavedMessage] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const clientesResult = useAsyncData(fetchClientesConfig, mockClientes);
  const integracoesResult = useAsyncData(fetchIntegracoesConfig, mockIntegracoes);
  const usuariosResult = useAsyncData(fetchUsuariosConfig, mockUsuarios);

  const clientes = Array.isArray(clientesResult.data) ? clientesResult.data : mockClientes;
  const integracoes = Array.isArray(integracoesResult.data) ? integracoesResult.data : mockIntegracoes;
  const usuarios = Array.isArray(usuariosResult.data) ? usuariosResult.data : mockUsuarios;

  const source = getSource([clientesResult.source, integracoesResult.source, usuariosResult.source]);
  const loading = clientesResult.loading || integracoesResult.loading || usuariosResult.loading;
  const error = clientesResult.error || integracoesResult.error || usuariosResult.error;

  useEffect(() => {
    applyWorkspacePreferences(preferences);
  }, [preferences]);

  const updatePreference = <K extends keyof WorkspacePreferences>(key: K, value: WorkspacePreferences[K]) => {
    setPreferences((current) => ({ ...current, [key]: value }));
    setSavedMessage('');
  };

  const handleSavePreferences = () => {
    saveWorkspacePreferences(preferences);
    applyWorkspacePreferences(preferences);
    setSavedMessage('Preferências salvas neste navegador.');
  };

  const handleResetPreferences = () => {
    resetWorkspacePreferences();
    setPreferences(defaultWorkspacePreferences);
    applyWorkspacePreferences(defaultWorkspacePreferences);
    setSavedMessage('Preferências restauradas para o padrão.');
  };

  const matches = (values: Array<string | number | undefined | null>) => {
    const query = normalizeFilterText(search);
    const statusFilter = normalizeFilterText(status);
    const text = normalizeFilterText(values.join(' '));
    return (!query || text.includes(query)) && (!statusFilter || text.includes(statusFilter));
  };

  const filteredClientes = useMemo(() => clientes.filter((item) => matches([item.nome, item.tipo, item.status, item.plano, item.ambiente])), [clientes, search, status]);
  const filteredIntegracoes = useMemo(() => integracoes.filter((item) => matches([item.nome, item.provedor, item.status, item.cliente, item.autenticacao])), [integracoes, search, status]);
  const filteredUsuarios = useMemo(() => usuarios.filter((item) => matches([item.nome, item.email, item.perfil, item.status, item.cliente])), [usuarios, search, status]);

  const clientesAtivos = clientes.filter((item) => item.status.toLowerCase().includes('ativo')).length;
  const integracoesAtivas = integracoes.filter((item) => item.status.toLowerCase().includes('ativo')).length || integracoes.length;
  const usuariosAtivos = usuarios.filter((item) => item.status.toLowerCase().includes('ativo')).length;
  const ambientes = new Set(clientes.map((item) => item.ambiente).filter(Boolean)).size;

  const selectDetail = (detail: PanelDetail) => onSelectDetail?.(detail);

  return (
    <>
      <PageHeader title="Administração" action={<button className="secondary-btn">Nova parametrização</button>} />

      <DataSourceNotice source={source} loading={loading} error={error} connectionState={source === 'supabase' ? 'connected' : loading ? 'connecting' : error ? 'error' : (clientesResult.connectionState === 'slow' || integracoesResult.connectionState === 'slow' || usuariosResult.connectionState === 'slow') ? 'slow' : 'demo'} />

      <CollapsibleKpiSection>
      <div className="kpi-grid four">
        <KpiCard label="Clientes ativos" value={String(clientesAtivos || clientes.length)} trend="base atual" tone="green" />
        <KpiCard label="Integrações configuradas" value={String(integracoesAtivas)} trend="conectores internos" tone="blue" />
        <KpiCard label="Usuários cadastrados" value={String(usuariosAtivos || usuarios.length)} trend="acesso operacional" tone="purple" />
        <KpiCard label="Ambientes monitorados" value={String(ambientes || 1)} trend="produção/homologação" tone="orange" />
      </div>
      </CollapsibleKpiSection>

<div className="tabs">
  <button className="active">Administração</button>
  <button>Cadastros</button>
  <button>Integrações</button>
  <button>Agentes</button>
  <button>Campos de contexto</button>
  <button>Modelos de tela</button>
  <button>Preferências</button>
</div>


      <SmartFilters search={search} onSearch={setSearch} status={status} onStatus={setStatus} placeholder="Buscar cliente, integração, usuário ou parâmetro..." />

      <div className="config-grid">
        <section className="card">
          <div className="section-title-row"><h3>Clientes</h3><span className="small-muted">{filteredClientes.length} registros</span></div>
          <table>
            <thead><tr><th>Cliente</th><th>Tipo</th><th>Plano</th><th>Ambiente</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {filteredClientes.map((cliente) => {
                const detail = {
                  title: cliente.nome,
                  subtitle: cliente.tipo,
                  badge: cliente.status,
                  badgeTone: cliente.status,
                  description: 'Cliente selecionado para configuração operacional.',
                  meta: [
                    { label: 'Tipo', value: cliente.tipo },
                    { label: 'Plano', value: cliente.plano },
                    { label: 'Ambiente', value: cliente.ambiente },
                    { label: 'Integrações', value: cliente.integracoes }
                  ],
                  actions: ['Editar cliente', 'Configurar integrações', 'Desativar']
                };
                return (
                  <tr className="clickable-row" key={`${cliente.nome}-${cliente.tipo}-${cliente.status}`} onClick={() => selectDetail(detail)}>
                    <td><strong>{cliente.nome}</strong><div className="table-subtitle">Integrações: {cliente.integracoes}</div></td>
                    <td>{cliente.tipo}</td>
                    <td>{cliente.plano}</td>
                    <td>{cliente.ambiente}</td>
                    <td><Badge tone={cliente.status.toLowerCase().includes('ativo') ? 'green' : 'orange'}>{cliente.status}</Badge></td>
                    <td><InlineRowActions detail={detail} status={cliente.status} prioridade="Média" responsavel="Bruno Oliveira" onOpenDetail={onOpenDetail} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

      </div>

      <Integracoes />

      <div className="card config-users-card">
        <div className="section-title-row"><h3>Usuários</h3><span className="small-muted">{filteredUsuarios.length} registros</span></div>
        <table>
          <thead><tr><th>Usuário</th><th>E-mail</th><th>Perfil</th><th>Cliente</th><th>Último login</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            {filteredUsuarios.map((usuario) => {
              const detail = {
                title: usuario.nome,
                subtitle: usuario.email,
                badge: usuario.status,
                badgeTone: usuario.status,
                description: 'Usuário selecionado para revisão de perfil, cliente e acesso.',
                meta: [
                  { label: 'E-mail', value: usuario.email },
                  { label: 'Perfil', value: usuario.perfil },
                  { label: 'Cliente', value: usuario.cliente },
                  { label: 'Último login', value: formatDate(usuario.ultimoLogin) }
                ],
                actions: ['Editar usuário', 'Gerenciar permissões', 'Desativar']
              };
              return (
                <tr className="clickable-row" key={`${usuario.email}-${usuario.nome}`} onClick={() => selectDetail(detail)}>
                  <td><strong>{usuario.nome}</strong></td>
                  <td>{usuario.email}</td>
                  <td>{usuario.perfil}</td>
                  <td>{usuario.cliente}</td>
                  <td>{formatDate(usuario.ultimoLogin)}</td>
                  <td><Badge tone={usuario.status.toLowerCase().includes('ativo') ? 'green' : 'orange'}>{usuario.status}</Badge></td>
                  <td><InlineRowActions detail={detail} status={usuario.status} prioridade="Média" responsavel={usuario.nome} onOpenDetail={onOpenDetail} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>


<section className="workspace-settings-panel">
  <div className="workspace-settings-header">
    <div>
      <h2>Mapa de Personas e Alcance Operacional</h2>
      <p>Camada preparada para classificar impactos por gestor, coordenação, serviço, unidade e operador afetado.</p>
    </div>
    <span className="badge badge-blue">Roadmap funcional</span>
  </div>

  <div className="persona-map-grid">
    <div className="persona-map-card">
      <strong>Gestão regional/interfederativa</strong>
      <span>CIT, CIB, DRS, DIR, áreas técnicas estaduais e regionais.</span>
    </div>
    <div className="persona-map-card">
      <strong>Gestão municipal</strong>
      <span>Secretário, gestor municipal, planejamento, regulação, faturamento, auditoria e TI.</span>
    </div>
    <div className="persona-map-card">
      <strong>Coordenações de serviço</strong>
      <span>Atenção Básica, Especializada, VISA, VE, CAPS, IST, Farmácia, Laboratório, Transporte e TFD.</span>
    </div>
    <div className="persona-map-card">
      <strong>Operação de unidade</strong>
      <span>UBS, CAPS, UPA, sala de vacina, farmácia, laboratório, regulação e recepção.</span>
    </div>
  </div>

  <p className="workspace-settings-note">
    O SUSi utilizará esse mapa para gerar orientação executiva, gerencial, operacional e técnica conforme a persona impactada.
  </p>
</section>


<section className="workspace-settings-panel governance-roadmap-panel">
  <div className="workspace-settings-header">
    <div>
      <h2>Governança, Auditoria e Relatórios</h2>
      <p>Camada prevista para controlar exportações, impressões, trilhas de auditoria, atividades e acessos externos realizados pelo usuário ou pelo SUSi.</p>
    </div>
    <span className="badge badge-blue">Roadmap de segurança</span>
  </div>

  <div className="governance-grid">
    <div className="governance-card">
      <strong>Exportação de dados</strong>
      <span>Exportar listas, filtros, alertas, impactos, documentos, roadmap e atendimentos em formatos controlados.</span>
      <small>Roadmap: CSV, XLSX, PDF e exportação por perfil.</small>
    </div>

    <div className="governance-card">
      <strong>Impressão de relatórios</strong>
      <span>Gerar relatórios impressos por módulo, cliente, período, status, responsável, criticidade e persona impactada.</span>
      <small>Roadmap: relatório sintético, analítico e executivo.</small>
    </div>

    <div className="governance-card">
      <strong>Logs de usuário</strong>
      <span>Registrar inclusões, alterações, exclusões e acessos com data, hora, usuário, IP, origem e dados alterados.</span>
      <small>Roadmap: insert, update, delete, login, exportação e impressão.</small>
    </div>

    <div className="governance-card">
      <strong>Atividades e histórico</strong>
      <span>Exibir linha do tempo de atividades por item, usuário, módulo, cliente e ação executada.</span>
      <small>Roadmap: histórico do item e histórico global do usuário.</small>
    </div>

    <div className="governance-card">
      <strong>Links externos seguros</strong>
      <span>Registrar acessos a links externos e exibir aviso de segurança antes de abrir fontes consultadas.</span>
      <small>Roadmap: domínio, URL, data, usuário, IP e confirmação de abertura.</small>
    </div>

    <div className="governance-card">
      <strong>Auditoria do SUSi</strong>
      <span>Registrar quando o agente consultar, baixar, resumir ou recomendar conteúdo a partir de fonte externa.</span>
      <small>Roadmap: fonte, evidência, usuário solicitante, data/hora e orientação gerada.</small>
    </div>
  </div>

  <p className="workspace-settings-note">
    Diretriz: toda ação que gere impacto operacional, exporte informação, consulte fonte externa ou altere dados deverá produzir registro de auditoria consultável.
  </p>
</section>

      <section className="workspace-settings-panel">
        <div className="workspace-settings-header">
          <div>
            <h2>Área de trabalho configurável</h2>
            <p>Defina como o Radar SUS deve abrir, quais informações devem ganhar prioridade e como o usuário prefere trabalhar.</p>
          </div>
          <span className="badge badge-green">Salvo no navegador</span>
        </div>

        <div className="workspace-settings-grid">
          <div className="settings-card">
            <h3>Perfil do usuário</h3>
            <label>Nome de exibição<input value={preferences.userName} onChange={(event) => updatePreference('userName', event.target.value)} /></label>
            <label>E-mail<input value={preferences.userEmail} onChange={(event) => updatePreference('userEmail', event.target.value)} /></label>
            <label>URL da foto<input placeholder="https://..." value={preferences.userPhotoUrl} onChange={(event) => updatePreference('userPhotoUrl', event.target.value)} /></label>
          </div>

          <div className="settings-card">
            <h3>Aparência</h3>
            <label>Tema<select value={preferences.theme} onChange={(event) => updatePreference('theme', event.target.value as WorkspacePreferences['theme'])}>
              <option value="system">Seguir tema do computador</option>
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
            </select></label>
            <label>Cor principal<input type="color" value={preferences.accentColor} onChange={(event) => updatePreference('accentColor', event.target.value)} /></label>
            <label>Cor da dashboard<input type="color" value={preferences.dashboardColor} onChange={(event) => updatePreference('dashboardColor', event.target.value)} /></label>
          </div>

          <div className="settings-card">
            <h3>Layout da área</h3>
            <label>Densidade<select value={preferences.density} onChange={(event) => updatePreference('density', event.target.value as WorkspacePreferences['density'])}>
              <option value="comfortable">Confortável</option>
              <option value="compact">Compacto</option>
            </select></label>
            <label>Painel lateral<select value={preferences.rightPanelDefault} onChange={(event) => updatePreference('rightPanelDefault', event.target.value as WorkspacePreferences['rightPanelDefault'])}>
              <option value="open">Aberto por padrão</option>
              <option value="collapsed">Recolhido por padrão</option>
            </select></label>
            <label className="inline-check"><input type="checkbox" checked={preferences.compactTables} onChange={(event) => updatePreference('compactTables', event.target.checked)} /> Tabelas compactas</label>
          </div>

          <div className="settings-card">
            <h3>Informações na tela</h3>
            <label className="inline-check"><input type="checkbox" checked={preferences.showKpis} onChange={(event) => updatePreference('showKpis', event.target.checked)} /> Exibir cards/KPIs</label>
            <label className="inline-check"><input type="checkbox" checked={preferences.showCharts} onChange={(event) => updatePreference('showCharts', event.target.checked)} /> Exibir gráficos e blocos visuais</label>
            <label className="inline-check"><input type="checkbox" checked={preferences.saveFilters} onChange={(event) => updatePreference('saveFilters', event.target.checked)} /> Salvar filtros rápidos por usuário</label>
          </div>
        </div>

        <div className="workspace-settings-actions">
          <button onClick={handleResetPreferences}>Restaurar padrão</button>
          <button className="primary" onClick={handleSavePreferences}>Salvar preferências</button>
          {savedMessage && <strong>{savedMessage}</strong>}
        </div>

        <p className="workspace-settings-note">
          Próxima etapa: gravar essas preferências por usuário/perfil no Supabase e permitir variações por módulo, funcionalidade e cliente.
        </p>
      </section>

<section className="workspace-settings-panel">
  <div className="workspace-settings-header">
    <div>
      <h2>Persistência Supabase</h2>
      <p>Camada técnica preparada para gravar Roadmap, histórico, alterações inline e auditoria assim que as tabelas e políticas forem ativadas.</p>
    </div>
    <span className="badge badge-orange">Preparado / desativado</span>
  </div>

  <div className="governance-grid">
    <div className="governance-card">
      <strong>Roadmap operacional</strong>
      <span>Itens gerados localmente já possuem contrato para gravação futura em tabela operacional.</span>
      <small>roadmap_itens_operacionais</small>
    </div>
    <div className="governance-card">
      <strong>Histórico do item</strong>
      <span>Ações do item possuem contrato para histórico consultável por título, usuário e data.</span>
      <small>historico_operacional</small>
    </div>
    <div className="governance-card">
      <strong>Auditoria de usuário</strong>
      <span>Alterações, inserts, prints, exports, deletes e acessos externos já têm modelo de auditoria previsto.</span>
      <small>auditoria_usuario</small>
    </div>
  </div>

  <p className="workspace-settings-note">
    As escritas reais seguem desativadas no front até aplicação da migração, definição de RLS e validação de permissões.
  </p>
</section>

    </>
  );
}