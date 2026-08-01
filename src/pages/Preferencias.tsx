import { useEffect, useState } from 'react';
import { Image, Monitor, Moon, Save, Sun } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { getBrandingConfig, saveBrandingConfig } from '../lib/branding';

type ThemeMode = 'system' | 'light' | 'dark';

export function Preferencias() {
  const [companyName, setCompanyName] = useState('Radar SUS');
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [saved, setSaved] = useState(false);

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
    saveBrandingConfig({
      companyName: companyName.trim() || 'Radar SUS',
      logoDataUrl,
      themeMode,
    });

    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <>
      <PageHeader
        title="Preferências"
        action={<button className="primary-small" onClick={save}><Save size={16} /> Salvar preferências</button>}
      />

      <section className="card preferences-card">
        <div className="section-title-row">
          <div>
            <h3>Personalização do ambiente</h3>
            <p className="section-description">
              Configure a identidade visual do cliente e a preferência de tema. A aplicação não altera o DOM diretamente; o Layout deve consumir essas preferências depois.
            </p>
          </div>
          {saved && <span className="save-feedback">Preferências salvas</span>}
        </div>

        <div className="preferences-grid">
          <section className="preference-box">
            <h4>Nome exibido no menu</h4>
            <label className="preference-label">
              Nome da empresa ou ambiente
              <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Ex.: Prefeitura de Mairiporã" />
            </label>

            <div className="brand-preview">
              <div className="brand-preview-logo">
                {logoDataUrl ? <img src={logoDataUrl} alt="" /> : <span />}
              </div>
              <strong>{companyName || 'Radar SUS'}</strong>
            </div>
          </section>

          <section className="preference-box">
            <h4>Ícone ou logo do cliente</h4>
            <label className="logo-upload-box">
              <Image size={34} />
              <strong>{logoDataUrl ? 'Alterar logo' : 'Adicionar logo'}</strong>
              <span>PNG, JPG ou SVG. Será exibido no menu lateral quando o Layout consumir a preferência.</span>
              <input type="file" accept="image/*" onChange={(event) => handleLogo(event.target.files?.[0] || null)} />
            </label>

            {logoDataUrl && <button className="secondary-btn" onClick={() => setLogoDataUrl('')}>Remover logo</button>}
          </section>

          <section className="preference-box span-2">
            <h4>Tema visual</h4>
            <div className="theme-choice-grid">
              <button className={themeMode === 'system' ? 'active' : ''} onClick={() => setThemeMode('system')}>
                <Monitor size={24} />
                <strong>Automático</strong>
                <span>Segue navegador/SO</span>
              </button>
              <button className={themeMode === 'light' ? 'active' : ''} onClick={() => setThemeMode('light')}>
                <Sun size={24} />
                <strong>Claro</strong>
                <span>Fundo claro para operação diária</span>
              </button>
              <button className={themeMode === 'dark' ? 'active' : ''} onClick={() => setThemeMode('dark')}>
                <Moon size={24} />
                <strong>Escuro</strong>
                <span>Interface escura por preferência do usuário</span>
              </button>
            </div>
          </section>
        </div>
      </section>
    </>
  );
}

export default Preferencias;
