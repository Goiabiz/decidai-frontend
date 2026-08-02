import { useState } from 'react';
import { X } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { KpiCard } from '../../components/KpiCard';
import { Badge } from '../../components/Badge';
import { showAppToast } from '../../lib/appToast';

type ItemStatus = 'Ativo' | 'Em análise' | 'Pendente';
type ItemTipo = 'Serviço' | 'Fila' | 'Fluxo' | 'SLA';

type ConfigRecord = {
  id: string;
  tipo: ItemTipo;
  nome: string;
  resumo: string;
  status: ItemStatus;
};

const filas = ['Suporte Nível 1', 'Suporte Nível 2', 'Faturamento', 'Cadastros', 'Auditoria'];
const prioridades = ['Baixa', 'Média', 'Alta', 'Crítica'];

const emptyServico = { nome: '', descricao: '', fila: filas[0], status: 'Ativo' as ItemStatus };
const emptyFila = { nome: '', responsavel: '', capacidade: '', status: 'Ativo' as ItemStatus };
const emptyFluxo = { nome: '', origem: '', destino: '', status: 'Ativo' as ItemStatus };
const emptySla = { prioridade: prioridades[1], prazoHoras: '', horario: '08:00-18:00', status: 'Ativo' as ItemStatus };

const governanceItems: Array<{ tipo: ItemTipo; descricao: string; tag: string }> = [
  { tipo: 'Serviço', descricao: 'Tipo de trabalho tratado pela Central de Atendimento.', tag: 'Estrutura' },
  { tipo: 'Fila', descricao: 'Local de tratamento e responsabilidade operacional.', tag: 'Operação' },
  { tipo: 'Fluxo', descricao: 'Caminho do atendimento entre status e filas.', tag: 'Processo' },
  { tipo: 'SLA', descricao: 'Prazos por prioridade, horário e regra de pausa.', tag: 'Gestão' },
];

