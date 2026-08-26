import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, X } from 'lucide-react';
import { ExportAction } from '../../components/ExportAction';
import { useSession } from '../../contexts/SessionContext';
import { useReportExport } from './useReportExport';
import { REPORT_DATASETS, type ReportDatasetKey } from './reportAdapters';
import type { StandardReportRow } from './StandardReportPage';

type Operator = 'eq' | 'neq' | 'contains' | 'gt';
type FilterClause = { field: string; operator: Operator; value: string };

const OPERATOR_LABELS: Record<Operator, string> = {
  eq: 'É',
  neq: 'Diferente de',
  contains: 'Contém',
  gt: 'Maior que',
};

function applyDynamicFilters(rows: StandardReportRow[], clauses: FilterClause[]): StandardReportRow[] {
  return rows.filter((row) => clauses.every((clause) => {
    if (!clause.field || !clause.value.trim()) return true;
    const raw = row[clause.field];
    const text = String(raw ?? '').toLowerCase();
    const value = clause.value.trim().toLowerCase();
    if (clause.operator === 'eq') return text === value;
    if (clause.operator === 'neq') return text !== value;
    if (clause.operator === 'contains') return text.includes(value);
    // "Maior que": compara numérico quando os dois lados são número real, senão cai pra
    // comparação de string (ordem alfabética) em vez de fingir uma comparação numérica errada.
    const numRaw = Number(raw);
    const numValue = Number(clause.value);
    if (raw !== null && raw !== undefined && !Number.isNaN(numRaw) && !Number.isNaN(numValue)) return numRaw > numValue;
    return text > value;
  }));
}

