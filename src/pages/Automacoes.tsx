import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, PauseCircle, Play, Plus, Search, Sparkles, Trash2, Zap } from 'lucide-react';
import { Badge } from '../components/Badge';
import { showAppToast } from '../lib/appToast';
import { formatDate } from '../lib/formatDate';
import { useSession } from '../contexts/SessionContext';
import {
  acoesProntas,
  deleteAutomationRule,
  entidadesDisponiveis,
  getAutomationQuota,
  gatilhosProntos,
  listAutomationRules,
  operadores,
  runAutomationNow,
  saveAutomationRule,
  setAutomationRuleStatus,
  statusLabels,
  templatesPropostos,
  type Acao,
  type AcaoTipo,
  type AutomationQuota,
  type AutomationRule,
  type AutomationTemplate,
  type Condicao,
  type Gatilho,
  type GatilhoTipo,
  type Operador,
} from '../services/automacoes';

const STATUS_TONE: Record<string, string> = {
  ativa: 'status-concluido',
  rascunho: 'status-novo',
  pausada: 'status-andamento',
  pausada_por_loop: 'status-cancelado',
};

type FormState = {
  id: string | null;
  nome: string;
  descricao: string;
  status: 'rascunho' | 'ativa' | 'pausada';
  gatilhoTipo: GatilhoTipo;
  entidade: string;
  statusPara: string;
  condicoes: Condicao[];
  acoes: Acao[];
  origemTemplate: string | null;
};

const FORM_VAZIO: FormState = {
  id: null,
  nome: '',
  descricao: '',
  status: 'rascunho',
  gatilhoTipo: 'mudanca_status',
  entidade: 'crm_casos',
  statusPara: 'ganho',
  condicoes: [],
  acoes: [{ tipo: 'criar_tarefa', descricao: '' }],
  origemTemplate: null,
};

/** Campos que cada ação real precisa. Só as 3 com executor ligado hoje têm formulário. */
const CAMPOS_POR_ACAO: Partial<Record<AcaoTipo, { chave: string; rotulo: string; placeholder: string }[]>> = {
  criar_tarefa: [
    { chave: 'descricao', rotulo: 'Descrição da tarefa', placeholder: 'Ex.: Onboarding do cliente novo' },
    { chave: 'responsavel', rotulo: 'Responsável (opcional)', placeholder: 'Ex.: Equipe de Onboarding' },
  ],
  enviar_alerta: [
    { chave: 'descricao', rotulo: 'Título do alerta', placeholder: 'Ex.: Caso de alto valor fechado' },
    { chave: 'mensagem', rotulo: 'Mensagem', placeholder: 'O que a equipe precisa saber' },
  ],
  notificar_usuario: [
    { chave: 'responsavel', rotulo: 'Notificar quem', placeholder: 'Ex.: Equipe Comercial' },
    { chave: 'mensagem', rotulo: 'Mensagem', placeholder: 'O que avisar' },
  ],
};

