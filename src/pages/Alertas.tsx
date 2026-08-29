import { BellPlus, Search, Send, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { BrandIcon } from '../components/BrandIcon';
import { normalizeFilterText } from '../components/SmartFilters';
import { showAppToast } from '../lib/appToast';
import { useSession } from '../contexts/SessionContext';
import { createAlerta, listAlertas, type AlertRecord } from '../services/alertas';
import { listChannels, type ChannelRecord } from '../services/canaisAgentes';
import { providerDomain } from '../services/v35Supabase';

type AlertFormState = Omit<AlertRecord, 'id' | 'enviados'>;

const emptyAlert: AlertFormState = {
  descricao: '',
  status: 'Novo',
  prioridade: 'Média',
  responsavel: '',
  canais: [],
  mensagem: '',
  tarefas: 0,
  duracaoHoras: undefined,
};

function toggleItem(value: string, list: string[]) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function channelDomain(channel: ChannelRecord) {
  return providerDomain({ code: channel.providerCode, logo_hint: null, name: channel.providerName }) || undefined;
}

// Reforma de arquitetura 29/08 -- referência de conversão pra React Query. Antes: useState
// items/loading + useEffect + Promise.all, refetch do zero toda vez que a tela remontava
// (sem cache nenhum). Depois: useQuery cuida de loading/erro/cache sozinho (staleTime global
// de 30s, main.tsx) e useMutation troca o "setItems local depois de criar" por
// invalidateQueries -- refetch real, sem o estado da tela e o dado do banco poderem divergir.
export function Alertas() {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;
  const queryClient = useQueryClient();

  const alertasQuery = useQuery({
    queryKey: ['alertas', clienteId],
    queryFn: () => listAlertas(clienteId as string),
    enabled: !!clienteId,
  });
  const channelsQuery = useQuery({
    queryKey: ['canais-agentes', clienteId],
    queryFn: () => listChannels(clienteId as string),
    enabled: !!clienteId,
  });

  const items = alertasQuery.data?.items ?? [];
  const channels = channelsQuery.data?.items ?? [];
  const loading = alertasQuery.isLoading || channelsQuery.isLoading;

  const [form, setForm] = useState<AlertFormState>(emptyAlert);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');

  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof createAlerta>[0]) => createAlerta(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas', clienteId] });
      setOpen(false);
      setForm(emptyAlert);
      showAppToast('Alerta cadastrado.', 'success');
    },
  });

  const channelName = (id: string) => channels.find((channel: ChannelRecord) => channel.id === id)?.nome || id;

  const filtered = useMemo(() => {
    const normalized = normalizeFilterText(query);
    return items.filter((item) => {
      const text = normalizeFilterText(Object.values(item).flat().join(' '));
      return (!normalized || text.includes(normalized)) && (!status || item.status === status);
    });
  }, [items, query, status]);

  const update = <K extends keyof AlertFormState>(key: K, value: AlertFormState[K]) => setForm((current) => ({ ...current, [key]: value }));

  const save = () => {
    if (!form.descricao.trim()) {
      showAppToast('Informe a descrição do alerta.', 'warning');
      return;
    }
    if (!clienteId) {
      showAppToast('Acesse o contexto de um cliente antes de cadastrar.', 'warning');
      return;
    }
    createMutation.mutate({ clienteId, ...form });
  };

  if (!clienteId) {
    return (
      <>
        <PageHeader title="Alertas" />
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>
          Acesse o contexto de um cliente para ver os alertas dele.
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Alertas" action={<button className="primary-small" onClick={() => setOpen(true)}><BellPlus size={16} /> Cadastrar alerta</button>} />

      <section className="card alerts-clean-card">
        {loading && <p className="section-description">Carregando...</p>}
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
                <th>Enviado para</th>
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
                  <td>
                    <div className="chip-list channel-chip-list">
                      {item.canais.map((canal) => {
                        const channel = channels.find((c) => c.id === canal);
                        return (
                          <span key={canal} className="channel-chip">
                            <BrandIcon label={channelName(canal)} domain={channel ? channelDomain(channel) : undefined} size={18} />
                            {channelName(canal)}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="alert-audience-cell" title="Canais de disparo registrados — ainda não existe confirmação de leitura no produto">
                    {item.enviados} canal(is)
                  </td>
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
                <p className="section-description">Só os canais já configurados neste ambiente aparecem aqui.</p>
                {channels.length === 0 ? (
                  <p className="section-description">Nenhum canal configurado ainda — cadastre em Parametrização → Canais de Atendimento.</p>
                ) : (
                  <div className="option-columns three">
                    {channels.map((canal) => (
                      <label key={canal.id} className="channel-option-label">
                        <input type="checkbox" checked={form.canais.includes(canal.id)} onChange={() => update('canais', toggleItem(canal.id, form.canais))} />
                        <BrandIcon label={canal.nome} domain={channelDomain(canal)} size={20} />
                        {canal.nome}
                        {canal.status !== 'Ativo' && <Badge tone="yellow">{canal.status}</Badge>}
                      </label>
                    ))}
                  </div>
                )}
              </section>

              <section className="cadastro-form-section">
                <h3>Duração de exibição</h3>
                <p className="section-description">Opcional — use para alertas de emergência que precisam ficar visíveis por mais tempo que o padrão.</p>
                <div className="alert-duration-row">
                  <label className="inline-check">
                    <input
                      type="checkbox"
                      checked={form.duracaoHoras !== undefined}
                      onChange={(event) => update('duracaoHoras', event.target.checked ? 24 : undefined)}
                    />
                    Definir duração de exibição
                  </label>
                  {form.duracaoHoras !== undefined && (
                    <label className="alert-duration-input"><span>Manter visível por (horas)</span>
                      <input
                        type="number"
                        min={1}
                        value={form.duracaoHoras}
                        onChange={(event) => update('duracaoHoras', Number(event.target.value) || 1)}
                      />
                    </label>
                  )}
                </div>
              </section>
            </div>

            <div className="cadastro-modal-footer">
              <button onClick={() => setOpen(false)}>Cancelar</button>
              <button className="primary" onClick={save} disabled={createMutation.isPending}><Send size={16} /> {createMutation.isPending ? 'Salvando...' : 'Salvar e preparar disparo'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Alertas;
