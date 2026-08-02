import { useMemo, useState } from 'react';
import { Bot, CheckCircle2, Clock, Inbox, PackagePlus, PanelRightOpen, Plus, Search, Send, X } from 'lucide-react';

export type CentralAtendimentoProps = { onSelectDetail?: (detail: any) => void; onOpenDetail?: (detail: any) => void };

const kpis = [
  ['Demandas abertas', 4, Inbox, '#00875a'],
  ['Novas demandas', 1, PackagePlus, '#0f62fe'],
  ['Aguardando resposta', 1, Clock, '#ff8b22'],
  ['Em andamento', 2, Send, '#00a6d6'],
  ['Concluídas hoje', 0, CheckCircle2, '#00875a'],
];

type Demanda = {
  id: string;
  canal: string;
  solicitante: string;
  assunto: string;
  status: 'Novo' | 'Em andamento' | 'Aguardando resposta' | 'Concluído';
  prioridade: 'Alta' | 'Média' | 'Baixa';
  mensagem: string;
};

const demandas: Demanda[] = [
  { id: 'ATD-20260802-0001', canal: 'E-mail', solicitante: 'cliente@exemplo.com', assunto: 'Demanda recebida por e-mail', status: 'Novo', prioridade: 'Alta', mensagem: 'Mensagem recebida pelo canal integrado. O atendimento pode gerar tarefa, alerta, conhecimento ou ação externa.' },
  { id: 'ATD-20260801-0002', canal: 'WhatsApp', solicitante: '+55 (11) 99999-0002', assunto: 'Dúvida sobre faturamento BPA-I', status: 'Em andamento', prioridade: 'Média', mensagem: 'Solicitante relata divergência no faturamento do mês corrente, aguardando validação da regra aplicada.' },
  { id: 'ATD-20260801-0003', canal: 'Widget', solicitante: 'visitante@site.gov.br', assunto: 'Solicitação de acesso ao sistema', status: 'Aguardando resposta', prioridade: 'Baixa', mensagem: 'Usuário solicitou liberação de acesso via widget do site institucional.' },
  { id: 'ATD-20260731-0004', canal: 'API', solicitante: 'Integração Jira', assunto: 'Ticket sincronizado automaticamente', status: 'Em andamento', prioridade: 'Média', mensagem: 'Ticket criado automaticamente a partir da integração configurada com o Jira.' },
];

const statusTone: Record<Demanda['status'], string> = {
  'Novo': '#0f62fe',
  'Em andamento': '#00a6d6',
  'Aguardando resposta': '#ff8b22',
  'Concluído': '#00875a',
};

export function CentralAtendimento(_props: CentralAtendimentoProps) {
  const [modal, setModal] = useState(false);
  const [side, setSide] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(demandas[0].id);
  const [resposta, setResposta] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return demandas;
    return demandas.filter((item) => `${item.canal} ${item.solicitante} ${item.assunto}`.toLowerCase().includes(q));
  }, [query]);

  const selected = demandas.find((item) => item.id === selectedId) || demandas[0];

  return (
    <div className="v3464-page">
      <div className="v3464-page-head">
        <h1>Atendimentos</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          {!side && (
            <button className="v3464-btn secondary" onClick={() => setSide(true)}><PanelRightOpen size={16} /> Mostrar resumo</button>
          )}
          <button className="v3464-btn primary" onClick={() => setModal(true)}><Plus size={16} />Novo atendimento</button>
        </div>
      </div>

      <div className="v3464-kpis">
        {kpis.map(([t, n, I, c]: any) => (
          <div className="v3464-kpi" key={t}>
            <span className="v3464-kpi-icon" style={{ background: c }}><I size={22} /></span>
            <div><strong>{t}</strong><h2>{n}</h2></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: side ? '300px minmax(0, 1fr) 320px' : '300px minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
        <section className="v3464-card" style={{ padding: 12 }}>
          <div className="v3464-search" style={{ margin: '0 0 10px' }}>
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar demanda, canal ou solicitante..." />
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                style={{
                  textAlign: 'left',
                  border: `1px solid ${item.id === selectedId ? 'var(--v3464-green)' : 'var(--v3464-border)'}`,
                  borderRadius: 14,
                  padding: '10px 12px',
                  background: item.id === selectedId ? 'var(--v3464-green-soft)' : 'var(--v3464-card)',
                  color: 'var(--v3464-text)',
                  cursor: 'pointer',
                  display: 'grid',
                  gap: 4,
                }}
              >
                <small style={{ color: 'var(--v3464-muted)' }}>{item.id}</small>
                <strong style={{ fontSize: 13 }}>{item.assunto}</strong>
                <span style={{ fontSize: 12, color: 'var(--v3464-muted)' }}>{item.canal} • {item.solicitante}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: statusTone[item.status] }}>{item.status}</span>
              </button>
            ))}
            {filtered.length === 0 && <p style={{ color: 'var(--v3464-muted)' }}>Nenhuma demanda encontrada.</p>}
          </div>
        </section>

        <section className="v3464-card">
          <h2>{selected.assunto}</h2>
          <p>{selected.canal} • {selected.solicitante}</p>
          <div className="v3464-side-box">
            <strong>{selected.solicitante}</strong>
            <p>{selected.mensagem}</p>
          </div>
          <textarea value={resposta} onChange={(event) => setResposta(event.target.value)} placeholder="Escreva uma resposta ou orientação..." style={{ width: '100%', minHeight: 90 }} />
          <footer style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <button className="v3464-btn secondary">Anexar</button>
            <button className="v3464-btn secondary"><Bot size={16} />Acionar agente</button>
            <button className="v3464-btn secondary"><Plus size={16} />Gerar ação</button>
            <button className="v3464-btn primary" onClick={() => setResposta('')}>Responder</button>
          </footer>
        </section>

        {side && (
          <aside className="v3464-side-panel">
            <button className="v3464-icon" style={{ float: 'right' }} onClick={() => setSide(false)}><X size={16} /></button>
            <h2>Resumo</h2>
            {[
              `Status|${selected.status}`,
              `Prioridade|${selected.prioridade}`,
              `Fila|Suporte operacional`,
              `Origem|${selected.canal} • ${selected.solicitante}`,
            ].map((x) => {
              const [a, b] = x.split('|');
              return <div className="v3464-side-box" key={a}><strong>{a}</strong><p>{b}</p></div>;
            })}
          </aside>
        )}
      </div>

      {modal && (
        <div className="v3464-modal-backdrop">
          <section className="v3464-system-modal">
            <button className="v3464-modal-x" onClick={() => setModal(false)}>×</button>
            <h2>Novo atendimento</h2>
            <p>Registre uma demanda de e-mail, ticket, API, integração ou atendimento manual.</p>
            <div className="v3464-modal-form">
              <label>Origem<select><option>E-mail</option><option>WhatsApp</option><option>Widget</option><option>API</option><option>Manual</option></select></label>
              <label>Solicitante<input /></label>
              <label>Resumo<textarea /></label>
            </div>
            <footer>
              <button className="v3464-secondary-btn" onClick={() => setModal(false)}>Cancelar</button>
              <button className="v3464-primary-btn" onClick={() => setModal(false)}>Salvar atendimento</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

export default CentralAtendimento;
