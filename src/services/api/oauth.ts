import { fetch } from '@tauri-apps/plugin-http';
import {
  PIXIV_AUTH_URL,
  PIXIV_CLIENT_ID,
  PIXIV_CLIENT_SECRET,
  PIXIV_REDIRECT_URI,
  PIXIV_LOGIN_URL,
} from '@/utils/constants';
import type { AccessTokenResponse } from '@/types';

export async function getAccessToken(
  code: string,
  codeVerifier: string
): Promise<AccessTokenResponse> {
  const response = await fetch(PIXIV_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: PIXIV_REDIRECT_URI,
      client_id: PIXIV_CLIENT_ID,
      client_secret: PIXIV_CLIENT_SECRET,
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token request failed (${response.status}): ${text}`);
  }

  return response.json();
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<AccessTokenResponse> {
  const response = await fetch(PIXIV_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: PIXIV_CLIENT_ID,
      client_secret: PIXIV_CLIENT_SECRET,
    }).toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token refresh failed (${response.status}): ${text}`);
  }

  return response.json();
}

export function getAuthorizeUrl(codeChallenge: string): string {
  const params = new URLSearchParams({
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    client: 'pixiv-android',
  });
  return `${PIXIV_LOGIN_URL}?${params.toString()}`;
}
