import { fetch } from '@tauri-apps/plugin-http';
import {
  PIXIV_AUTH_URL,
  PIXIV_CLIENT_ID,
  PIXIV_CLIENT_SECRET,
  PIXIV_REDIRECT_URI,
  PIXIV_LOGIN_URL,
} from '@/utils/constants';
import type { AccessTokenResponse } from '@/types';

const AUTH_HEADERS: Record<string, string> = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'User-Agent': 'PixivIOSApp/7.13.3 (iOS 15.1; iPhone13,2)',
  'App-OS': 'ios',
  'App-OS-Version': '15.1',
  'App-Version': '7.13.3',
};

export async function getAccessToken(
  code: string,
  codeVerifier: string
): Promise<AccessTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: PIXIV_REDIRECT_URI,
    client_id: PIXIV_CLIENT_ID,
    client_secret: PIXIV_CLIENT_SECRET,
    code_verifier: codeVerifier,
  }).toString();

  console.log('[OAuth] getAccessToken request:', {
    url: PIXIV_AUTH_URL,
    grant_type: 'authorization_code',
    code: code.slice(0, 8) + '...',
    redirect_uri: PIXIV_REDIRECT_URI,
    code_verifier_length: codeVerifier.length,
  });

  let response: Awaited<ReturnType<typeof fetch>>;
  try {
    response = await fetch(PIXIV_AUTH_URL, {
      method: 'POST',
      headers: AUTH_HEADERS,
      body,
    });
  } catch (fetchErr) {
    console.error('[OAuth] fetch threw an exception:', fetchErr);
    console.error('[OAuth] fetch error type:', typeof fetchErr, 'instanceof Error:', fetchErr instanceof Error);
    throw new Error(`Network error during token request: ${fetchErr}`);
  }

  console.log('[OAuth] response status:', response.status, response.statusText);

  if (!response.ok) {
    const text = await response.text();
    console.error('[OAuth] token request failed, status:', response.status, 'body:', text);
    throw new Error(`Token request failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  console.log('[OAuth] token response received, has access_token:', !!data.access_token, 'has user:', !!data.user);
  return data;
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<AccessTokenResponse> {
  console.log('[OAuth] refreshAccessToken called');

  let response: Awaited<ReturnType<typeof fetch>>;
  try {
    response = await fetch(PIXIV_AUTH_URL, {
      method: 'POST',
      headers: AUTH_HEADERS,
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: PIXIV_CLIENT_ID,
        client_secret: PIXIV_CLIENT_SECRET,
      }).toString(),
    });
  } catch (fetchErr) {
    console.error('[OAuth] refresh fetch threw an exception:', fetchErr);
    throw new Error(`Network error during token refresh: ${fetchErr}`);
  }

  console.log('[OAuth] refresh response status:', response.status, response.statusText);

  if (!response.ok) {
    const text = await response.text();
    console.error('[OAuth] token refresh failed, status:', response.status, 'body:', text);
    throw new Error(`Token refresh failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  console.log('[OAuth] refresh token response received, has access_token:', !!data.access_token);
  return data;
}

export function getAuthorizeUrl(codeChallenge: string): string {
  const params = new URLSearchParams({
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    client: 'pixiv-android',
  });
  return `${PIXIV_LOGIN_URL}?${params.toString()}`;
}
