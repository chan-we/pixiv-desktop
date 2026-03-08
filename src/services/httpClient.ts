import { fetch } from '@tauri-apps/plugin-http';
import { invoke } from '@tauri-apps/api/core';
import { PIXIV_API_BASE } from '@/utils/constants';
import { getAuth, saveAuth } from '@/utils/storage';

const DEFAULT_HEADERS: Record<string, string> = {
  'Accept': 'application/json',
  'Accept-Language': 'zh-CN',
  'App-OS': 'ios',
  'App-OS-Version': '15.1',
  'App-Version': '7.13.3',
  'User-Agent': 'PixivIOSApp/7.13.3 (iOS 15.1; iPhone13,2)',
  'Referer': 'https://app-api.pixiv.net/',
};

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function doRefreshToken(): Promise<string> {
  const auth = getAuth();
  if (!auth?.refreshToken) throw new Error('No refresh token');

  const body = await invoke<string>('refresh_oauth_token', {
    refreshToken: auth.refreshToken,
  });
  const data = JSON.parse(body);

  saveAuth({
    ...auth,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  });

  return data.access_token as string;
}

async function refreshToken(): Promise<string> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = doRefreshToken().finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  }
  return refreshPromise!;
}

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string | URLSearchParams | Record<string, unknown>;
  signal?: AbortSignal;
}

interface HttpResponse<T = unknown> {
  data: T;
  status: number;
}

async function request<T = unknown>(
  url: string,
  options: RequestOptions = {},
  retry = true
): Promise<HttpResponse<T>> {
  const fullUrl = url.startsWith('http') ? url : `${PIXIV_API_BASE}${url}`;
  const auth = getAuth();

  const headers: Record<string, string> = {
    ...DEFAULT_HEADERS,
    ...options.headers,
  };

  if (auth?.accessToken) {
    headers['Authorization'] = `Bearer ${auth.accessToken}`;
  }

  let bodyStr: string | undefined;
  if (options.body) {
    if (typeof options.body === 'string') {
      bodyStr = options.body;
    } else if (options.body instanceof URLSearchParams) {
      bodyStr = options.body.toString();
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else {
      bodyStr = JSON.stringify(options.body);
      headers['Content-Type'] = 'application/json';
    }
  }

  const response = await fetch(fullUrl, {
    method: options.method || 'GET',
    headers,
    body: bodyStr,
    signal: options.signal,
  });

  if (response.status === 401 && retry) {
    try {
      const newToken = await refreshToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      return request<T>(url, { ...options, headers }, false);
    } catch {
      localStorage.removeItem('pixiv_auth');
      window.location.href = '/login';
      throw new Error('Authentication failed');
    }
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed (${response.status}): ${text}`);
  }

  const data = await response.json() as T;
  return { data, status: response.status };
}

const httpClient = {
  get: <T = unknown>(url: string, options?: { headers?: Record<string, string>; signal?: AbortSignal }) =>
    request<T>(url, { method: 'GET', ...options }),

  post: <T = unknown>(url: string, body?: unknown, options?: { headers?: Record<string, string> }) =>
    request<T>(url, { method: 'POST', body: body as Record<string, unknown>, ...options }),

  delete: <T = unknown>(url: string, options?: { data?: unknown; headers?: Record<string, string> }) =>
    request<T>(url, { method: 'DELETE', body: options?.data as Record<string, unknown>, headers: options?.headers }),
};

export default httpClient;
