import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import {
  applyWorkspacePreferences,
  defaultWorkspacePreferences,
  loadWorkspacePreferences,
  resetWorkspacePreferences,
  saveWorkspacePreferences,
  type WorkspacePreferences
} from '../../lib/preferences';

export function Preferencias() {
  const [preferences, setPreferences] = useState<WorkspacePreferences>(() => loadWorkspacePreferences());
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    applyWorkspacePreferences(preferences);
  }, [preferences]);

  const updatePreference = <K extends keyof WorkspacePreferences>(key: K, value: WorkspacePreferences[K]) => {
    setPreferences((current) => ({ ...current, [key]: value }));
    setSavedMessage('');
  };

  const handleSavePreferences = () => {
    saveWorkspacePreferences(preferences);
    applyWorkspacePreferences(preferences);
    setSavedMessage('Preferências salvas neste navegador.');
  };

  const handleResetPreferences = () => {
    resetWorkspacePreferences();
    setPreferences(defaultWorkspacePreferences);
    applyWorkspacePreferences(defaultWorkspacePreferences);
    setSavedMessage('Preferências restauradas para o padrão.');
  };

  return (
    <>
      <PageHeader title="Preferências" />

      <section className="workspace-settings-panel">
        <div className="workspace-settings-header">
          <div>
            <h2>Área de trabalho configurável</h2>
            <p>Defina como o Radar SUS deve abrir, quais informações ganham prioridade e como o usuário prefere trabalhar.</p>
          </div>
          <span className="badge badge-green">Salvo no navegador</span>
        </div>

        <div className="workspace-settings-grid">
          <div className="settings-card">
            <h3>Perfil do usuário</h3>
            <label>Nome de exibição<input value={preferences.userName} onChange={(event) => updatePreference('userName', event.target.value)} /></label>
            <label>E-mail<input value={preferences.userEmail} onChange={(event) => updatePreference('userEmail', event.target.value)} /></label>
            <label>URL da foto<input placeholder="https://..." value={preferences.userPhotoUrl} onChange={(event) => updatePreference('userPhotoUrl', event.target.value)} /></label>
          </div>

          <div className="settings-card">
            <h3>Aparência</h3>
            <label>Tema<select value={preferences.theme} onChange={(event) => updatePreference('theme', event.target.value as WorkspacePreferences['theme'])}>
              <option value="system">Seguir tema do computador</option>
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
            </select></label>
            <label>Cor principal<input type="color" value={preferences.accentColor} onChange={(event) => updatePreference('accentColor', event.target.value)} /></label>
            <label>Cor da dashboard<input type="color" value={preferences.dashboardColor} onChange={(event) => updatePreference('dashboardColor', event.target.value)} /></label>
          </div>

          <div className="settings-card">
            <h3>Layout da área</h3>
            <label>Densidade<select value={preferences.density} onChange={(event) => updatePreference('density', event.target.value as WorkspacePreferences['density'])}>
              <option value="comfortable">Confortável</option>
              <option value="compact">Compacto</option>
            </select></label>
            <label>Painel lateral<select value={preferences.rightPanelDefault} onChange={(event) => updatePreference('rightPanelDefault', event.target.value as WorkspacePreferences['rightPanelDefault'])}>
              <option value="open">Aberto por padrão</option>
              <option value="collapsed">Recolhido por padrão</option>
            </select></label>
            <label className="inline-check"><input type="checkbox" checked={preferences.compactTables} onChange={(event) => updatePreference('compactTables', event.target.checked)} /> Tabelas compactas</label>
          </div>

          <div className="settings-card">
            <h3>Informações na tela</h3>
            <label className="inline-check"><input type="checkbox" checked={preferences.showKpis} onChange={(event) => updatePreference('showKpis', event.target.checked)} /> Exibir cards/KPIs</label>
            <label className="inline-check"><input type="checkbox" checked={preferences.showCharts} onChange={(event) => updatePreference('showCharts', event.target.checked)} /> Exibir gráficos e blocos visuais</label>
            <label className="inline-check"><input type="checkbox" checked={preferences.saveFilters} onChange={(event) => updatePreference('saveFilters', event.target.checked)} /> Salvar filtros rápidos por usuário</label>
          </div>
        </div>

        <div className="workspace-settings-actions">
          <button onClick={handleResetPreferences}>Restaurar padrão</button>
          <button className="primary" onClick={handleSavePreferences}>Salvar preferências</button>
          {savedMessage && <strong>{savedMessage}</strong>}
        </div>
      </section>
    </>
  );
}
