import { BellPlus, MessageCircle, Plus, Search, Send, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { normalizeFilterText } from '../components/SmartFilters';
import { showAppToast } from '../lib/appToast';

type AlertRecord = {
  id: string;
  descricao: string;
  status: 'Novo' | 'Em andamento' | 'Concluído';
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  responsavel: string;
  canais: string[];
  mensagem: string;
  tarefas: number;
};

const initialAlerts: AlertRecord[] = [
  { id: 'ALT-001', descricao: 'Acompanhar alteração operacional relevante', status: 'Em andamento', prioridade: 'Média', responsavel: 'Moises Mattos', canais: ['Widget', 'E-mail'], mensagem: 'Atenção para atualização operacional.', tarefas: 1 },
  { id: 'ALT-002', descricao: 'Monitorar publicação externa cadastrada', status: 'Novo', prioridade: 'Alta', responsavel: 'Bruno Oliveira', canais: ['WhatsApp'], mensagem: 'Nova publicação precisa ser revisada.', tarefas: 2 },
];

const emptyAlert: AlertRecord = {
  id: '',
  descricao: '',
  status: 'Novo',
  prioridade: 'Média',
  responsavel: '',
  canais: [],
  mensagem: '',
  tarefas: 0,
};

const channelOptions = ['Widget', 'E-mail', 'WhatsApp', 'Telegram', 'Teams', 'Discord'];

function toggleItem(value: string, list: string[]) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function Alertas() {
  const [items, setItems] = useState(initialAlerts);
  const [form, setForm] = useState(emptyAlert);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');

  const filtered = useMemo(() => {
    const normalized = normalizeFilterText(query);
    return items.filter((item) => {
      const text = normalizeFilterText(Object.values(item).flat().join(' '));
      return (!normalized || text.includes(normalized)) && (!status || item.status === status);
    });
  }, [items, query, status]);

  const update = <K extends keyof AlertRecord>(key: K, value: AlertRecord[K]) => setForm((current) => ({ ...current, [key]: value }));

  const save = () => {
    if (!form.descricao.trim()) {
      showAppToast('Informe a descrição do alerta.', 'warning');
      return;
    }

    setItems((current) => [{ ...form, id: `ALT-${String(current.length + 1).padStart(3, '0')}` }, ...current]);
    setOpen(false);
    setForm(emptyAlert);
    showAppToast('Alerta cadastrado.', 'success');
  };

  return (
    <>
      <PageHeader title="Alertas" action={<button className="primary-small" onClick={() => setOpen(true)}><BellPlus size={16} /> Cadastrar alerta</button>} />

      <section className="card alerts-clean-card">
        <div className="section-title-row">
          <div>
            <h3>Alertas registrados</h3>
            <p className="section-description">Alertas podem ser disparados por canais configurados e vinculados a tarefas, conhecimentos e atendimentos.</p>
          </div>
          <span className="small-muted">{filtered.length} registros</span>
        </div>

        <div className="alert-filter-grid">
          <div className="smart-search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar alerta, canal, responsável ou mensagem..." />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos os status</option>
            <option>Novo</option>
            <option>Em andamento</option>
            <option>Concluído</option>
          </select>
        </div>

        <div className="simple-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Descrição do alerta</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Responsável</th>
                <th>Canais de disparo</th>
                <th>Tarefas</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.descricao}</strong><span className="table-subtitle">{item.id} • {item.mensagem}</span></td>
                  <td><Badge tone="blue">{item.status}</Badge></td>
                  <td><Badge tone={item.prioridade === 'Alta' || item.prioridade === 'Crítica' ? 'orange' : 'blue'}>{item.prioridade}</Badge></td>
                  <td>{item.responsavel}</td>
                  <td><div className="chip-list">{item.canais.map((canal) => <span key={canal}>{canal}</span>)}</div></td>
                  <td>{item.tarefas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {open && (
        <div className="modal-backdrop cadastro-modal-backdrop">
          <div className="agent-modal">
            <div className="cadastro-modal-header">
              <strong>Cadastrar alerta</strong>
              <button className="icon-btn" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>

            <div className="cadastro-modal-content">
              <section className="cadastro-form-section">
                <h3>Dados do alerta</h3>
                <div className="cadastro-form-grid">
                  <label className="span-2"><span>Descrição *</span><input value={form.descricao} onChange={(event) => update('descricao', event.target.value)} placeholder="Descreva o alerta de forma objetiva." /></label>
                  <label><span>Prioridade</span><select value={form.prioridade} onChange={(event) => update('prioridade', event.target.value as AlertRecord['prioridade'])}><option>Baixa</option><option>Média</option><option>Alta</option><option>Crítica</option></select></label>
                  <label><span>Responsável</span><input value={form.responsavel} onChange={(event) => update('responsavel', event.target.value)} placeholder="Responsável pelo acompanhamento" /></label>
                  <label className="span-2"><span>Mensagem</span><textarea value={form.mensagem} onChange={(event) => update('mensagem', event.target.value)} placeholder="Mensagem que será enviada pelos canais selecionados." /></label>
                </div>
              </section>

              <section className="cadastro-form-section">
                <h3>Canais de disparo</h3>
                <div className="option-columns three">
                  {channelOptions.map((canal) => (
                    <label key={canal}><input type="checkbox" checked={form.canais.includes(canal)} onChange={() => update('canais', toggleItem(canal, form.canais))} /> {canal}</label>
                  ))}
                </div>
              </section>
            </div>

            <div className="cadastro-modal-footer">
              <button onClick={() => setOpen(false)}>Cancelar</button>
              <button className="primary" onClick={save}><Send size={16} /> Salvar e preparar disparo</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Alertas;
