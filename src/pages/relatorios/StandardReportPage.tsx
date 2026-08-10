import { useMemo, useState } from 'react';
import { CalendarDays, Filter, Search, SlidersHorizontal } from 'lucide-react';
import { ExportAction } from '../../components/ExportAction';

export type StandardReportColumn = {
  key: string;
  label: string;
};

export type StandardReportRow = Record<string, string | number | null | undefined>;

export type StandardReportPageProps = {
  title: string;
  description: string;
  filename?: string;
  columns?: StandardReportColumn[];
  rows?: StandardReportRow[];
  typeOptions?: string[];
  statusOptions?: string[];
  responsibleOptions?: string[];
  originOptions?: string[];
};

const defaultColumns: StandardReportColumn[] = [
  { key: 'data', label: 'Data' },
  { key: 'origem', label: 'Origem' },
  { key: 'status', label: 'Status' },
  { key: 'responsavel', label: 'Responsável' },
];

export function StandardReportPage({
  title,
  description,
  filename,
  columns = defaultColumns,
  rows = [],
  typeOptions = ['Todos os tipos', 'Operacional', 'Integração', 'Agente', 'Manual'],
  statusOptions = ['Todos os status', 'Aberto', 'Em andamento', 'Concluído', 'Cancelado'],
  responsibleOptions = ['Todos os responsáveis', 'Moises Mattos', 'SUSi', 'Equipe'],
  originOptions = ['Todas as origens', 'Sistema', 'Canal', 'Integração', 'Agente'],
}: StandardReportPageProps) {
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState('Últimos 30 dias');
  const [type, setType] = useState(typeOptions[0] || 'Todos os tipos');
  const [status, setStatus] = useState(statusOptions[0] || 'Todos os status');
  const [responsible, setResponsible] = useState(responsibleOptions[0] || 'Todos os responsáveis');
  const [origin, setOrigin] = useState(originOptions[0] || 'Todas as origens');

  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    return rows.filter((row) => {
      const text = Object.values(row).join(' ').toLowerCase();
      return !search || text.includes(search);
    });
  }, [query, rows]);

  const totalLabel = filteredRows.length === 1 ? '1 registro' : `${filteredRows.length} registros`;

  return (
    <div className="v363-report-page">
      <header className="v363-report-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <ExportAction filename={filename || title} />
      </header>

      <section className="v363-report-card">
        <div className="v363-report-card-head">
          <strong>Filtros da consulta</strong>
          <span>{totalLabel}</span>
        </div>

        <div className="v363-filter-grid">
          <label className="v363-filter-search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por texto, responsável, origem, status ou referência..." />
          </label>

          <label>
            <CalendarDays size={17} />
            <select value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option>Hoje</option>
              <option>Últimos 7 dias</option>
              <option>Últimos 30 dias</option>
              <option>Este mês</option>
              <option>Período personalizado</option>
            </select>
          </label>

          <label>
            <SlidersHorizontal size={17} />
            <select value={type} onChange={(event) => setType(event.target.value)}>
              {typeOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>

          <label>
            <Filter size={17} />
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {statusOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>

          <label>
            <span>Resp.</span>
            <select value={responsible} onChange={(event) => setResponsible(event.target.value)}>
              {responsibleOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>

          <label>
            <span>Origem</span>
            <select value={origin} onChange={(event) => setOrigin(event.target.value)}>
              {originOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        </div>

        <div className="v363-active-filters">
          <span>{period}</span>
          <span>{type}</span>
          <span>{status}</span>
          <span>{responsible}</span>
          <span>{origin}</span>
        </div>

        <div className="v363-report-table-wrap">
          <table className="v363-report-table">
            <thead>
              <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>Nenhum registro encontrado para os filtros selecionados.</td>
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
