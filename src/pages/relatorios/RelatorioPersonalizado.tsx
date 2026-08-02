import { Download, FileSpreadsheet, Filter, LayoutList, Plus, Search } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';

const availableFields = ['ID', 'Título', 'Status', 'Prioridade', 'Responsável', 'Canal', 'Agente', 'Data de criação', 'Data de conclusão', 'Custo estimado', 'Origem', 'Cliente'];

export function RelatorioPersonalizado() {
  return (
    <>
      <PageHeader title="Relatório Personalizado" action={<button className="primary-small"><Plus size={16} /> Novo modelo</button>} />
      <section className="card custom-report-card">
        <div className="section-title-row"><div><h3>Montar relatório personalizado</h3><p className="section-description">Escolha origem, campos, filtros e agrupamentos. Exportações padrão em XLS e PDF paisagem.</p></div></div>
        <div className="report-builder-grid">
          <section><h4><LayoutList size={18} /> Origem</h4><select><option>Atendimentos</option><option>Alertas</option><option>Conhecimentos</option><option>Tarefas</option><option>Integrações</option><option>Auditoria</option></select></section>
          <section><h4><FileSpreadsheet size={18} /> Campos</h4><div className="report-field-list">{availableFields.map((field) => <label key={field}><input type="checkbox" defaultChecked={['ID', 'Título', 'Status', 'Responsável'].includes(field)} /> {field}</label>)}</div></section>
          <section><h4><Filter size={18} /> Filtros</h4><div className="smart-search"><Search size={16} /><input placeholder="Adicionar filtro..." /></div><button className="secondary-btn">Adicionar filtro</button></section>
          <section><h4><Download size={18} /> Exportação</h4><div className="export-actions"><button><FileSpreadsheet size={16} /> Exportar XLS</button><button><Download size={16} /> Exportar PDF paisagem</button></div></section>
        </div>
      </section>
    </>
  );
}

export default RelatorioPersonalizado;
