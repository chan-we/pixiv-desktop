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

