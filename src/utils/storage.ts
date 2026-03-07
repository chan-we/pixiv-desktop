// 本地存储工具

const AUTH_KEY = 'pixiv_auth';

interface AuthData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: {
    id: number;
    name: string;
    account: string;
    avatar: string;
  } | null;
}

export function saveAuth(data: AuthData): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

export function getAuth(): AuthData | null {
  const data = localStorage.getItem(AUTH_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY);
}

const SEARCH_HISTORY_KEY = 'pixiv_search_history';

export function saveSearchHistory(keywords: string[]): void {
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(keywords.slice(0, 20)));
}

export function getSearchHistory(): string[] {
  const data = localStorage.getItem(SEARCH_HISTORY_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function addSearchHistory(keyword: string): void {
  if (!getSearchHistoryEnabled()) return;
  const history = getSearchHistory().filter(k => k !== keyword);
  history.unshift(keyword);
  saveSearchHistory(history);
}

export function clearSearchHistory(): void {
  localStorage.removeItem(SEARCH_HISTORY_KEY);
}

// Settings

const SETTINGS_KEY = 'pixiv_settings';

interface AppSettings {
  searchHistoryEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  searchHistoryEnabled: true,
};

export function getSettings(): AppSettings {
  const data = localStorage.getItem(SETTINGS_KEY);
  if (!data) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<AppSettings>): void {
  const current = getSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
}

export function getSearchHistoryEnabled(): boolean {
  return getSettings().searchHistoryEnabled;
}
