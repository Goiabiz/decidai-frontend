import { useEffect, useState } from 'react';
import { Bell, CalendarDays, Image, Languages, Monitor, Moon, Save, Sun, Type } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { getBrandingConfig, saveBrandingConfig } from '../lib/branding';
import { showAppToast } from '../lib/appToast';

type ThemeMode = 'system' | 'light' | 'dark';

export function Preferencias() {
  const [companyName, setCompanyName] = useState('Radar SUS');
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [language, setLanguage] = useState('pt-BR');
  const [dateFormat, setDateFormat] = useState('dd/MM/yyyy');
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    const current = getBrandingConfig();
    setCompanyName(current.companyName || 'Radar SUS');
    setLogoDataUrl(current.logoDataUrl || '');
    setThemeMode(current.themeMode || 'system');
  }, []);

  const handleLogo = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const save = () => {
    saveBrandingConfig({ companyName: companyName.trim() || 'Radar SUS', logoDataUrl, themeMode });
    showAppToast('Preferências salvas.', 'success');
  };

  return (
    <>
      <PageHeader title="Preferências" action={<button className="primary-small" onClick={save}><Save size={16} /> Salvar</button>} />

      <section className="card preference-list-card">
        <div className="section-title-row">
          <div>
            <h3>Preferências do ambiente</h3>
            <p className="section-description">Configurações de aparência, identidade visual, idioma e notificações do usuário.</p>
          </div>
        </div>

        <div className="preference-list">
          <label className="preference-row"><span><Type size={19} /><strong>Nome exibido no menu</strong><small>Nome da empresa ou ambiente do cliente.</small></span><input value={companyName} onChange={(event) => setCompanyName(event.target.value)} /></label>
          <label className="preference-row"><span><Image size={19} /><strong>Logo do cliente</strong><small>Imagem usada no menu lateral quando habilitada no Layout.</small></span><input type="file" accept="image/*" onChange={(event) => handleLogo(event.target.files?.[0] || null)} /></label>
          {logoDataUrl && <div className="preference-row static"><span><Image size={19} /><strong>Prévia do logo</strong><small>Logo carregado localmente para validação visual.</small></span><div className="preference-logo-preview"><img src={logoDataUrl} alt="" /></div></div>}

          <div className="preference-row static"><span><Monitor size={19} /><strong>Aparência</strong><small>Escolha o tema ou siga o navegador/SO.</small></span><div className="segmented-control"><button className={themeMode === 'system' ? 'active' : ''} onClick={() => setThemeMode('system')}><Monitor size={15} /> Automático</button><button className={themeMode === 'light' ? 'active' : ''} onClick={() => setThemeMode('light')}><Sun size={15} /> Claro</button><button className={themeMode === 'dark' ? 'active' : ''} onClick={() => setThemeMode('dark')}><Moon size={15} /> Escuro</button></div></div>
          <label className="preference-row"><span><Languages size={19} /><strong>Idioma</strong><small>Base para internacionalização da aplicação.</small></span><select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="pt-BR">Português Brasil</option><option value="en-US">English US</option><option value="en-GB">English UK</option><option value="es">Español</option><option value="de">Deutsch</option><option value="fr">Français</option></select></label>
          <label className="preference-row"><span><CalendarDays size={19} /><strong>Formato de data</strong><small>Preferência visual para datas e horários.</small></span><select value={dateFormat} onChange={(event) => setDateFormat(event.target.value)}><option>dd/MM/yyyy</option><option>yyyy-MM-dd</option><option>MM/dd/yyyy</option></select></label>
          <label className="preference-row"><span><Bell size={19} /><strong>Notificações</strong><small>Preferência inicial de avisos dentro da aplicação.</small></span><input type="checkbox" checked={notifications} onChange={(event) => setNotifications(event.target.checked)} /></label>
        </div>
      </section>
    </>
  );
}

export default Preferencias;
