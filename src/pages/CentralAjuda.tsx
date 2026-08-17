import { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Clock, Compass, Headphones, LifeBuoy, Search, ShieldCheck, Sparkles, UserCog, Wallet } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { normalizeFilterText } from '../components/SmartFilters';
import {
  findGuide,
  guidedFlowOptions,
  guidedFlowQuestion,
  guidesByTopic,
  helpGuides,
  helpTopics,
  type HelpGuide,
  type HelpTopicId,
} from '../data/centralAjudaContent';

const topicIcons: Record<HelpTopicId, React.ReactNode> = {
  'primeiros-passos': <Compass size={20} />,
  'atendimento': <Headphones size={20} />,
  'conhecimento-agentes': <Sparkles size={20} />,
  'usuarios-seguranca': <UserCog size={20} />,
  'portal-cliente': <LifeBuoy size={20} />,
  'creditos': <Wallet size={20} />,
};

type View = 'inicio' | 'topico' | 'guia' | 'guiado';

export function CentralAjuda() {
  const [view, setView] = useState<View>('inicio');
  const [search, setSearch] = useState('');
  const [activeTopic, setActiveTopic] = useState<HelpTopicId | null>(null);
  const [activeGuideSlug, setActiveGuideSlug] = useState<string | null>(null);

  const searchResults = useMemo(() => {
    const query = normalizeFilterText(search);
    if (!query) return [];
    return helpGuides.filter((guide) => {
      const text = normalizeFilterText([guide.title, guide.summary, ...guide.sections.map((s) => `${s.heading} ${s.body}`)].join(' '));
      return text.includes(query);
    });
  }, [search]);

  const openGuide = (slug: string) => {
    setActiveGuideSlug(slug);
    setView('guia');
  };

  const openTopic = (topicId: HelpTopicId) => {
    setActiveTopic(topicId);
    setView('topico');
  };

  const activeGuide: HelpGuide | undefined = activeGuideSlug ? findGuide(activeGuideSlug) : undefined;

  return (
    <>
      <PageHeader title="Central de Ajuda" />

      {view === 'inicio' && (
        <>
          <section className="card knowledge-functional-card simplified">
            <div className="smart-filter-bar knowledge-filter-bar simplified">
              <div className="smart-search">
                <Search size={18} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por um tópico, tela ou dúvida..."
                  autoFocus
                />
              </div>
            </div>

            {search.trim() ? (
              <div className="items" style={{ display: 'grid', gap: 8, marginTop: 14 }}>
                {searchResults.length === 0 && <p className="small-muted">Nenhum guia encontrado pra "{search}".</p>}
                {searchResults.map((guide) => (
                  <button key={guide.slug} className="help-guide-row" onClick={() => openGuide(guide.slug)}>
                    <BookOpen size={16} />
                    <div>
                      <strong>{guide.title}</strong>
                      <p>{guide.summary}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <button className="help-guided-cta" onClick={() => setView('guiado')}>
                  <Sparkles size={20} />
                  <div>
                    <strong>Autoajuda guiada</strong>
                    <span>Responda uma pergunta e a gente indica o guia certo pra você.</span>
                  </div>
                  <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                </button>

                <h3 className="help-section-title">Navegar por tópico</h3>
                <div className="help-topic-grid">
                  {helpTopics.map((topic) => (
                    <button key={topic.id} className="help-topic-card" onClick={() => openTopic(topic.id)}>
                      <span className="help-topic-icon">{topicIcons[topic.id]}</span>
                      <strong>{topic.title}</strong>
                      <p>{topic.description}</p>
                      <span className="small-muted">{guidesByTopic(topic.id).length} {guidesByTopic(topic.id).length === 1 ? 'guia' : 'guias'}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        </>
      )}

      {view === 'guiado' && (
        <section className="card knowledge-functional-card simplified">
          <button className="help-back-link" onClick={() => setView('inicio')}><ArrowLeft size={14} /> Voltar</button>
          <h3>{guidedFlowQuestion}</h3>
          <p className="section-description">Escolha a opção mais parecida com o que você está tentando fazer.</p>
          <div className="items" style={{ display: 'grid', gap: 8, marginTop: 14 }}>
            {guidedFlowOptions.map((option) => (
              <button key={option.guideSlug} className="help-guide-row" onClick={() => openGuide(option.guideSlug)}>
                <Sparkles size={16} />
                <div><strong>{option.label}</strong></div>
              </button>
            ))}
          </div>
        </section>
      )}

      {view === 'topico' && activeTopic && (
        <section className="card knowledge-functional-card simplified">
          <button className="help-back-link" onClick={() => setView('inicio')}><ArrowLeft size={14} /> Todos os tópicos</button>
          <h3>{helpTopics.find((t) => t.id === activeTopic)?.title}</h3>
          <p className="section-description">{helpTopics.find((t) => t.id === activeTopic)?.description}</p>
          <div className="items" style={{ display: 'grid', gap: 8, marginTop: 14 }}>
            {guidesByTopic(activeTopic).map((guide) => (
              <button key={guide.slug} className="help-guide-row" onClick={() => openGuide(guide.slug)}>
                <BookOpen size={16} />
                <div>
                  <strong>{guide.title}</strong>
                  <p>{guide.summary}</p>
                </div>
                <span className="help-guide-minutes"><Clock size={12} /> {guide.minutes} min</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {view === 'guia' && activeGuide && (
        <section className="card knowledge-functional-card simplified">
          <button
            className="help-back-link"
            onClick={() => (activeTopic ? setView('topico') : setView('inicio'))}
          >
            <ArrowLeft size={14} /> {activeTopic ? 'Voltar pro tópico' : 'Voltar'}
          </button>
          <h3>{activeGuide.title}</h3>
          <p className="section-description">{activeGuide.summary} · {activeGuide.minutes} min de leitura</p>

          <div className="help-guide-sections">
            {activeGuide.sections.map((section) => (
              <div key={section.heading} className="help-guide-section">
                <h4>{section.heading}</h4>
                <p>{section.body}</p>
              </div>
            ))}
          </div>

          <div className="help-guide-footer">
            <ShieldCheck size={14} />
            <span>Ainda com dúvida? Use o assistente flutuante pra perguntar diretamente sobre esta tela.</span>
          </div>
        </section>
      )}
    </>
  );
}

export default CentralAjuda;
