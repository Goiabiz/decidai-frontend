export type AppearanceMode = 'system' | 'light' | 'dark';
export type DensityMode = 'comfortable' | 'compact';
export type PanelDefaultMode = 'open' | 'collapsed';

export type WorkspacePreferences = {
  theme: AppearanceMode;
  accentColor: string;
  dashboardColor: string;
  density: DensityMode;
  rightPanelDefault: PanelDefaultMode;
  showKpis: boolean;
  showCharts: boolean;
  saveFilters: boolean;
  compactTables: boolean;
  userName: string;
  userEmail: string;
  userPhotoUrl: string;
};

const STORAGE_KEY = 'radar-sus-workspace-preferences';

export const defaultWorkspacePreferences: WorkspacePreferences = {
  theme: 'system',
  accentColor: '#00784d',
  dashboardColor: '#00784d',
  density: 'comfortable',
  rightPanelDefault: 'open',
  showKpis: true,
  showCharts: true,
  saveFilters: true,
  compactTables: false,
  userName: 'Bruno Oliveira',
  userEmail: 'bruno@exemplo.com',
  userPhotoUrl: ''
};

export function loadWorkspacePreferences(): WorkspacePreferences {
  if (typeof window === 'undefined') return defaultWorkspacePreferences;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultWorkspacePreferences;
    return { ...defaultWorkspacePreferences, ...JSON.parse(raw) };
  } catch {
    return defaultWorkspacePreferences;
  }
}

export function saveWorkspacePreferences(preferences: WorkspacePreferences) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

export function resetWorkspacePreferences() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function applyWorkspacePreferences(preferences: WorkspacePreferences) {
  if (typeof document === 'undefined') return;

  document.documentElement.style.setProperty('--green', preferences.accentColor);
  document.documentElement.style.setProperty('--dashboard-accent', preferences.dashboardColor);

  document.documentElement.dataset.density = preferences.density;
}
