type ThemeMode = 'system' | 'light' | 'dark';

export type BrandingConfig = {
  companyName: string;
  logoDataUrl: string;
  themeMode: ThemeMode;
};

const STORAGE_KEY = 'radar_sus_branding_config';

const defaultConfig: BrandingConfig = {
  companyName: 'DecidAI',
  logoDataUrl: '',
  themeMode: 'system',
};

function safeParse(value: string | null): BrandingConfig {
  if (!value) return defaultConfig;

  try {
    return { ...defaultConfig, ...JSON.parse(value) };
  } catch {
    return defaultConfig;
  }
}

function resolveTheme(themeMode: ThemeMode) {
  if (themeMode === 'system') {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return themeMode;
}

export function getBrandingConfig(): BrandingConfig {
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function saveBrandingConfig(config: Partial<BrandingConfig>) {
  const next = { ...getBrandingConfig(), ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  applyBranding();
  window.dispatchEvent(new CustomEvent('radar-branding-updated', { detail: next }));
}

export function applyBranding() {
  const config = getBrandingConfig();
  const resolvedTheme = resolveTheme(config.themeMode);

  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.dataset.themeMode = config.themeMode;
}

export function initBranding() {
  applyBranding();

  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if (getBrandingConfig().themeMode === 'system') applyBranding();
  });

  window.addEventListener('storage', applyBranding);
  window.addEventListener('radar-branding-updated', applyBranding);
}

initBranding();
