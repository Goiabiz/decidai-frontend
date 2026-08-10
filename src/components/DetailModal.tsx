import { useEffect, useState } from 'react';
import { X, Maximize2, Clock3, Link2, MessageSquareText, ShieldCheck, Paperclip, GitBranch, CheckCircle2 } from 'lucide-react';
import type { PanelDetail } from './RightPanel';
import { createRoadmapItem, discardItem, getHistory, getOperationalEventName, markReview, type OperationalHistory } from '../services/operationalStore';
import { getBrandingConfig } from '../lib/branding';

type TabKey = 'resumo' | 'historico' | 'vinculos' | 'acoes' | 'anexos';

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'resumo', label: 'Resumo' },
  { key: 'historico', label: 'Histórico' },
  { key: 'vinculos', label: 'Vínculos' },
  { key: 'acoes', label: 'Ações' },
  { key: 'anexos', label: 'Anexos' }
];

export function DetailModal({ detail, onClose }: { detail: PanelDetail | null; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>('resumo');
  const [history, setHistory] = useState<OperationalHistory[]>([]);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!detail) return;

    const refresh = () => setHistory(getHistory(detail));
    refresh();
    window.addEventListener(getOperationalEventName(), refresh);

    return () => window.removeEventListener(getOperationalEventName(), refresh);
  }, [detail?.title]);

  if (!detail) return null;

  const handleRoadmap = () => {
    createRoadmapItem(detail);
    setFeedback('Item enviado para o Roadmap.');
    setActiveTab('acoes');
  };

  const handleDiscard = () => {
    discardItem(detail);
    setFeedback('Item descartado operacionalmente.');
    setActiveTab('historico');
  };

  const handleReview = () => {
    markReview(detail);
    setFeedback('Item marcado para revisão do PO.');
    setActiveTab('historico');
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="detail-modal">
        <header className="detail-modal-header">
          <div>
            <span className="modal-eyebrow">{getBrandingConfig().companyName}</span>
            <h2>{detail.title}</h2>
            {detail.subtitle && <p>{detail.subtitle}</p>}
          </div>

          <div className="detail-modal-actions">
            <button className="icon-btn" title="Abrir em aba"><Maximize2 size={17} /></button>
            <button className="icon-btn modal-close" onClick={onClose} aria-label="Fechar detalhe">
              <X size={18} />
            </button>
          </div>
        </header>

        <nav className="detail-tabs">
          {tabs.map((tab) => (
            <button key={tab.key} className={activeTab === tab.key ? 'active' : ''} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="detail-modal-body">
          <main className="detail-main">
            {activeTab === 'resumo' && (
              <>
                <section className="detail-section">
                  <div className="section-title-row">
                    <h3>Resumo do item</h3>
                    <span className="badge badge-green">{detail.badge ?? 'Selecionado'}</span>
                  </div>
                  <p className="muted">{detail.description ?? 'Item selecionado para análise detalhada.'}</p>

                  <div className="detail-info-grid">
                    {(detail.meta ?? []).map((item) => (
                      <div key={item.label} className="detail-info-card">
                        <span>{item.label}</span>
                        <strong>{item.value ?? '-'}</strong>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="detail-section">
                  <h3>Linha do tempo</h3>
                  <div className="timeline">
                    <div><Clock3 size={16} /><span>Item selecionado para análise</span><small>agora</small></div>
                    <div><ShieldCheck size={16} /><span>Validação automática disponível</span><small>próxima etapa</small></div>
                    <div><MessageSquareText size={16} /><span>Comentário ou decisão do usuário</span><small>pendente</small></div>
                  </div>
                </section>
              </>
            )}

            {activeTab === 'historico' && (
              <section className="detail-section">
                <h3>Histórico operacional</h3>
                <div className="timeline">
                  {history.length ? history.map((item) => (
                    <div key={item.id}>
                      <Clock3 size={16} />
                      <span><strong>{item.action}</strong> — {item.description}</span>
                      <small>{new Date(item.createdAt).toLocaleString('pt-BR')}</small>
                    </div>
                  )) : (
                    <>
                      <div><Clock3 size={16} /><span>Registro criado a partir da base monitorada</span><small>origem</small></div>
                      <div><MessageSquareText size={16} /><span>Aguardando primeira ação operacional</span><small>pendente</small></div>
                    </>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'vinculos' && (
              <section className="detail-section">
                <h3>Vínculos do item</h3>
                <div className="linked-grid">
                  <div><GitBranch size={18} /><strong>Documento de origem</strong><span>Fonte normativa, atendimento ou integração.</span></div>
                  <div><GitBranch size={18} /><strong>Impacto relacionado</strong><span>Módulo, funcionalidade, cliente ou regra afetada.</span></div>
                  <div><GitBranch size={18} /><strong>Ação vinculada</strong><span>Encaminhamento operacional ou decisão pendente.</span></div>
                </div>
              </section>
            )}

            {activeTab === 'acoes' && (
              <section className="detail-section">
                <h3>Ações e próximos passos</h3>
                <div className="action-list">
                  <button className="primary" onClick={handleRoadmap}>{detail.actions?.[0] ?? 'Gerar ação'}</button>
                  <button onClick={handleReview}>{detail.actions?.[1] ?? 'Marcar revisão'}</button>
                  <button>Adicionar comentário</button>
                  <button onClick={handleDiscard}>Descartar</button>
                </div>
                {feedback && <p className="action-feedback">{feedback}</p>}
              </section>
            )}

            {activeTab === 'anexos' && (
              <section className="detail-section">
                <h3>Anexos</h3>
                <div className="empty-attachment">
                  <Paperclip size={22} />
                  <strong>Nenhum anexo vinculado nesta POC.</strong>
                  <span>Área preparada para documentos, evidências, prints e arquivos de apoio.</span>
                </div>
              </section>
            )}
          </main>

          <aside className="detail-side">
            <section className="detail-section">
              <h3>Ações rápidas</h3>
              <button className="primary full-width" onClick={handleRoadmap}>{detail.actions?.[0] ?? 'Gerar ação'}</button>
              <button className="full-width" onClick={handleReview}>{detail.actions?.[1] ?? 'Marcar revisão'}</button>
              <button className="danger full-width" onClick={handleDiscard}>{detail.actions?.[2] ?? 'Descartar'}</button>
              {feedback && <p className="action-feedback">{feedback}</p>}
            </section>

            <section className="detail-section">
              <h3>Status do trabalho</h3>
              <div className="mini-row"><CheckCircle2 size={16} /> Revisão operacional</div>
              <div className="mini-row"><Link2 size={16} /> Documento de origem</div>
              <div className="mini-row"><Link2 size={16} /> Impacto relacionado</div>
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
}
