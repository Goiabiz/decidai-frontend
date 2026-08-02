import { Bot, CalendarDays, Download, Filter, KeyRound, Search, ShieldCheck, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/Badge';
import { normalizeFilterText } from '../../components/SmartFilters';

const logs = [
  { id: 'AUD-001', data: '2026-08-01 20:42', usuario: 'Moises Mattos', modulo: 'Integrações', acao: 'Conector API criado', tipo: 'API', criticidade: 'Média' },
  { id: 'AUD-002', data: '2026-08-01 20:30', usuario: 'SUSi', modulo: 'Agentes', acao: 'Sugestão de fluxo gerada', tipo: 'Agente', criticidade: 'Baixa' },
  { id: 'AUD-003', data: '2026-08-01 19:58', usuario: 'Bruno Oliveira', modulo: 'Campos', acao: 'Campo externo vinculado', tipo: 'Dados', criticidade: 'Alta' },
];

export function SegurancaAuditoria() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');

  const filtered = useMemo(() => {
    const normalized = normalizeFilterText(query);
    return logs.filter((item) => {
      const text = normalizeFilterText(Object.values(item).join(' '));
      return (!normalized || text.includes(normalized)) && (!type || item.tipo === type);
    });
  }, [query, type]);

  return (
    <>
      <PageHeader
        title="Auditoria"
        action={<button className="secondary-btn"><Download size={16} /> Exportar consulta</button>}
      />

      <section className="card audit-clean-card">
        <div className="section-title-row">
          <div>
            <h3>Consulta de logs</h3>
            <p className="section-description">Pesquise acessos, ações sensíveis, exportações, integrações e execuções do agente.</p>
          </div>
          <Badge tone="blue">{filtered.length} registros</Badge>
        </div>

        <div className="audit-filter-grid">
          <div className="smart-search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por usuário, módulo, ação, agente ou período..." />
          </div>
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">Todos os tipos</option>
            <option>API</option>
            <option>Agente</option>
            <option>Dados</option>
          </select>
          <button><CalendarDays size={16} /> Período</button>
          <button><Filter size={16} /> Filtros</button>
        </div>

        <div className="simple-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Usuário/Agente</th>
                <th>Módulo</th>
                <th>Ação</th>
                <th>Tipo</th>
                <th>Criticidade</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>{item.data}</td>
                  <td>{item.usuario}</td>
                  <td>{item.modulo}</td>
                  <td>{item.acao}</td>
                  <td>{item.tipo}</td>
                  <td><Badge tone={item.criticidade === 'Alta' ? 'orange' : 'blue'}>{item.criticidade}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export default SegurancaAuditoria;