export function Automacoes() {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;

  const [items, setItems] = useState<AutomationRule[]>([]);
  const [quota, setQuota] = useState<AutomationQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mostrarTemplates, setMostrarTemplates] = useState(false);

  const recarregar = () => {
    if (!clienteId) return;
    listAutomationRules(clienteId).then(setItems);
    getAutomationQuota(clienteId).then(setQuota);
  };

  useEffect(() => {
    if (!clienteId) { setLoading(false); return; }
    setLoading(true);
    getAutomationQuota(clienteId).then(setQuota);
    listAutomationRules(clienteId).then(setItems).finally(() => setLoading(false));
  }, [clienteId]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => [item.nome, item.descricao ?? ''].join(' ').toLowerCase().includes(normalized));
  }, [items, query]);

  const kpis: Array<[string, number, typeof Zap, string]> = [
    ['Ativas', items.filter((r) => r.status === 'ativa').length, CheckCircle2, '#00875a'],
    ['Rascunho', items.filter((r) => r.status === 'rascunho').length, Plus, '#00a6d6'],
    ['Pausadas', items.filter((r) => r.status === 'pausada').length, PauseCircle, '#ff8b22'],
    ['Pausadas automaticamente', items.filter((r) => r.status === 'pausada_por_loop').length, AlertTriangle, '#d64545'],
  ];

  const abrirNova = () => { setForm({ ...FORM_VAZIO }); setMostrarTemplates(false); };

  const abrirEdicao = (rule: AutomationRule) => {
    setForm({
      id: rule.id,
      nome: rule.nome,
      descricao: rule.descricao || '',
      status: rule.status === 'pausada_por_loop' ? 'pausada' : rule.status,
      gatilhoTipo: rule.gatilho?.tipo || 'mudanca_status',
      entidade: rule.gatilho?.entidade || 'crm_casos',
      statusPara: rule.gatilho?.para || '',
      condicoes: rule.condicoes || [],
      acoes: rule.acoes?.length ? rule.acoes : [{ tipo: 'criar_tarefa', descricao: '' }],
      origemTemplate: rule.origem_template,
    });
    setMostrarTemplates(false);
  };

  const usarTemplate = (template: AutomationTemplate) => {
    setForm({
      id: null,
      nome: template.nome,
      descricao: template.descricao,
      status: 'rascunho',
      gatilhoTipo: template.gatilho.tipo,
      entidade: template.gatilho.entidade || 'crm_casos',
      statusPara: template.gatilho.para || '',
      condicoes: template.condicoes,
      acoes: template.acoes,
      origemTemplate: template.codigo,
    });
    setMostrarTemplates(false);
  };

  const salvar = async () => {
    if (!form || !clienteId) return;
    setSalvando(true);
    try {
      const gatilho: Gatilho = { tipo: form.gatilhoTipo, entidade: form.entidade };
      if (form.gatilhoTipo === 'mudanca_status' && form.statusPara.trim()) gatilho.para = form.statusPara.trim();

      const result = await saveAutomationRule(clienteId, {
        id: form.id,
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        status: form.status,
        gatilho,
        condicoes: form.condicoes.filter((c) => c.campo?.trim()),
        acoes: form.acoes,
        origemTemplate: form.origemTemplate,
      });
      if (!result.ok) { showAppToast(result.error || 'Não foi possível salvar a automação.', 'error'); return; }
      showAppToast(form.id ? 'Automação atualizada.' : 'Automação criada.', 'success');
      setForm(null);
      recarregar();
    } finally {
      setSalvando(false);
    }
  };

  const alternarStatus = async (rule: AutomationRule) => {
    if (!clienteId) return;
    const novo = rule.status === 'ativa' ? 'pausada' : 'ativa';
    const result = await setAutomationRuleStatus(clienteId, rule.id, novo);
    if (!result.ok) { showAppToast(result.error || 'Não foi possível alterar o status.', 'error'); return; }
    showAppToast(novo === 'ativa' ? 'Automação ativada.' : 'Automação pausada.', 'success');
    recarregar();
  };

  const excluir = async (rule: AutomationRule) => {
    if (!clienteId) return;
    if (!window.confirm(`Excluir a automação "${rule.nome}"? Ela para de rodar imediatamente.`)) return;
    const result = await deleteAutomationRule(clienteId, rule.id);
    if (!result.ok) { showAppToast(result.error || 'Não foi possível excluir.', 'error'); return; }
    showAppToast('Automação excluída.', 'success');
    recarregar();
  };

  const executarAgora = async (rule: AutomationRule) => {
    if (!clienteId) return;
    const result = await runAutomationNow(clienteId, rule.id);
    if (!result.ok) { showAppToast(result.error || 'A automação não disparou.', 'error'); recarregar(); return; }
    const tarefas = (result.resultado?.tarefasEnfileiradas as unknown[] | undefined)?.length ?? 0;
    showAppToast(tarefas > 0 ? `Automação executada — ${tarefas} ação(ões) enfileirada(s).` : 'Automação avaliada, mas a condição não bateu.', tarefas > 0 ? 'success' : 'info');
    recarregar();
  };

  if (!clienteId) {
    return (
      <div className="v3464-page">
        <div className="v3464-page-head"><h1>Automações</h1></div>
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>Acesse o contexto de um cliente para ver as automações dele.</div>
      </div>
    );
  }

  const gatilhoAtual = form ? gatilhosProntos[form.gatilhoTipo] : null;

  return (
    <div className="v3464-page">
      <div className="v3464-page-head">
        <h1>Automações</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="v3464-btn secondary" onClick={() => { setMostrarTemplates(true); setForm(null); }}>
            <Sparkles size={16} /> Usar um modelo pronto
          </button>
          <button className="v3464-primary-btn" onClick={abrirNova}><Plus size={16} /> Nova automação</button>
        </div>
      </div>
      <p style={{ color: 'var(--slate-500)', marginTop: -8, marginBottom: 20 }}>
        Regras do tipo "quando isto acontecer, faça aquilo" — configuradas por você, sem programar. Cada automação
        roda na mesma fila confiável que o resto da plataforma usa (com repetição automática em caso de falha).
      </p>

      <div className="v3464-kpis">
        {kpis.map(([title, value, Icon, color]) => (
          <div className="v3464-kpi" key={title}>
            <span className="v3464-kpi-icon" style={{ background: color }}><Icon size={22} /></span>
            <div><strong>{title}</strong><h2>{value}</h2></div>
          </div>
        ))}
      </div>

      {quota && !quota.ilimitado && quota.limite !== null && (
        <div className="card" style={{ padding: 14, marginBottom: 16, borderLeft: `3px solid ${quota.bloqueado ? '#d64545' : quota.usadas / quota.limite >= 0.8 ? '#ff8b22' : '#00875a'}` }}>
          {quota.bloqueado ? (
            <>
              <strong>Cota mensal de automações atingida ({quota.usadas} de {quota.limite}).</strong>{' '}
              <span style={{ color: 'var(--slate-500)' }}>
                As automações estão pausadas e voltam a rodar sozinhas no próximo ciclo mensal. Nenhuma execução
                extra é cobrada — o plano não permite ultrapassar o limite. Para rodar mais neste mês, é preciso
                mudar de plano.
              </span>
            </>
          ) : (
            <>
              <strong>{quota.usadas} de {quota.limite} execuções usadas este mês.</strong>{' '}
              <span style={{ color: 'var(--slate-500)' }}>
                Restam {quota.restantes}. Ao atingir o limite, as automações pausam até o próximo ciclo.
              </span>
            </>
          )}
        </div>
      )}

      {items.some((r) => r.status === 'pausada_por_loop') && (
        <div className="card" style={{ padding: 14, marginBottom: 16, borderLeft: '3px solid #d64545' }}>
          <strong>Alguma automação foi pausada automaticamente.</strong>{' '}
          <span style={{ color: 'var(--slate-500)' }}>
            Isso acontece quando a mesma regra dispara mais de 10 vezes em 60 segundos — a plataforma pausa sozinha
            para evitar um laço infinito. Revise a regra antes de reativar.
          </span>
        </div>
      )}

      <section className="v3464-card">
        <div className="v3464-search">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar automação pelo nome..." />
        </div>
        <h2>Automações configuradas</h2>

        {loading ? (
          <p style={{ color: 'var(--slate-500)' }}>Carregando...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--slate-500)' }}>
            Nenhuma automação ainda. Comece por um modelo pronto ou crie a sua do zero.
          </p>
        ) : (
          <table className="v3464-table">
            <thead>
              <tr><th>Nome</th><th>Status</th><th>Já rodou</th><th>Última execução</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {filtered.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <strong>{rule.nome}</strong>
                    {rule.descricao && <div style={{ color: 'var(--slate-500)', fontSize: 12 }}>{rule.descricao}</div>}
                  </td>
                  <td><Badge tone={STATUS_TONE[rule.status]}>{statusLabels[rule.status]}</Badge></td>
                  <td>{rule.contador_execucoes}x</td>
                  <td>{rule.ultima_execucao_em ? formatDate(rule.ultima_execucao_em) : '-'}</td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="v3464-btn secondary" onClick={() => abrirEdicao(rule)}>Editar</button>
                    <button className="v3464-btn secondary" onClick={() => void alternarStatus(rule)}>
                      {rule.status === 'ativa' ? 'Pausar' : 'Ativar'}
                    </button>
                    <button className="v3464-btn secondary" onClick={() => void executarAgora(rule)} title="Executa esta automação uma vez, agora">
                      <Play size={14} /> Executar agora
                    </button>
                    <button className="v3464-btn secondary" onClick={() => void excluir(rule)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {mostrarTemplates && (
        <div className="v3464-modal-backdrop">
          <section className="v3464-system-modal" style={{ maxWidth: 640 }}>
            <button className="v3464-modal-x" onClick={() => setMostrarTemplates(false)}>×</button>
            <h2>Modelos prontos</h2>
            <p style={{ color: 'var(--slate-500)', fontSize: 13 }}>
              Escolha um modelo para começar — ele abre já preenchido e você ajusta o que quiser antes de salvar.
            </p>
            <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
              {templatesPropostos.map((template) => (
                <button
                  key={template.codigo}
                  className="card"
                  style={{ padding: 14, textAlign: 'left', cursor: 'pointer', border: '1px solid var(--slate-200)' }}
                  onClick={() => usarTemplate(template)}
                >
                  <strong>{template.nome}</strong>
                  <div style={{ color: 'var(--slate-500)', fontSize: 12, marginTop: 4 }}>{template.descricao}</div>
                  <div style={{ color: 'var(--slate-400)', fontSize: 11, marginTop: 6 }}>Capacidade: {template.capacidade}</div>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {form && (
        <div className="v3464-modal-backdrop">
          <section className="v3464-system-modal" style={{ maxWidth: 720 }}>
            <button className="v3464-modal-x" onClick={() => setForm(null)}>×</button>
            <h2>{form.id ? 'Editar automação' : 'Nova automação'}</h2>

            <div className="v3464-modal-form">
              <label>Nome da automação
                <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Caso ganho vira tarefa de onboarding" />
              </label>
              <label>Descrição (opcional)
                <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Pra que serve esta automação" />
              </label>
            </div>

            {/* Frase estruturada -- "Quando [gatilho] e [condição], faça [ações]" */}
            <div className="card" style={{ padding: 16, marginTop: 16, display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 15 }}>Quando</strong>
                <select value={form.entidade} onChange={(e) => setForm({ ...form, entidade: e.target.value })}>
                  {entidadesDisponiveis.map((ent) => <option key={ent.valor} value={ent.valor}>{ent.rotulo}</option>)}
                </select>
                <select value={form.gatilhoTipo} onChange={(e) => setForm({ ...form, gatilhoTipo: e.target.value as GatilhoTipo })}>
                  {(Object.keys(gatilhosProntos) as GatilhoTipo[]).map((tipo) => (
                    <option key={tipo} value={tipo}>{gatilhosProntos[tipo].rotulo}{gatilhosProntos[tipo].pronto ? '' : ' (em breve)'}</option>
                  ))}
                </select>
                {form.gatilhoTipo === 'mudanca_status' && (
                  <>
                    <span>para</span>
                    <input style={{ maxWidth: 160 }} value={form.statusPara} onChange={(e) => setForm({ ...form, statusPara: e.target.value })} placeholder="ex.: ganho" />
                  </>
                )}
              </div>

              {gatilhoAtual && !gatilhoAtual.pronto && (
                <div style={{ background: 'var(--amber-50, #fff7ed)', border: '1px solid #ffd8a8', borderRadius: 8, padding: '8px 12px', fontSize: 12.5 }}>
                  <strong>Ainda não dispara sozinho.</strong> {gatilhoAtual.nota} Você pode salvar a regra e usar
                  "Executar agora" enquanto isso.
                </div>
              )}

              <div style={{ display: 'grid', gap: 8 }}>
                {form.condicoes.map((cond, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 15 }}>e</strong>
                    <input style={{ maxWidth: 150 }} value={cond.campo} placeholder="campo (ex.: valor)"
                      onChange={(e) => { const c = [...form.condicoes]; c[idx] = { ...c[idx], campo: e.target.value }; setForm({ ...form, condicoes: c }); }} />
                    <select value={cond.operador}
                      onChange={(e) => { const c = [...form.condicoes]; c[idx] = { ...c[idx], operador: e.target.value as Operador }; setForm({ ...form, condicoes: c }); }}>
                      {operadores.map((op) => <option key={op.valor} value={op.valor}>{op.rotulo}</option>)}
                    </select>
                    {cond.operador !== 'está vazio' && (
                      <input style={{ maxWidth: 150 }} value={cond.valor || ''} placeholder="valor"
                        onChange={(e) => { const c = [...form.condicoes]; c[idx] = { ...c[idx], valor: e.target.value }; setForm({ ...form, condicoes: c }); }} />
                    )}
                    <button className="v3464-btn secondary" onClick={() => setForm({ ...form, condicoes: form.condicoes.filter((_, i) => i !== idx) })}>Remover</button>
                  </div>
                ))}
                <button className="v3464-btn secondary" style={{ justifySelf: 'start' }}
                  onClick={() => setForm({ ...form, condicoes: [...form.condicoes, { campo: '', operador: '=', valor: '' }] })}>
                  + Adicionar condição
                </button>
                {form.condicoes.length > 1 && (
                  <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>Todas as condições precisam ser verdadeiras ao mesmo tempo.</span>
                )}
              </div>

              <div style={{ display: 'grid', gap: 12, borderTop: '1px solid var(--slate-200)', paddingTop: 14 }}>
                <strong style={{ fontSize: 15 }}>faça:</strong>
                {form.acoes.map((acao, idx) => {
                  const meta = acoesProntas[acao.tipo];
                  const campos = CAMPOS_POR_ACAO[acao.tipo] || [];
                  return (
                    <div key={idx} style={{ display: 'grid', gap: 8, paddingLeft: 12, borderLeft: '2px solid var(--slate-200)' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <select value={acao.tipo}
                          onChange={(e) => { const a = [...form.acoes]; a[idx] = { tipo: e.target.value as AcaoTipo }; setForm({ ...form, acoes: a }); }}>
                          {(Object.keys(acoesProntas) as AcaoTipo[]).map((tipo) => (
                            <option key={tipo} value={tipo}>{acoesProntas[tipo].rotulo}{acoesProntas[tipo].pronto ? '' : ' (em breve)'}</option>
                          ))}
                        </select>
                        {form.acoes.length > 1 && (
                          <button className="v3464-btn secondary" onClick={() => setForm({ ...form, acoes: form.acoes.filter((_, i) => i !== idx) })}>Remover</button>
                        )}
                      </div>
                      {!meta.pronto && (
                        <div style={{ background: 'var(--amber-50, #fff7ed)', border: '1px solid #ffd8a8', borderRadius: 8, padding: '8px 12px', fontSize: 12.5 }}>
                          <strong>Esta ação ainda não executa.</strong> {meta.nota} A regra fica salva, mas esta ação não faz nada por enquanto.
                        </div>
                      )}
                      {campos.map((campo) => (
                        <label key={campo.chave} style={{ display: 'grid', gap: 4, fontSize: 13 }}>
                          {campo.rotulo}
                          <input value={String(acao[campo.chave] ?? '')} placeholder={campo.placeholder}
                            onChange={(e) => { const a = [...form.acoes]; a[idx] = { ...a[idx], [campo.chave]: e.target.value }; setForm({ ...form, acoes: a }); }} />
                        </label>
                      ))}
                      {campos.length > 0 && (
                        <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                          Dica: use <code>{'{campo}'}</code> para inserir um dado do registro que disparou a automação —
                          ex.: <code>{'{titulo}'}</code>, <code>{'{valor}'}</code>, <code>{'{status}'}</code>. O valor real
                          entra no lugar na hora que a automação rodar.
                        </span>
                      )}
                    </div>
                  );
                })}
                <button className="v3464-btn secondary" style={{ justifySelf: 'start' }}
                  onClick={() => setForm({ ...form, acoes: [...form.acoes, { tipo: 'criar_tarefa', descricao: '' }] })}>
                  + Adicionar ação
                </button>
              </div>
            </div>

            <div className="v3464-modal-form" style={{ marginTop: 16 }}>
              <label>Status
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as FormState['status'] })}>
                  <option value="rascunho">Rascunho (não roda ainda)</option>
                  <option value="ativa">Ativa (roda de verdade)</option>
                  <option value="pausada">Pausada</option>
                </select>
              </label>
            </div>

            <footer>
              <button className="v3464-secondary-btn" onClick={() => setForm(null)}>Cancelar</button>
              <button className="v3464-primary-btn" onClick={() => void salvar()} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar automação'}</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

export default Automacoes;
