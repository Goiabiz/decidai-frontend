import { CalendarDays, Filter, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/Badge';
import { ExportAction } from '../../components/ExportAction';
import { normalizeFilterText } from '../../components/SmartFilters';
import { useSession } from '../../contexts/SessionContext';
import { listAuditLogs, type AuditLogRecord } from '../../services/auditLog';
import { OPERACAO_LABELS, OPERACAO_TONE } from '../../lib/auditLabels';
import { useReportExport } from '../relatorios/useReportExport';

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function SegurancaAuditoria() {
  const { isSupport } = useSession();
  const exportReport = useReportExport();
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [operacao, setOperacao] = useState('');
  const [modulo, setModulo] = useState('');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [openPopover, setOpenPopover] = useState<'periodo' | 'filtros' | null>(null);

  useEffect(() => {
    if (!isSupport) { setLoading(false); return; }
    setLoading(true);
    listAuditLogs().then((result) => setLogs(result.items)).finally(() => setLoading(false));
  }, [isSupport]);

  useEffect(() => {
    if (!openPopover) return;
    const closePopover = () => setOpenPopover(null);
    window.addEventListener('mousedown', closePopover);
    return () => window.removeEventListener('mousedown', closePopover);
  }, [openPopover]);

  const modulos = useMemo(() => Array.from(new Set(logs.map((item) => item.modulo))).sort(), [logs]);

  const filtered = useMemo(() => {
    const normalized = normalizeFilterText(query);
    return logs.filter((item) => {
      const text = normalizeFilterText([item.usuario, item.modulo, item.funcionalidade, item.observacao].join(' '));
      const dataOnly = item.data.slice(0, 10);
      return (!normalized || text.includes(normalized))
        && (!operacao || item.operacao === operacao)
        && (!modulo || item.modulo === modulo)
        && (!periodoInicio || dataOnly >= periodoInicio)
        && (!periodoFim || dataOnly <= periodoFim);
    });
  }, [logs, query, operacao, modulo, periodoInicio, periodoFim]);

  const periodoAtivo = Boolean(periodoInicio || periodoFim);
  const filtrosAtivos = Boolean(modulo);

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    await exportReport({
      format,
      filename: 'auditoria',
      title: 'Auditoria',
      funcionalidade: 'auditoria_consulta',
      columns: [
        { key: 'data', label: 'Data' },
        { key: 'usuario', label: 'Usuário/Agente' },
        { key: 'modulo', label: 'Módulo' },
        { key: 'funcionalidade', label: 'Ação' },
        { key: 'operacao', label: 'Operação' },
      ],
      rows: filtered.map((item) => ({
        data: formatDateTime(item.data),
        usuario: item.usuario,
        modulo: item.modulo,
        funcionalidade: item.funcionalidade !== '-' ? item.funcionalidade : item.observacao,
        operacao: OPERACAO_LABELS[item.operacao] || item.operacao,
      })),
    });
  };

  if (!isSupport) {
    return (
      <>
        <PageHeader title="Auditoria" />
        <section className="card audit-clean-card">
          <p className="muted">
            A trilha de auditoria completa é visível apenas para a equipe de suporte da plataforma. Ações do seu
            ambiente continuam sendo registradas normalmente — fale com o suporte se precisar consultar um evento específico.
          </p>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Auditoria"
        action={<ExportAction filename="auditoria" title="Exportar consulta de auditoria" onExport={handleExport} />}
      />

      <section className="card audit-clean-card">
        <div className="section-title-row">
          <div>
            <h3>Consulta de logs</h3>
            <p className="section-description">Pesquise acessos, ações sensíveis, exportações, integrações e execuções do agente.</p>
          </div>
          <Badge tone="blue">{loading ? '...' : `${filtered.length} registros`}</Badge>
        </div>

        <div className="audit-filter-grid">
          <div className="smart-search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por usuário, módulo, ação ou observação..." />
          </div>
          <select value={operacao} onChange={(event) => setOperacao(event.target.value)}>
            <option value="">Todas as operações</option>
            {Object.entries(OPERACAO_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>

          <div className="row-menu-wrap">
            <button className={periodoAtivo ? 'active-filter' : ''} onClick={() => setOpenPopover(openPopover === 'periodo' ? null : 'periodo')}>
              <CalendarDays size={16} /> Período
            </button>
            {openPopover === 'periodo' && (
              <div className="row-more-menu audit-filter-popover" onClick={(event) => event.stopPropagation()}>
                <label>De<input type="date" value={periodoInicio} onChange={(event) => setPeriodoInicio(event.target.value)} /></label>
                <label>Até<input type="date" value={periodoFim} onChange={(event) => setPeriodoFim(event.target.value)} /></label>
                {periodoAtivo && <button type="button" className="audit-filter-clear" onClick={() => { setPeriodoInicio(''); setPeriodoFim(''); }}>Limpar período</button>}
              </div>
            )}
          </div>

          <div className="row-menu-wrap">
            <button className={filtrosAtivos ? 'active-filter' : ''} onClick={() => setOpenPopover(openPopover === 'filtros' ? null : 'filtros')}>
              <Filter size={16} /> Filtros
            </button>
            {openPopover === 'filtros' && (
              <div className="row-more-menu audit-filter-popover" onClick={(event) => event.stopPropagation()}>
                <label>Módulo
                  <select value={modulo} onChange={(event) => setModulo(event.target.value)}>
                    <option value="">Todos</option>
                    {modulos.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                {filtrosAtivos && <button type="button" className="audit-filter-clear" onClick={() => setModulo('')}>Limpar filtros</button>}
              </div>
            )}
          </div>
        </div>

        <div className="simple-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Usuário/Agente</th>
                <th>Módulo</th>
                <th>Ação</th>
                <th>Operação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>{formatDateTime(item.data)}</td>
                  <td>{item.usuario}</td>
                  <td>{item.modulo}</td>
                  <td>{item.funcionalidade !== '-' ? item.funcionalidade : item.observacao}</td>
                  <td><Badge tone={OPERACAO_TONE[item.operacao]}>{OPERACAO_LABELS[item.operacao] || item.operacao}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && <p className="empty-note">Nenhum registro de auditoria encontrado.</p>}
        </div>
      </section>
    </>
  );
}

export default SegurancaAuditoria;
