import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Maximize2,
  PlusCircle,
  X
} from 'lucide-react';
import { createRoadmapItem, discardItem, getPatch, markReview, updateOperationalPatch } from '../services/operationalStore';
import { KnowledgeActionsMenu } from './KnowledgeActionsMenu';
import { AlertActionsMenu } from './AlertActionsMenu';
import { useSession } from '../contexts/SessionContext';
import { listUsuariosCliente, type UsuarioCliente } from '../services/auth';

export type PanelDetail = {
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  badgeTone?: string;
  meta?: Array<{ label: string; value?: string | number | null }>;
  actions?: string[];
  id?: string;
  lifecycleState?: string;
  onAfterAction?: () => void;
};

type Variant = 'dashboard' | 'alerta' | 'acao' | 'documento' | 'atendimento' | 'impacto' | 'config';
type SectionKey = 'resumo' | 'informacoes' | 'relacoes' | 'acoes' | 'historico' | 'maisAcoes';

const defaults: Record<Variant, PanelDetail> = {
  dashboard: {
    title: 'Principais insights',
    badge: 'Resumo',
    badgeTone: 'blue',
    description: 'Selecione um item para acompanhar pendências, alertas, tarefas e atualizações.',
    meta: [
      { label: 'Status', value: 'Operação monitorada' },
      { label: 'Origem', value: 'Dashboard' }
    ]
  },
  alerta: { title: 'Nenhum alerta selecionado', badge: 'Alerta', badgeTone: 'red', description: 'Clique em um alerta para monitorar divulgação, tratamento, tarefas geradas e próximos encaminhamentos.' },
  acao: { title: 'Nenhum item de roadmap selecionado', badge: 'Roadmap', badgeTone: 'orange', description: 'Clique em uma decisão para visualizar prioridade, responsável, prazo, vínculo com alerta/impacto e próximo encaminhamento.' },
  documento: { title: 'Nenhum conhecimento selecionado', badge: 'Conhecimento', badgeTone: 'blue', description: 'Clique em um conhecimento para visualizar fonte, origem, grupo, status, classificação e relações operacionais.' },
  atendimento: { title: 'Nenhum atendimento selecionado', badge: 'Atendimento', badgeTone: 'green', description: 'Clique em um atendimento para visualizar cliente, canal, prioridade, status e ticket vinculado.' },
  impacto: { title: 'Nenhum impacto selecionado', badge: 'Impacto', badgeTone: 'red', description: 'Clique em um impacto para visualizar produto, cliente, serviço, persona afetada, risco e orientação recomendada.' },
  config: { title: 'Nenhuma parametrização selecionada', badge: 'Parametrização', badgeTone: 'green', description: 'Clique em cliente, integração, usuário ou persona para visualizar parâmetros do ambiente.' }
};

const toneToClass = (tone?: string) => {
  const normalized = (tone ?? '').toLowerCase();
  if (normalized.includes('crit') || normalized.includes('red') || normalized.includes('cancel')) return 'badge-red';
  if (normalized.includes('alto') || normalized.includes('orange') || normalized.includes('pendente') || normalized.includes('análise') || normalized.includes('novo')) return 'badge-orange';
  if (normalized.includes('green') || normalized.includes('ativo')) return 'badge-green';
  return 'badge-blue';
};

const sizeLabels: Record<string, string> = {
  compact: 'Compacto',
  medium: 'Médio',
  wide: 'Expandido'
};

const setPanelSize = (size: string) => {
  window.localStorage.setItem('radar-sus-right-panel-size', size);
  window.dispatchEvent(new CustomEvent('radar-sus-panel-size-changed'));
};

const nextPanelSize = () => {
  const current = window.localStorage.getItem('radar-sus-right-panel-size') || 'medium';
  const next = current === 'compact' ? 'medium' : current === 'medium' ? 'wide' : 'compact';
  setPanelSize(next);
  return next;
};

