import { Bell, CalendarClock, Globe2, Image, Languages, Monitor, Moon, Save, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { getBrandingConfig, saveBrandingConfig } from '../lib/branding';
import { showAppToast } from '../lib/appToast';

type ThemeMode = 'system' | 'light' | 'dark';

export function Preferencias() {
  const [companyName, setCompanyName] = useState('Radar SUS');
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [language, setLanguage] = useState('pt-BR');
  const [dateFormat, setDateFormat] = useState('dd/MM/yyyy HH:mm');
  const [notifications, setNotifications] = useState('notificacoes_importantes');

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
      <PageHeader
        title="Preferências"
        action={<button className="primary-small" onClick={save}><Save size={16} /> Salvar preferências</button>}
      />

      <section className="card preferences-list-card">
        <h3>Configurações do ambiente</h3>

        <div className="preference-row">
          <div><Monitor size={22} /><span><strong>Aparência</strong><small>Define se o ambiente segue o navegador ou usa tema fixo.</small></span></div>
          <select value={themeMode} onChange={(event) => setThemeMode(event.target.value as ThemeMode)}>
            <option value="system">Automático</option>
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
          </select>
        </div>

        <div className="preference-row">
          <div><Image size={22} /><span><strong>Nome exibido no menu</strong><small>Identificação visual do cliente no ambiente operacional.</small></span></div>
          <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
        </div>

        <div className="preference-row">
          <div><Image size={22} /><span><strong>Logo do cliente</strong><small>Imagem exibida no menu lateral quando configurada no Layout.</small></span></div>
          <label className="inline-file-input">
            Selecionar logo
            <input type="file" accept="image/*" onChange={(event) => handleLogo(event.target.files?.[0] || null)} />
          </label>
        </div>

        <div className="preference-row">
          <div><Languages size={22} /><span><strong>Idioma</strong><small>Preparado para expansão internacional.</small></span></div>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="pt-BR">Português Brasil</option>
            <option value="en-US">English US</option>
            <option value="en-GB">English UK</option>
            <option value="es">Español</option>
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
          </select>
        </div>

        <div className="preference-row">
          <div><CalendarClock size={22} /><span><strong>Formato de data e hora</strong><small>Apresentação padrão em listas, relatórios e histórico.</small></span></div>
          <select value={dateFormat} onChange={(event) => setDateFormat(event.target.value)}>
            <option value="dd/MM/yyyy HH:mm">dd/MM/aaaa HH:mm</option>
            <option value="yyyy-MM-dd HH:mm">aaaa-MM-dd HH:mm</option>
            <option value="MM/dd/yyyy h:mm a">MM/dd/aaaa h:mm AM/PM</option>
          </select>
        </div>

        <div className="preference-row">
          <div><Bell size={22} /><span><strong>Notificações</strong><small>Preferência geral de avisos dentro do ambiente.</small></span></div>
          <select value={notifications} onChange={(event) => setNotifications(event.target.value)}>
            <option value="notificacoes_importantes">Somente importantes</option>
            <option value="todas">Todas</option>
            <option value="silencioso">Silencioso</option>
          </select>
        </div>
      </section>
    </>
  );
}

export default Preferencias;
