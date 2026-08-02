import { useMemo, useState } from 'react';
import { Bot, CheckCircle2, DatabaseZap, FileText, Filter, Globe2, KeyRound, Logs, Plug, Search, Settings2, Sparkles, TestTube2, Workflow } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { integrationCatalog, integrationCategories, nativePlatformServices, excludedDefaultConnectors, type IntegrationCategoryCode, type IntegrationItem } from '../lib/integrationCatalog';
import { showAppToast } from '../lib/appToast';

function statusTone(status: IntegrationItem['status']) {
  if (status === 'Conectado') return 'green';
  if (status === 'Disponível') return 'blue';
  if (status === 'Bloqueado pelo plano') return 'orange';
  if (status === 'Erro') return 'red';
  return 'gray';
}

function CategoryIcon({ code }: { code: IntegrationCategoryCode }) {
  if (code === 'communication') return <Workflow size={18} />;
  if (code === 'social') return <Globe2 size={18} />;
  if (code === 'knowledge') return <FileText size={18} />;
  if (code === 'custom-api') return <DatabaseZap size={18} />;
  if (code === 'ai-voice') return <Bot size={18} />;
  return <Plug size={18} />;
}

export function Integracoes() {
  const [category, setCategory] = useState<IntegrationCategoryCode | 'all'>('communication');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<IntegrationItem | null>(integrationCatalog[0]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return integrationCatalog.filter((item) => {
      const matchesCategory = category === 'all' || item.category === category;
      const matchesSearch = !q || [item.name, item.description, item.use, item.plan].join(' ').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  const selectedCategory = integrationCategories.find((item) => item.code === category);

  return (
    <>
      <PageHeader title="Integrações" />

      <section className="integration-layout-v29">
        <aside className="card integration-category-list">
          <div className="section-title-row"><h3>Tipos de serviço</h3></div>
          <button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}><Filter size={18} /><span>Todos</span></button>
          {integrationCategories.map((item) => <button key={item.code} className={category === item.code ? 'active' : ''} onClick={() => setCategory(item.code)}><CategoryIcon code={item.code} /><span>{item.label}</span></button>)}
        </aside>

        <section className="card integration-catalog-card">
          <div className="section-title-row">
            <div><h3>{selectedCategory?.label || 'Todas as integrações'}</h3><p className="section-description">{selectedCategory?.description || 'Catálogo completo de conectores externos.'}</p></div>
            <span className="small-muted">{filtered.length} conectores</span>
          </div>

          <div className="smart-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar integração, plataforma, uso ou plano..." /></div>

          <div className="integration-card-grid-v29">
            {filtered.map((item) => <button key={item.code} className={selected?.code === item.code ? 'active' : ''} onClick={() => setSelected(item)}><span className={`brand-service-logo ${item.category}`}>{item.logo}</span><strong>{item.name}</strong><small>{item.description}</small><div><Badge tone={statusTone(item.status)}>{item.status}</Badge><em>{item.plan}</em></div></button>)}
          </div>
        </section>

        <aside className="card integration-detail-v29">
          {selected && <><div className="agent-detail-header"><span className={`brand-service-logo large ${selected.category}`}>{selected.logo}</span><div><h3>{selected.name}</h3><p>{selected.description}</p></div><Badge tone={statusTone(selected.status)}>{selected.status}</Badge></div>
          <div className="agent-detail-actions"><button onClick={() => showAppToast(`Conexão de ${selected.name} preparada para backend/OAuth.`, 'info')}><Plug size={16} /> Conectar</button><button onClick={() => showAppToast('Teste de conexão será executado pelo backend.', 'info')}><TestTube2 size={16} /> Testar</button><button onClick={() => showAppToast('Seleção de recursos prevista para próxima etapa.', 'info')}><Settings2 size={16} /> Recursos</button><button onClick={() => showAppToast('Logs serão exibidos após conexão real.', 'info')}><Logs size={16} /> Logs</button></div>
          <div className="agent-info-grid"><div><KeyRound size={18} /><strong>Plano mínimo</strong><span>{selected.plan}</span></div><div><Sparkles size={18} /><strong>Uso principal</strong><span>{selected.use}</span></div><div><CheckCircle2 size={18} /><strong>Base de conhecimento</strong><span>{selected.canFeedKnowledge ? 'Pode alimentar' : 'Não é fonte principal'}</span></div><div><Workflow size={18} /><strong>Canal operacional</strong><span>{selected.canBeChannelProvider ? 'Pode ser usado por canal' : 'Não é canal'}</span></div></div>
          <div className="native-note"><strong>Serviços nativos da plataforma</strong><span>{nativePlatformServices.join(' • ')}</span><small>Não aparecem como conectores opcionais do cliente. São controlados pela intranet/plataforma.</small></div>
          <div className="native-note muted"><strong>Fora dos conectores padrão</strong><span>{excludedDefaultConnectors.join(' • ')}</span><small>Podem ser conectados apenas via API personalizada, quando o cliente tiver API autorizada.</small></div></>}
        </aside>
      </section>
    </>
  );
}

export default Integracoes;
