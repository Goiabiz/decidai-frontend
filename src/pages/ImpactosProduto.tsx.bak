import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { CollapsibleKpiSection } from '../components/CollapsibleKpiSection';
import { Badge } from '../components/Badge';
import { DataSourceNotice } from '../components/DataSourceNotice';
import { InlineRowActions } from '../components/InlineRowActions';
import { SmartFilters, normalizeFilterText } from '../components/SmartFilters';
import { impactos as mockImpactos } from '../data/mock';
import { useAsyncData } from '../hooks/useAsyncData';
import { fetchImpactos } from '../services/radarApi';
import type { PageProps } from '../App';

const isCritical = (value: string) => value.toLowerCase().includes('crít') || value.toLowerCase().includes('crit');
const activeStatuses = ['em andamento', 'em análise', 'monitoramento', 'monitorando', 'pendente'];

export function ImpactosProduto({ onSelectDetail, onOpenDetail }: PageProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [prioridade, setPrioridade] = useState('');
  const [modulo, setModulo] = useState('');
  const { data, source, loading, error, connectionState } = useAsyncData(fetchImpactos, mockImpactos);

  const filtered = data.filter((item) => {
    const text = normalizeFilterText([item.modulo, item.funcionalidade, item.origem, item.criticidade, item.cliente, item.status].join(' '));
    return (!search || text.includes(normalizeFilterText(search))) &&
      (!status || text.includes(normalizeFilterText(status))) &&
      (!prioridade || text.includes(normalizeFilterText(prioridade))) &&
      (!modulo || text.includes(normalizeFilterText(modulo)));
  });

  const criticos = filtered.filter((item) => isCritical(item.criticidade)).length;
  const ativos = filtered.filter((item) => activeStatuses.some((statusItem) => item.status.toLowerCase().includes(statusItem))).length;
  const clientes = new Set(filtered.map((item) => item.cliente).filter(Boolean)).size;

  return (
    <>
      <PageHeader title="Mapa de Impactos" subtitle="Avalie onde uma mudança pode afetar produto, cliente, operação ou regra de negócio." action={<button className="secondary-btn">Exportar</button>} />
      <DataSourceNotice source={source} loading={loading} error={error} connectionState={connectionState} />

      <CollapsibleKpiSection>
      <div className="kpi-grid four">
        <KpiCard label="Impactos mapeados" value={filtered.length} trend="+8%" tone="green" />
        <KpiCard label="Críticos" value={criticos} trend="atenção necessária" tone="red" />
        <KpiCard label="Alcance identificado" value={clientes || filtered.length} trend="+6%" tone="blue" />
        <KpiCard label="Ações em curso" value={ativos} trend="+3%" tone="orange" />
      </div>
      </CollapsibleKpiSection>

      <SmartFilters search={search} onSearch={setSearch} status={status} onStatus={setStatus} prioridade={prioridade} onPrioridade={setPrioridade} modulo={modulo} onModulo={setModulo} placeholder="Buscar impacto, cliente, módulo ou funcionalidade..." />

      <div className="card">
        <div className="section-title-row"><h3>Impactos mapeados</h3><span className="small-muted">{filtered.length} registros</span></div>
        <table>
          <thead><tr><th>Módulo</th><th>Funcionalidade</th><th>Origem</th><th>Criticidade</th><th>Cliente</th><th>Persona / Serviço</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            {filtered.map((item) => {
              const detail = {
                title: item.funcionalidade || 'Impacto selecionado',
                subtitle: item.modulo,
                badge: item.criticidade,
                badgeTone: item.criticidade,
                description: 'Impacto selecionado para análise de alcance em produto, cliente, serviço, persona afetada e ação recomendada.',
                meta: [
                  { label: 'Módulo', value: item.modulo },
                  { label: 'Funcionalidade', value: item.funcionalidade },
                  { label: 'Origem', value: item.origem },
                  { label: 'Cliente', value: item.cliente },
                  { label: 'Status', value: item.status }
                ],
                actions: ['Enviar para Roadmap', 'Gerar orientação SUSi', 'Marcar revisão']
              };
              return (
                <tr className="clickable-row" key={`${item.modulo}-${item.funcionalidade}-${item.origem}-${item.status}`} onClick={() => onSelectDetail?.(detail)}>
                  <td>{item.modulo || '-'}</td>
                  <td><strong>{item.funcionalidade || '-'}</strong></td>
                  <td>{item.origem || '-'}</td>
                  <td><Badge tone={item.criticidade.toLowerCase()}>{item.criticidade || 'Não informado'}</Badge></td>
                  <td>{item.cliente || 'Geral'}</td>
                  <td><Badge tone="blue">{item.status || 'Sem status'}</Badge></td>
                  <td><InlineRowActions detail={detail} status={item.status} prioridade={item.criticidade} responsavel="Moises Mattos" onOpenDetail={onOpenDetail} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="empty-note">Nenhum impacto encontrado para os filtros aplicados.</p>}
      </div>
    </>
  );
}
