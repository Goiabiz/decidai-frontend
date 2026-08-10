import { useEffect, useState } from 'react';
import { Image, Link2, Lock, Megaphone, Palette, Plus, Save, Trash2, Type } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { useSession } from '../../contexts/SessionContext';
import { showAppToast } from '../../lib/appToast';
import { getClientPlanCode, planRank } from '../../services/auth';
import { getPortalConfiguracao, savePortalConfiguracao, type PortalBanner, type PortalConfiguracao as PortalConfig, type PortalFooterLink } from '../../services/portalConfig';

function novoBanner(ordem: number): PortalBanner {
  return { id: `banner-${Date.now()}`, imagemUrl: '', linkUrl: '', textoAlt: '', ativoDe: null, ativoAte: null, ordem };
}

/** Recurso vendido a partir do plano Pro -- não faz parte do pacote básico. */
const PORTAL_CONFIG_MIN_PLAN = 'pro';

export function PortalConfiguracao() {
  const { session } = useSession();
  const clienteId = session?.activeClientId ?? null;

  const [config, setConfig] = useState<PortalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planCode, setPlanCode] = useState<string | null>(null);
  const [planLoaded, setPlanLoaded] = useState(false);

  const temAcessoPorPlano = planRank(planCode) >= planRank(PORTAL_CONFIG_MIN_PLAN);

  useEffect(() => {
    if (!clienteId) {
      setLoading(false);
      setPlanLoaded(true);
      return;
    }
    setPlanLoaded(false);
    getClientPlanCode(clienteId)
      .then((code) => setPlanCode(code))
      .catch(() => setPlanCode(null))
      .finally(() => setPlanLoaded(true));
  }, [clienteId]);

  useEffect(() => {
    if (!clienteId || !planLoaded || !temAcessoPorPlano) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getPortalConfiguracao(clienteId)
      .then(({ config: cfg }) => setConfig(cfg))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId, planLoaded, temAcessoPorPlano]);

  const update = <K extends keyof PortalConfig>(key: K, value: PortalConfig[K]) => {
    setConfig((current) => (current ? { ...current, [key]: value } : current));
  };

  const addBanner = () => {
    if (!config) return;
    update('banners', [...config.banners, novoBanner(config.banners.length)]);
  };

  const updateBanner = (id: string, patch: Partial<PortalBanner>) => {
    if (!config) return;
    update('banners', config.banners.map((banner) => (banner.id === id ? { ...banner, ...patch } : banner)));
  };

  const removeBanner = (id: string) => {
    if (!config) return;
    update('banners', config.banners.filter((banner) => banner.id !== id));
  };

  const addLinkRodape = () => {
    if (!config) return;
    update('linksRodape', [...config.linksRodape, { titulo: '', url: '' }]);
  };

  const updateLinkRodape = (index: number, patch: Partial<PortalFooterLink>) => {
    if (!config) return;
    update('linksRodape', config.linksRodape.map((link, i) => (i === index ? { ...link, ...patch } : link)));
  };

  const removeLinkRodape = (index: number) => {
    if (!config) return;
    update('linksRodape', config.linksRodape.filter((_, i) => i !== index));
  };

  const salvar = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const source = await savePortalConfiguracao(config);
      showAppToast(source === 'supabase' ? 'Configuração do portal salva.' : 'Configuração salva localmente (banco ainda não aplicado).', 'success');
    } finally {
      setSaving(false);
    }
  };

  if (!clienteId) {
    return (
      <>
        <PageHeader title="Portal do Cliente" subtitle="Personalize o portal público que os clientes finais deste contratante usam." />
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>
          Acesse o contexto de um cliente para configurar o portal dele.
        </div>
      </>
    );
  }

  if (!planLoaded) {
    return (
      <>
        <PageHeader title="Portal do Cliente" subtitle="Personalize o portal público que os clientes finais deste contratante usam." />
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>Carregando...</div>
      </>
    );
  }

  if (!temAcessoPorPlano) {
    return (
      <>
        <PageHeader title="Portal do Cliente" subtitle="Personalize o portal público que os clientes finais deste contratante usam." />
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <Lock size={30} style={{ color: 'var(--slate-400)', marginBottom: 14 }} />
          <h3 style={{ margin: '0 0 8px' }}>Recurso do plano Pro</h3>
          <p style={{ color: 'var(--slate-500)', maxWidth: 440, margin: '0 auto 18px' }}>
            Personalizar marca, banners e anúncios do Portal do Cliente faz parte dos planos Pro e Enterprise.
            {planCode ? ` Este cliente está no plano ${planCode}.` : ''} Fale com o time comercial para fazer upgrade.
          </p>
          <button className="primary-small" onClick={() => showAppToast('Solicitação de upgrade registrada. O time comercial vai entrar em contato.', 'success')}>
            Solicitar upgrade
          </button>
        </div>
      </>
    );
  }

  if (loading || !config) {
    return (
      <>
        <PageHeader title="Portal do Cliente" subtitle="Personalize o portal público que os clientes finais deste contratante usam." />
        <div className="card" style={{ padding: 30, textAlign: 'center', color: 'var(--slate-500)' }}>Carregando...</div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Portal do Cliente"
        subtitle="Personalize o portal público que os clientes finais deste contratante usam — igual à configuração de Help Center do Jira/Zendesk."
        action={<button className="primary-small" onClick={salvar} disabled={saving}><Save size={16} /> {saving ? 'Salvando...' : 'Salvar configuração'}</button>}
      />

      <section className="card preferences-list-card">
        <h3><Palette size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />Marca</h3>

        <div className="preference-row">
          <div><Type size={22} /><span><strong>Nome do portal</strong><small>Exibido no cabeçalho do Portal do Cliente.</small></span></div>
          <input value={config.nomePortal} onChange={(event) => update('nomePortal', event.target.value)} placeholder="Central de Ajuda" />
        </div>

        <div className="preference-row">
          <div><Image size={22} /><span><strong>Logo (URL)</strong><small>Substitui a marca padrão no cabeçalho do portal.</small></span></div>
          <input value={config.logoUrl} onChange={(event) => update('logoUrl', event.target.value)} placeholder="https://..." />
        </div>

        <div className="preference-row">
          <div><Image size={22} /><span><strong>Favicon (URL)</strong><small>Ícone exibido na aba do navegador.</small></span></div>
          <input value={config.faviconUrl} onChange={(event) => update('faviconUrl', event.target.value)} placeholder="https://..." />
        </div>

        <div className="preference-row">
          <div><Palette size={22} /><span><strong>Cor primária</strong><small>Usada nos botões e destaques principais.</small></span></div>
          <input type="color" value={config.corPrimaria} onChange={(event) => update('corPrimaria', event.target.value)} />
        </div>

        <div className="preference-row">
          <div><Palette size={22} /><span><strong>Cor de destaque</strong><small>Usada em hover e elementos secundários.</small></span></div>
          <input type="color" value={config.corDestaque} onChange={(event) => update('corDestaque', event.target.value)} />
        </div>
      </section>

      <section className="card preferences-list-card">
        <h3><Image size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />Banner de destaque (hero)</h3>

        <div className="preference-row">
          <div><Type size={22} /><span><strong>Título</strong></span></div>
          <input value={config.heroTitulo} onChange={(event) => update('heroTitulo', event.target.value)} placeholder="Ex.: Bem-vindo à Central de Ajuda" />
        </div>
        <div className="preference-row">
          <div><Type size={22} /><span><strong>Subtítulo</strong></span></div>
          <input value={config.heroSubtitulo} onChange={(event) => update('heroSubtitulo', event.target.value)} placeholder="Ex.: Respondemos em até 1 dia útil" />
        </div>
        <div className="preference-row">
          <div><Image size={22} /><span><strong>Imagem de fundo (URL)</strong></span></div>
          <input value={config.heroImagemUrl} onChange={(event) => update('heroImagemUrl', event.target.value)} placeholder="https://..." />
        </div>
        <div className="preference-row">
          <div><Link2 size={22} /><span><strong>Link ao clicar</strong></span></div>
          <input value={config.heroLinkUrl} onChange={(event) => update('heroLinkUrl', event.target.value)} placeholder="https://..." />
        </div>
      </section>

      <section className="card preferences-list-card">
        <h3><Megaphone size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />Anúncio no topo</h3>
        <p className="small-muted" style={{ margin: '-4px 0 12px' }}>Um aviso único e curto (ex.: manutenção, mudança de horário) — não é para promoção, use os banners abaixo para isso.</p>

        <div className="preference-row">
          <div><Megaphone size={22} /><span><strong>Ativar anúncio</strong></span></div>
          <label className="checkbox-inline-row">
            <input type="checkbox" checked={config.anuncioAtivo} onChange={(event) => update('anuncioAtivo', event.target.checked)} />
            Exibir no portal
          </label>
        </div>
        <div className="preference-row">
          <div><Type size={22} /><span><strong>Texto</strong></span></div>
          <input value={config.anuncioTexto} onChange={(event) => update('anuncioTexto', event.target.value)} placeholder="Ex.: Manutenção programada no sábado, 22h às 23h." />
        </div>
        <div className="preference-row">
          <div><Palette size={22} /><span><strong>Cor de fundo</strong></span></div>
          <input type="color" value={config.anuncioCorFundo} onChange={(event) => update('anuncioCorFundo', event.target.value)} />
        </div>
      </section>

      <section className="card preferences-list-card">
        <div className="section-title-row">
          <h3><Image size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />Banners promocionais / parceiros</h3>
          <button className="secondary-btn" onClick={addBanner}><Plus size={16} /> Adicionar banner</button>
        </div>
        <p className="small-muted" style={{ margin: '-4px 0 12px' }}>Lista de banners com imagem, link e vigência — para divulgar novidades, parceiros ou campanhas no portal.</p>

        {config.banners.length === 0 && <p className="small-muted">Nenhum banner cadastrado.</p>}

        {config.banners.map((banner) => (
          <div className="portal-config-row" key={banner.id}>
            <input value={banner.imagemUrl} onChange={(event) => updateBanner(banner.id, { imagemUrl: event.target.value })} placeholder="URL da imagem" />
            <input value={banner.linkUrl} onChange={(event) => updateBanner(banner.id, { linkUrl: event.target.value })} placeholder="Link ao clicar" />
            <input value={banner.textoAlt} onChange={(event) => updateBanner(banner.id, { textoAlt: event.target.value })} placeholder="Texto alternativo" />
            <input type="date" value={banner.ativoDe ?? ''} onChange={(event) => updateBanner(banner.id, { ativoDe: event.target.value || null })} title="Ativo a partir de" />
            <input type="date" value={banner.ativoAte ?? ''} onChange={(event) => updateBanner(banner.id, { ativoAte: event.target.value || null })} title="Ativo até" />
            <button className="portal-config-row-remove" onClick={() => removeBanner(banner.id)} title="Remover banner"><Trash2 size={16} /></button>
          </div>
        ))}
      </section>

      <section className="card preferences-list-card">
        <div className="section-title-row">
          <h3><Link2 size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />Links do rodapé</h3>
          <button className="secondary-btn" onClick={addLinkRodape}><Plus size={16} /> Adicionar link</button>
        </div>

        {config.linksRodape.length === 0 && <p className="small-muted">Nenhum link cadastrado.</p>}

        {config.linksRodape.map((link, index) => (
          <div className="portal-config-row portal-config-row-link" key={index}>
            <input value={link.titulo} onChange={(event) => updateLinkRodape(index, { titulo: event.target.value })} placeholder="Título (ex.: Política de Privacidade)" />
            <input value={link.url} onChange={(event) => updateLinkRodape(index, { url: event.target.value })} placeholder="https://..." />
            <button className="portal-config-row-remove" onClick={() => removeLinkRodape(index)} title="Remover link"><Trash2 size={16} /></button>
          </div>
        ))}
      </section>
    </>
  );
}

export default PortalConfiguracao;