export function RelatorioPersonalizado() {
  const { session, isSupport } = useSession();
  const clienteId = session?.activeClientId ?? null;
  const exportReport = useReportExport();

  const [fieldsOpen, setFieldsOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [datasetKey, setDatasetKey] = useState<ReportDatasetKey>(REPORT_DATASETS[0].key);
  const [rows, setRows] = useState<StandardReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [gated, setGated] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [clauses, setClauses] = useState<FilterClause[]>([]);

  const dataset = useMemo(() => REPORT_DATASETS.find((item) => item.key === datasetKey) || REPORT_DATASETS[0], [datasetKey]);

  useEffect(() => {
    setSelectedFields(dataset.columns.slice(0, 4).map((column) => column.key));
    setClauses([]);
  }, [dataset]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    dataset.load({ clienteId, isSupport }).then((result) => {
      if (!active) return;
      setRows(result.rows);
      setGated(Boolean(result.gated));
      setLoading(false);
    });
    return () => { active = false; };
  }, [dataset, clienteId, isSupport]);

  const toggleField = (field: string) => {
    setSelectedFields((current) => current.includes(field) ? current.filter((item) => item !== field) : [...current, field]);
  };

  const addClause = () => {
    setClauses((current) => [...current, { field: dataset.columns[0]?.key || '', operator: 'contains', value: '' }]);
  };

  const updateClause = (index: number, patch: Partial<FilterClause>) => {
    setClauses((current) => current.map((clause, i) => i === index ? { ...clause, ...patch } : clause));
  };

  const removeClause = (index: number) => {
    setClauses((current) => current.filter((_, i) => i !== index));
  };

  const filteredRows = useMemo(() => applyDynamicFilters(rows, clauses), [rows, clauses]);
  const activeColumns = useMemo(
    () => dataset.columns.filter((column) => selectedFields.includes(column.key)),
    [dataset, selectedFields],
  );

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    await exportReport({
      format,
      filename: `relatorio-personalizado-${dataset.key}`,
      title: `Personalizado -- ${dataset.label}`,
      funcionalidade: `relatorio_personalizado_${dataset.key}`,
      columns: activeColumns,
      rows: filteredRows,
    });
  };

  return (
    <div className="v363-report-page">
      <header className="v363-report-header">
        <div>
          <h1>Relatório personalizado</h1>
          <p>Escolha o conjunto de dados, os campos e os filtros -- tudo montado a partir de dado real.</p>
        </div>
        <ExportAction filename={`relatorio-personalizado-${dataset.key}`} onExport={handleExport} />
      </header>

      <section className="v363-report-card" style={{ marginBottom: 18 }}>
        <label style={{ display: 'grid', gap: 6, maxWidth: 320 }}>
          <span style={{ fontWeight: 800 }}>Conjunto de dados</span>
          <select value={datasetKey} onChange={(event) => setDatasetKey(event.target.value as ReportDatasetKey)}>
            {REPORT_DATASETS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>
      </section>

      {gated ? (
        <section className="card audit-clean-card">
          <p className="muted">
            A trilha de auditoria completa é visível apenas para a equipe de suporte da plataforma. Ações do seu
            ambiente continuam sendo registradas normalmente — fale com o suporte se precisar consultar um evento específico.
          </p>
        </section>
      ) : (
        <>
          <section className="v363-builder-grid">
            <article className="v363-builder-box">
              <button className="v363-builder-toggle" onClick={() => setFieldsOpen((value) => !value)}>
                {fieldsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <span>Campos do relatório</span>
                <small>{selectedFields.length} selecionados</small>
              </button>

              {fieldsOpen && (
                <div className="v363-builder-content">
                  <div className="v363-field-list">
                    {dataset.columns.map((column) => (
                      <label key={column.key}>
                        <input type="checkbox" checked={selectedFields.includes(column.key)} onChange={() => toggleField(column.key)} />
                        <span>{column.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </article>

            <article className="v363-builder-box">
              <button className="v363-builder-toggle" onClick={() => setFiltersOpen((value) => !value)}>
                {filtersOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <span>Filtros avançados</span>
                <small>{clauses.length} filtro(s)</small>
              </button>

              {filtersOpen && (
                <div className="v363-builder-content">
                  <div className="v363-filter-clauses">
                    {clauses.map((clause, index) => (
                      <div className="v363-filter-clause-row" key={index}>
                        <select value={clause.field} onChange={(event) => updateClause(index, { field: event.target.value })}>
                          {dataset.columns.map((column) => <option key={column.key} value={column.key}>{column.label}</option>)}
                        </select>
                        <select value={clause.operator} onChange={(event) => updateClause(index, { operator: event.target.value as Operator })}>
                          {(Object.entries(OPERATOR_LABELS) as [Operator, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        <input
                          value={clause.value}
                          onChange={(event) => updateClause(index, { value: event.target.value })}
                          placeholder="Informe o valor do filtro..."
                        />
                        <button type="button" className="v363-filter-clause-remove" onClick={() => removeClause(index)} aria-label="Remover filtro">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="secondary-btn" style={{ marginTop: 12 }} onClick={addClause}>
                    <Plus size={16} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} /> Adicionar filtro
                  </button>
                </div>
              )}
            </article>
          </section>

          <section className="v363-report-card" style={{ marginTop: 18 }}>
            <div className="v363-report-card-head">
              <strong>Resultado</strong>
              <span>{loading ? 'Carregando...' : `${filteredRows.length} registro(s)`}</span>
            </div>

            <div className="v363-report-table-wrap">
              <table className="v363-report-table">
                <thead>
                  <tr>{activeColumns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
                </thead>
                <tbody>
                  {activeColumns.length === 0 ? (
                    <tr><td>Selecione ao menos um campo pra ver o resultado.</td></tr>
                  ) : loading ? (
                    <tr><td colSpan={activeColumns.length}>Carregando...</td></tr>
                  ) : filteredRows.length === 0 ? (
                    <tr><td colSpan={activeColumns.length}>Nenhum registro encontrado para os filtros selecionados.</td></tr>
                  ) : filteredRows.map((row, index) => (
                    <tr key={index}>
                      {activeColumns.map((column) => <td key={column.key}>{row[column.key] ?? '-'}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default RelatorioPersonalizado;