export function ServicosFilas() {
  const [itens, setItens] = useState<ConfigRecord[]>([]);
  const [activeModal, setActiveModal] = useState<ItemTipo | null>(null);

  const [formServico, setFormServico] = useState(emptyServico);
  const [formFila, setFormFila] = useState(emptyFila);
  const [formFluxo, setFormFluxo] = useState(emptyFluxo);
  const [formSla, setFormSla] = useState(emptySla);

  const addItem = (item: Omit<ConfigRecord, 'id'>) => {
    setItens((current) => [{ ...item, id: `CFG-${String(current.length + 1).padStart(3, '0')}` }, ...current]);
    setActiveModal(null);
    showAppToast(`${item.tipo} cadastrado.`, 'success');
  };

  const saveServico = () => {
    if (!formServico.nome.trim()) return showAppToast('Informe o nome do serviço.', 'warning');
    addItem({ tipo: 'Serviço', nome: formServico.nome, resumo: `Fila: ${formServico.fila}${formServico.descricao ? ' • ' + formServico.descricao : ''}`, status: formServico.status });
    setFormServico(emptyServico);
  };

  const saveFila = () => {
    if (!formFila.nome.trim()) return showAppToast('Informe o nome da fila.', 'warning');
    addItem({ tipo: 'Fila', nome: formFila.nome, resumo: `Responsável: ${formFila.responsavel || '-'} • Capacidade: ${formFila.capacidade || '-'}`, status: formFila.status });
    setFormFila(emptyFila);
  };

  const saveFluxo = () => {
    if (!formFluxo.nome.trim()) return showAppToast('Informe o nome do fluxo.', 'warning');
    addItem({ tipo: 'Fluxo', nome: formFluxo.nome, resumo: `${formFluxo.origem || '-'} → ${formFluxo.destino || '-'}`, status: formFluxo.status });
    setFormFluxo(emptyFluxo);
  };

  const saveSla = () => {
    if (!formSla.prazoHoras.trim()) return showAppToast('Informe o prazo do SLA.', 'warning');
    addItem({ tipo: 'SLA', nome: `Prioridade ${formSla.prioridade}`, resumo: `Prazo: ${formSla.prazoHoras}h • Horário: ${formSla.horario}`, status: formSla.status });
    setFormSla(emptySla);
  };

  return (
    <>
      <PageHeader title="Serviços e Filas" />

      <div className="kpi-grid four">
        <KpiCard label="Ativos" value={String(itens.filter((item) => item.status === 'Ativo').length)} trend="aguardando conexão" tone="green" />
        <KpiCard label="Em análise" value={String(itens.filter((item) => item.status === 'Em análise').length)} trend="sem pendência" tone="blue" />
        <KpiCard label="Pendentes" value={String(itens.filter((item) => item.status === 'Pendente').length)} trend="sem atraso" tone="orange" />
        <KpiCard label="Arquivados" value="0" trend="histórico" tone="purple" />
      </div>

      <section className="workspace-settings-panel">
        <div className="workspace-settings-header">
          <div>
            <h2>Serviços e Filas</h2>
            <p>Configuração de tipos de atendimento, filas, fluxo, SLA, canais e ações permitidas.</p>
          </div>
          <span className="badge badge-blue">Funcionalidade</span>
        </div>

        <div className="governance-list">
          {governanceItems.map((item) => (
            <div className="governance-list-row" key={item.tipo}>
              <div>
                <strong>{item.tipo}</strong>
                <span>{item.descricao}</span>
                <small>{item.tag}</small>
              </div>
              <button className="secondary-btn" onClick={() => setActiveModal(item.tipo)}>Cadastrar {item.tipo.toLowerCase()}</button>
            </div>
          ))}
        </div>
      </section>

      <section className="card roadmap-card">
        <div className="section-title-row">
          <h3>Itens cadastrados</h3>
          <span className="small-muted">{itens.length} registros</span>
        </div>
        {itens.length === 0 ? (
          <p className="empty-note">Tela estruturada para a próxima etapa de modelagem e conexão com Supabase.</p>
        ) : (
          <div className="simple-table-wrap">
            <table>
              <thead>
                <tr><th>Tipo</th><th>Nome</th><th>Detalhe</th><th>Status</th></tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <tr key={item.id}>
                    <td><Badge tone="blue">{item.tipo}</Badge></td>
                    <td><strong>{item.nome}</strong></td>
                    <td className="table-subtitle">{item.resumo}</td>
                    <td><Badge tone={item.status === 'Ativo' ? 'green' : item.status === 'Pendente' ? 'orange' : 'blue'}>{item.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {activeModal === 'Serviço' && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="agent-modal">
            <div className="cadastro-modal-header">
              <strong>Novo serviço</strong>
              <button className="icon-btn" onClick={() => setActiveModal(null)}><X size={18} /></button>
            </div>
            <div className="cadastro-modal-content">
              <section className="cadastro-form-section">
                <h3>Dados do serviço</h3>
                <div className="cadastro-form-grid">
                  <label className="span-2"><span>Nome *</span><input value={formServico.nome} onChange={(event) => setFormServico((c) => ({ ...c, nome: event.target.value }))} placeholder="Nome do serviço" /></label>
                  <label><span>Fila</span><select value={formServico.fila} onChange={(event) => setFormServico((c) => ({ ...c, fila: event.target.value }))}>{filas.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label><span>Status</span><select value={formServico.status} onChange={(event) => setFormServico((c) => ({ ...c, status: event.target.value as ItemStatus }))}><option>Ativo</option><option>Em análise</option><option>Pendente</option></select></label>
                  <label className="span-2"><span>Descrição</span><textarea value={formServico.descricao} onChange={(event) => setFormServico((c) => ({ ...c, descricao: event.target.value }))} placeholder="Descreva o tipo de trabalho tratado por este serviço." /></label>
                </div>
              </section>
            </div>
            <div className="cadastro-modal-footer">
              <button onClick={() => setActiveModal(null)}>Cancelar</button>
              <button className="primary" onClick={saveServico}>Salvar serviço</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'Fila' && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="agent-modal">
            <div className="cadastro-modal-header">
              <strong>Nova fila</strong>
              <button className="icon-btn" onClick={() => setActiveModal(null)}><X size={18} /></button>
            </div>
            <div className="cadastro-modal-content">
              <section className="cadastro-form-section">
                <h3>Dados da fila</h3>
                <div className="cadastro-form-grid">
                  <label className="span-2"><span>Nome *</span><input value={formFila.nome} onChange={(event) => setFormFila((c) => ({ ...c, nome: event.target.value }))} placeholder="Nome da fila" /></label>
                  <label><span>Responsável</span><input value={formFila.responsavel} onChange={(event) => setFormFila((c) => ({ ...c, responsavel: event.target.value }))} placeholder="Responsável pela fila" /></label>
                  <label><span>Capacidade</span><input value={formFila.capacidade} onChange={(event) => setFormFila((c) => ({ ...c, capacidade: event.target.value }))} placeholder="Ex.: 20 atendimentos/dia" /></label>
                  <label><span>Status</span><select value={formFila.status} onChange={(event) => setFormFila((c) => ({ ...c, status: event.target.value as ItemStatus }))}><option>Ativo</option><option>Em análise</option><option>Pendente</option></select></label>
                </div>
              </section>
            </div>
            <div className="cadastro-modal-footer">
              <button onClick={() => setActiveModal(null)}>Cancelar</button>
              <button className="primary" onClick={saveFila}>Salvar fila</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'Fluxo' && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="agent-modal">
            <div className="cadastro-modal-header">
              <strong>Novo fluxo</strong>
              <button className="icon-btn" onClick={() => setActiveModal(null)}><X size={18} /></button>
            </div>
            <div className="cadastro-modal-content">
              <section className="cadastro-form-section">
                <h3>Dados do fluxo</h3>
                <div className="cadastro-form-grid">
                  <label className="span-2"><span>Nome *</span><input value={formFluxo.nome} onChange={(event) => setFormFluxo((c) => ({ ...c, nome: event.target.value }))} placeholder="Nome do fluxo" /></label>
                  <label><span>Status de origem</span><input value={formFluxo.origem} onChange={(event) => setFormFluxo((c) => ({ ...c, origem: event.target.value }))} placeholder="Ex.: Novo" /></label>
                  <label><span>Status de destino</span><input value={formFluxo.destino} onChange={(event) => setFormFluxo((c) => ({ ...c, destino: event.target.value }))} placeholder="Ex.: Em andamento" /></label>
                  <label><span>Status</span><select value={formFluxo.status} onChange={(event) => setFormFluxo((c) => ({ ...c, status: event.target.value as ItemStatus }))}><option>Ativo</option><option>Em análise</option><option>Pendente</option></select></label>
                </div>
              </section>
            </div>
            <div className="cadastro-modal-footer">
              <button onClick={() => setActiveModal(null)}>Cancelar</button>
              <button className="primary" onClick={saveFluxo}>Salvar fluxo</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'SLA' && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="agent-modal">
            <div className="cadastro-modal-header">
              <strong>Novo SLA</strong>
              <button className="icon-btn" onClick={() => setActiveModal(null)}><X size={18} /></button>
            </div>
            <div className="cadastro-modal-content">
              <section className="cadastro-form-section">
                <h3>Dados do SLA</h3>
                <div className="cadastro-form-grid">
                  <label><span>Prioridade</span><select value={formSla.prioridade} onChange={(event) => setFormSla((c) => ({ ...c, prioridade: event.target.value }))}>{prioridades.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label><span>Prazo (horas) *</span><input value={formSla.prazoHoras} onChange={(event) => setFormSla((c) => ({ ...c, prazoHoras: event.target.value }))} placeholder="Ex.: 4" /></label>
                  <label><span>Horário de atendimento</span><input value={formSla.horario} onChange={(event) => setFormSla((c) => ({ ...c, horario: event.target.value }))} placeholder="Ex.: 08:00-18:00" /></label>
                  <label><span>Status</span><select value={formSla.status} onChange={(event) => setFormSla((c) => ({ ...c, status: event.target.value as ItemStatus }))}><option>Ativo</option><option>Em análise</option><option>Pendente</option></select></label>
                </div>
              </section>
            </div>
            <div className="cadastro-modal-footer">
              <button onClick={() => setActiveModal(null)}>Cancelar</button>
              <button className="primary" onClick={saveSla}>Salvar SLA</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