export function RightPanel({ variant = 'dashboard', detail, onExpand, onClose }: { variant?: Variant; detail?: PanelDetail | null; onExpand?: (detail: PanelDetail) => void; onClose?: () => void }) {
  const { session } = useSession();
  const userName = session?.user.displayName ?? 'Usuário';
  const actor = { nome: userName, email: session?.user.email ?? '' };
  const clienteId = session?.activeClientId ?? null;
  const [feedback, setFeedback] = useState('');
  const [panelSizeLabel, setPanelSizeLabel] = useState(() => sizeLabels[window.localStorage.getItem('radar-sus-right-panel-size') || 'medium']);
  const [knowledgeMenuId, setKnowledgeMenuId] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioCliente[]>([]);
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    resumo: true,
    informacoes: true,
    relacoes: true,
    acoes: true,
    historico: false,
    maisAcoes: false
  });

  const current = detail ?? defaults[variant];
  const isKnowledge = variant === 'documento';

  const metaMap = useMemo(() => {
    const map = new Map<string, string | number | null | undefined>();
    current.meta?.forEach((item) => map.set(item.label, item.value));
    return map;
  }, [current.meta]);

  const patch = useMemo(() => getPatch(current), [current]);

  useEffect(() => {
    if (!clienteId) { setUsuarios([]); return; }
    let active = true;
    listUsuariosCliente(clienteId)
      .then((rows) => { if (active) setUsuarios(rows); })
      .catch(() => { if (active) setUsuarios([]); });
    return () => { active = false; };
  }, [clienteId]);

  const handleFieldChange = (field: 'status' | 'prioridade' | 'responsavel', value: string) => {
    updateOperationalPatch(current, { [field]: value }, actor);
    setFeedback('Campo atualizado.');
  };

  const toggleSection = (section: SectionKey) => {
    setOpenSections((state) => ({ ...state, [section]: !state[section] }));
  };

  const handleSize = () => {
    const next = nextPanelSize();
    setPanelSizeLabel(sizeLabels[next]);
  };

  const handleRoadmap = () => {
    createRoadmapItem(current, actor);
    setFeedback(isKnowledge ? 'Tarefa adicionada ao Roadmap.' : 'Item enviado para o Roadmap.');
  };

  const handleReview = () => {
    markReview(current, actor);
    setFeedback(isKnowledge ? 'Conhecimento marcado para análise.' : 'Item marcado para revisão.');
  };

  const handleDiscard = () => {
    discardItem(current, actor);
    setFeedback(isKnowledge ? 'Conhecimento cancelado.' : 'Item descartado.');
  };

  const openInNewTab = () => {
    window.open(`${window.location.origin}/?detail=${encodeURIComponent(current.title)}`, '_blank');
  };


  const renderSectionHeader = (key: SectionKey, title: string) => (
    <button className="panel-accordion-header" onClick={() => toggleSection(key)}>
      {openSections[key] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      <span>{title}</span>
    </button>
  );

  return (
    <div className={`panel-card operational-panel ${isKnowledge ? 'knowledge-panel' : ''}`}>
      <div className="panel-toolbar">
        <div className="panel-toolbar-left">
          <span className={`badge ${toneToClass(current.badgeTone ?? current.badge)}`}>{current.badge ?? 'Selecionado'}</span>
        </div>

        <div className="panel-header-actions">
          <button className="icon-btn" title="Abrir em nova guia" onClick={openInNewTab}><ExternalLink size={16} /></button>
<button className="icon-btn" title="Expandir em modal" onClick={() => onExpand?.(current)}><Maximize2 size={16} /></button>
<button className="icon-btn" title={`Ajustar largura do painel: ${panelSizeLabel}`} onClick={handleSize}><ArrowLeftRight size={16} /></button>
{isKnowledge ? (
              <KnowledgeActionsMenu
                id={`panel-${current.title}`}
                title={current.title}
                openMenuId={knowledgeMenuId}
                setOpenMenuId={setKnowledgeMenuId}
                align="right"
                entryId={current.id}
                lifecycleState={current.lifecycleState}
                clienteId={clienteId}
                onDone={current.onAfterAction}
                onClosePanel={onClose}
              />
              ) : variant === 'alerta' ? (
                <AlertActionsMenu
                  id={`alert-panel-${current.title}`}
                  openMenuId={knowledgeMenuId}
                  setOpenMenuId={setKnowledgeMenuId}
                  align="right"
                />
              ) : (
                <KnowledgeActionsMenu
                  id={`panel-${current.title}`}
                  title={current.title}
                  openMenuId={knowledgeMenuId}
                  setOpenMenuId={setKnowledgeMenuId}
                  align="right"
                />
              )}
              <button className="icon-btn" title="Recolher painel" onClick={onClose}><X size={16} /></button>
        </div>
      </div>

      <section className="panel-hero-section">
        <h2 className="panel-item-title" onClick={() => onExpand?.(current)}>{current.title}</h2>
        {current.subtitle && <strong className="panel-subtitle">{current.subtitle}</strong>}
        <p>{current.description ?? 'Informação selecionada com origem, relações, status e encaminhamentos relacionados.'}</p>
      </section>

      <div className="panel-section panel-accordion">
        {renderSectionHeader('resumo', 'Resumo')}
        {openSections.resumo && (
          <div className="panel-editable-grid">
            <label>
              <span>Status</span>
              <select
                value={String(patch?.status ?? metaMap.get('Status') ?? current.badge ?? 'Novo')}
                onChange={(event) => handleFieldChange('status', event.target.value)}
              >
                {variant === 'alerta' ? (
                  <>
                    <option>Novo</option>
                    <option>Em andamento</option>
                    <option>Concluído</option>
                  </>
                ) : (
                  <>
                    <option>Novo</option>
                    <option>Em análise</option>
                    <option>Ativo</option>
                    <option>Cancelado</option>
                  </>
                )}
              </select>
            </label>
            <label>
              <span>{variant === 'alerta' ? 'Prioridade' : 'Classificação'}</span>
              <select
                value={String(patch?.prioridade ?? metaMap.get(variant === 'alerta' ? 'Prioridade' : 'Classificação') ?? (variant === 'alerta' ? current.badge ?? 'Média' : 'Técnico'))}
                onChange={(event) => handleFieldChange('prioridade', event.target.value)}
              >
                {variant === 'alerta' ? (
                  <>
                    <option>Baixa</option>
                    <option>Média</option>
                    <option>Alta</option>
                    <option>Crítico</option>
                  </>
                ) : (
                  <>
                    <option>Normativo</option>
                    <option>Operacional</option>
                    <option>Estratégico</option>
                    <option>Comercial</option>
                    <option>Técnico</option>
                  </>
                )}
              </select>
            </label>
            <label>
              <span>Responsável</span>
              <select
                value={String(patch?.responsavel ?? metaMap.get('Responsável') ?? userName)}
                onChange={(event) => handleFieldChange('responsavel', event.target.value)}
              >
                {!usuarios.some((usuario) => usuario.nome === userName) && <option>{userName}</option>}
                {usuarios.map((usuario) => (
                  <option key={usuario.id}>{usuario.nome}</option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      {current.meta?.length ? (
        <div className="panel-section panel-accordion">
          {renderSectionHeader('informacoes', isKnowledge ? 'Informações do conhecimento' : 'Informações')}
          {openSections.informacoes && (
            <div className="panel-meta">
              {current.meta.map((item) => (
                <div key={item.label} className="panel-meta-row">
                  <span>{item.label}</span>
                  <strong>{item.value ?? '-'}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div className="panel-section panel-accordion">
        {renderSectionHeader('relacoes', isKnowledge ? 'Relações do conhecimento' : variant === 'alerta' ? 'Desdobramentos do alerta' : 'Relações')}
        {openSections.relacoes && (
          <div className="relationship-list">
            {(isKnowledge ? [
              ['Alertas gerados', 0],
              ['Impactos associados', 0],
              ['Tarefas relacionadas', 0],
              ['Orientações registradas', 0],
              ['Versões do conhecimento', 1],
              ['Atendimentos vinculados', 0]
            ] : variant === 'alerta' ? [
              ['Divulgações realizadas', Number(metaMap.get('Comunicados enviados') ?? 0)],
              ['Tarefas geradas', Number(metaMap.get('Tarefas geradas') ?? 0)],
              ['Orientações registradas', 0],
              ['Análises relacionadas', 0]
            ] : [
              ['Conhecimento de origem', 1],
              ['Análises relacionadas', 0],
              ['Tarefas geradas', 0]
            ]).map(([label, count]) => (
              <button key={label} className="relationship-row">
                <span>{label}</span>
                <strong>{count}</strong>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="panel-section panel-accordion panel-actions">
        {renderSectionHeader('acoes', 'Ações rápidas')}
        {openSections.acoes && (
          <>
            {variant === 'alerta' ? (
              <>
                <button className="primary" onClick={handleRoadmap}><PlusCircle size={17} /> Divulgar alerta</button>
                <button onClick={handleRoadmap}>Encaminhar para tarefa</button>
                <button onClick={handleReview}>Gerar orientação</button>
                <button onClick={handleReview}>Acionar agente</button>
                <button className="danger" onClick={handleDiscard}>Cancelar alerta</button>
              </>
            ) : (
              <>
                <button className="primary" onClick={isKnowledge ? handleReview : handleRoadmap}><PlusCircle size={17} /> {current.actions?.[0] ?? 'Gerar ação'}</button>
                <button onClick={handleRoadmap}>{isKnowledge ? 'Adicionar tarefa' : current.actions?.[1] ?? 'Marcar revisão'}</button>
                <button className="danger" onClick={handleDiscard}>{isKnowledge ? 'Cancelar conhecimento' : current.actions?.[2] ?? 'Descartar'}</button>
              </>
            )}
            {feedback && <p className="action-feedback">{feedback}</p>}
          </>
        )}
      </div>

      <div className="panel-section panel-accordion">
        {renderSectionHeader('historico', 'Histórico')}
        {openSections.historico && (
          <div className="panel-history-list">
            <div><strong>Última visualização</strong><span>agora</span></div>
            <div><strong>Auditoria preparada</strong><span>localStorage / Supabase futuro</span></div>
          </div>
        )}
      </div>

      <div className="panel-section panel-accordion">
        {renderSectionHeader('maisAcoes', 'Mais ações')}
        {openSections.maisAcoes && (
          <div className="panel-history-list">
            <div><strong>Exportação</strong><span>PDF, Excel e Word previstos</span></div>
            <div><strong>Logs</strong><span>insert, update, delete, print e export</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
