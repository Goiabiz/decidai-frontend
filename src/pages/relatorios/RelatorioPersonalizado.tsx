import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { ExportAction } from '../../components/ExportAction';

const availableFields = [
  'Agente', 'Alerta', 'Atendimento', 'Canal', 'Categoria', 'Cliente', 'Conhecimento', 'Data de criação', 'Data de conclusão', 'Fila',
  'Integração', 'Origem', 'Prazo', 'Prioridade', 'Responsável', 'SLA', 'Status', 'Tarefa', 'Tipo', 'Unidade',
];

export function RelatorioPersonalizado() {
  const [fieldsOpen, setFieldsOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [fieldSearch, setFieldSearch] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>(['Agente', 'Status', 'Responsável']);

  const visibleFields = useMemo(() => {
    const search = fieldSearch.trim().toLowerCase();
    return availableFields
      .filter((field) => !search || field.toLowerCase().includes(search))
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 10);
  }, [fieldSearch]);

  const toggleField = (field: string) => {
    setSelectedFields((current) => current.includes(field) ? current.filter((item) => item !== field) : [...current, field]);
  };

  return (
    <div className="v363-report-page">
      <header className="v363-report-header">
        <div>
          <h1>Relatório personalizado</h1>
          <p>Monte a consulta escolhendo campos, filtros e formato de exportação.</p>
        </div>
        <ExportAction filename="relatorio-personalizado" />
      </header>

      <section className="v363-builder-grid">
        <article className="v363-builder-box">
          <button className="v363-builder-toggle" onClick={() => setFieldsOpen((value) => !value)}>
            {fieldsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            <span>Campos do relatório</span>
            <small>{selectedFields.length} selecionados</small>
          </button>

          {fieldsOpen && (
            <div className="v363-builder-content">
              <label className="v363-filter-search">
                <Search size={18} />
                <input value={fieldSearch} onChange={(event) => setFieldSearch(event.target.value)} placeholder="Buscar campos..." />
              </label>

              <div className="v363-field-list">
                {visibleFields.map((field) => (
                  <label key={field}>
                    <input type="checkbox" checked={selectedFields.includes(field)} onChange={() => toggleField(field)} />
                    <span>{field}</span>
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
            <small>Consulta dinâmica</small>
          </button>

          {filtersOpen && (
            <div className="v363-builder-content v363-filter-two-cols">
              <label>Campo<select><option>Agente</option><option>Status</option><option>Responsável</option><option>Canal</option></select></label>
              <label>Operador<select><option>É</option><option>Contém</option><option>Diferente de</option><option>Maior que</option></select></label>
              <label className="span-2">Valor<input placeholder="Informe o valor do filtro..." /></label>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

export default RelatorioPersonalizado;
