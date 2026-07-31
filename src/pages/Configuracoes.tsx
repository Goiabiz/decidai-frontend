import { useMemo, useState } from 'react';
import { Badge } from '../components/Badge';
import { DataSourceNotice } from '../components/DataSourceNotice';
import { InlineRowActions } from '../components/InlineRowActions';
import { KpiCard } from '../components/KpiCard';
import { PageHeader } from '../components/PageHeader';
import { SmartFilters, normalizeFilterText } from '../components/SmartFilters';
import { useAsyncData } from '../hooks/useAsyncData';
import {
  fetchClientesConfig,
  fetchUsuariosConfig,
  type ClienteConfig,
  type UsuarioConfig,
} from '../services/radarApi';
import type { PageProps } from '../App';
import type { PanelDetail } from '../components/RightPanel';

const mockClientes: ClienteConfig[] = [
  { nome: 'ConectaSUS', tipo: 'cliente_contratante', status: 'ativo', plano: 'Personalizado', ambiente: 'Produção', integracoes: '3', atualizadoEm: '2026-07-19' }
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
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const clientesResult = useAsyncData(fetchClientesConfig, mockClientes);
  const usuariosResult = useAsyncData(fetchUsuariosConfig, mockUsuarios);

  const clientes = Array.isArray(clientesResult.data) ? clientesResult.data : mockClientes;
  const usuarios = Array.isArray(usuariosResult.data) ? usuariosResult.data : mockUsuarios;

  const source = getSource([clientesResult.source, usuariosResult.source]);
  const loading = clientesResult.loading || usuariosResult.loading;
  const error = clientesResult.error || usuariosResult.error;

  const matches = (values: Array<string | number | undefined | null>) => {
    const query = normalizeFilterText(search);
    const statusFilter = normalizeFilterText(status);
    const text = normalizeFilterText(values.join(' '));
    return (!query || text.includes(query)) && (!statusFilter || text.includes(statusFilter));
  };

  const filteredClientes = useMemo(() => clientes.filter((item) => matches([item.nome, item.tipo, item.status, item.plano, item.ambiente])), [clientes, search, status]);
  const filteredUsuarios = useMemo(() => usuarios.filter((item) => matches([item.nome, item.email, item.perfil, item.status, item.cliente])), [usuarios, search, status]);

  const clientesAtivos = clientes.filter((item) => item.status.toLowerCase().includes('ativo')).length;
  const usuariosAtivos = usuarios.filter((item) => item.status.toLowerCase().includes('ativo')).length;
  const ambientes = new Set(clientes.map((item) => item.ambiente).filter(Boolean)).size;

  const selectDetail = (detail: PanelDetail) => onSelectDetail?.(detail);

  return (
    <>
      <PageHeader title="Administração" action={<button className="secondary-btn">Nova parametrização</button>} />

      <DataSourceNotice source={source} loading={loading} error={error} connectionState={source === 'supabase' ? 'connected' : loading ? 'connecting' : error ? 'error' : (clientesResult.connectionState === 'slow' || usuariosResult.connectionState === 'slow') ? 'slow' : 'demo'} />

      <div className="kpi-grid four">
        <KpiCard label="Clientes ativos" value={String(clientesAtivos || clientes.length)} trend="base atual" tone="green" />
        <KpiCard label="Usuários cadastrados" value={String(usuariosAtivos || usuarios.length)} trend="acesso operacional" tone="purple" />
        <KpiCard label="Ambientes monitorados" value={String(ambientes || 1)} trend="produção/homologação" tone="orange" />
        <KpiCard label="Permissões críticas" value="0" trend="sem pendência ativa" tone="blue" />
      </div>

      <SmartFilters search={search} onSearch={setSearch} status={status} onStatus={setStatus} placeholder="Buscar cliente, usuário, ambiente ou parâmetro..." />

      <div className="config-grid">
        <section className="card">
          <div className="section-title-row"><h3>Clientes / Ambientes</h3><span className="small-muted">{filteredClientes.length} registros</span></div>
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

        <section className="card">
          <div className="section-title-row"><h3>Usuários administrativos</h3><span className="small-muted">{filteredUsuarios.length} registros</span></div>
          <table>
            <thead><tr><th>Usuário</th><th>E-mail</th><th>Perfil</th><th>Cliente</th><th>Status</th><th>Ações</th></tr></thead>
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
                    <td><Badge tone={usuario.status.toLowerCase().includes('ativo') ? 'green' : 'orange'}>{usuario.status}</Badge></td>
                    <td><InlineRowActions detail={detail} status={usuario.status} prioridade="Média" responsavel={usuario.nome} onOpenDetail={onOpenDetail} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>

      <section className="workspace-settings-panel">
        <div className="workspace-settings-header">
          <div>
            <h2>Governança administrativa</h2>
            <p>Camada de administração do ambiente, clientes, permissões gerais e estruturas liberadas para uso operacional.</p>
          </div>
          <span className="badge badge-blue">Parametrização</span>
        </div>

        <div className="governance-grid">
          <div className="governance-card">
            <strong>Clientes e ambientes</strong>
            <span>Controle de plano, ambiente, status e vínculo com recursos liberados.</span>
            <small>Administração da plataforma</small>
          </div>
          <div className="governance-card">
            <strong>Usuários administrativos</strong>
            <span>Perfis, acessos, permissões e bloqueios de usuários com poder de parametrização.</span>
            <small>Segurança operacional</small>
          </div>
          <div className="governance-card">
            <strong>Liberações do produto</strong>
            <span>Funcionalidades, integrações e agentes liberados por cliente e ambiente.</span>
            <small>Controle SaaS</small>
          </div>
        </div>
      </section>
    </>
  );
}
