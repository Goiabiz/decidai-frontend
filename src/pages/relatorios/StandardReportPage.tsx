import { useMemo, useState } from 'react';
import { CalendarDays, Search } from 'lucide-react';
import { ExportAction } from '../../components/ExportAction';
import { useReportExport } from './useReportExport';

export type StandardReportColumn = {
  key: string;
  label: string;
};

export type StandardReportRow = Record<string, string | number | null | undefined>;

export type StandardReportFilter = { key: string; label: string };

export type StandardReportPageProps = {
  title: string;
  description: string;
  filename?: string;
  funcionalidade: string;
  columns?: StandardReportColumn[];
  rows?: StandardReportRow[];
  loading?: boolean;
  /** Colunas com <select> de filtro -- opções derivadas dos valores reais de `rows`, nunca fixas. */
  filters?: StandardReportFilter[];
  /** Só define se o domínio tiver um campo de data confiável -- omitir esconde o seletor de período em vez de fingir um que não filtra nada. */
  dateColumnKey?: string;
  emptyMessage?: string;
};

const defaultColumns: StandardReportColumn[] = [
  { key: 'data', label: 'Data' },
  { key: 'origem', label: 'Origem' },
  { key: 'status', label: 'Status' },
  { key: 'responsavel', label: 'Responsável' },
];

const PERIOD_OPTIONS = ['Todos os períodos', 'Hoje', 'Últimos 7 dias', 'Últimos 30 dias', 'Este mês'] as const;
type Period = (typeof PERIOD_OPTIONS)[number];

function periodCutoff(period: Period): Date | null {
  const now = new Date();
  if (period === 'Hoje') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'Últimos 7 dias') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (period === 'Últimos 30 dias') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (period === 'Este mês') return new Date(now.getFullYear(), now.getMonth(), 1);
  return null;
}

export function StandardReportPage({
  title,
  description,
  filename,
  funcionalidade,
  columns = defaultColumns,
  rows = [],
  loading = false,
  filters = [],
  dateColumnKey,
  emptyMessage = 'Nenhum registro encontrado para os filtros selecionados.',
}: StandardReportPageProps) {
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState<Period>('Todos os períodos');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const exportReport = useReportExport();

  const filterOptions = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const filter of filters) {
      map[filter.key] = Array.from(new Set(rows.map((row) => String(row[filter.key] ?? '-')))).sort((a, b) => a.localeCompare(b));
    }
    return map;
  }, [filters, rows]);

  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    const cutoff = dateColumnKey ? periodCutoff(period) : null;

    return rows.filter((row) => {
      if (search) {
        const text = Object.values(row).join(' ').toLowerCase();
        if (!text.includes(search)) return false;
      }
      for (const filter of filters) {
        const selected = filterValues[filter.key];
        if (selected && selected !== 'Todos' && String(row[filter.key] ?? '-') !== selected) return false;
      }
      if (cutoff && dateColumnKey) {
        const rawDate = row[dateColumnKey];
        const parsed = rawDate ? new Date(String(rawDate)) : null;
        if (!parsed || Number.isNaN(parsed.getTime()) || parsed < cutoff) return false;
      }
      return true;
    });
  }, [query, rows, filters, filterValues, period, dateColumnKey]);

  const totalLabel = filteredRows.length === 1 ? '1 registro' : `${filteredRows.length} registros`;

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    await exportReport({
      format,
      filename: filename || title,
      title,
      funcionalidade,
      columns,
      rows: filteredRows,
    });
  };

  return (
    <div className="v363-report-page">
      <header className="v363-report-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <ExportAction filename={filename || title} onExport={handleExport} />
      </header>

      <section className="v363-report-card">
        <div className="v363-report-card-head">
          <strong>Filtros da consulta</strong>
          <span>{loading ? 'Carregando...' : totalLabel}</span>
        </div>

        <div className="v363-filter-grid">
          <label className="v363-filter-search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por texto..." />
          </label>

          {dateColumnKey && (
            <label>
              <CalendarDays size={17} />
              <select value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
                {PERIOD_OPTIONS.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          )}

          {filters.map((filter) => (
            <label key={filter.key}>
              <span>{filter.label}</span>
              <select
                value={filterValues[filter.key] || 'Todos'}
                onChange={(event) => setFilterValues((current) => ({ ...current, [filter.key]: event.target.value }))}
              >
                <option>Todos</option>
                {(filterOptions[filter.key] || []).map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          ))}
        </div>

        <div className="v363-report-table-wrap">
          <table className="v363-report-table">
            <thead>
              <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length}>Carregando...</td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>{emptyMessage}</td>
                </tr>
              ) : filteredRows.map((row, index) => (
                <tr key={index}>
                  {columns.map((column) => <td key={column.key}>{row[column.key] ?? '-'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default StandardReportPage;
