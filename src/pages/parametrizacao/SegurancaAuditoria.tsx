import { CalendarDays, Filter, ListChecks, Search, ShieldCheck, UserRound } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Badge } from '../../components/Badge';

const logs = [
  { id: 'AUD-001', data: 'Hoje 10:42', usuario: 'Moises Mattos', modulo: 'Integrações', acao: 'Teste de conexão', agente: 'SUSi', criticidade: 'Baixa' },
  { id: 'AUD-002', data: 'Hoje 09:10', usuario: 'Sistema', modulo: 'Agentes', acao: 'Execução simulada', agente: 'Biel', criticidade: 'Média' },
  { id: 'AUD-003', data: 'Ontem 18:05', usuario: 'Administrador', modulo: 'Campos', acao: 'Exclusão confirmada', agente: '-', criticidade: 'Alta' },
];

function tone(criticidade: string) {
  if (criticidade === 'Alta') return 'orange';
  if (criticidade === 'Média') return 'blue';
  return 'green';
}

export function SegurancaAuditoria() {
  return (
    <>
      <PageHeader title="Auditoria" />

      <section className="card audit-list-card">
        <div className="section-title-row">
          <div>
            <h3>Consulta de auditoria</h3>
            <p className="section-description">Pesquise ações de usuários, agentes, integrações, exportações e operações sensíveis.</p>
          </div>
        </div>

        <div className="audit-filter-row">
          <div className="smart-search"><Search size={18} /><input placeholder="Buscar usuário, módulo, ação ou agente..." /></div>
          <select><option>Todos os módulos</option><option>Agentes</option><option>Integrações</option><option>Campos</option></select>
          <select><option>Período</option><option>Hoje</option><option>7 dias</option><option>30 dias</option></select>
        </div>

        <div className="cadastro-table-wrap full">
          <table>
            <thead><tr><th>Registro</th><th>Data</th><th>Usuário</th><th>Módulo</th><th>Ação</th><th>Agente</th><th>Criticidade</th></tr></thead>
            <tbody>{logs.map((log) => <tr key={log.id}><td><strong>{log.id}</strong></td><td>{log.data}</td><td><UserRound size={14} /> {log.usuario}</td><td>{log.modulo}</td><td>{log.acao}</td><td>{log.agente}</td><td><Badge tone={tone(log.criticidade)}>{log.criticidade}</Badge></td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export default SegurancaAuditoria;
