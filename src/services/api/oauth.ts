import { invoke } from '@tauri-apps/api/core';
import { PIXIV_LOGIN_URL } from '@/utils/constants';
import type { AccessTokenResponse } from '@/types';

export async function getAccessToken(
  code: string,
  codeVerifier: string
): Promise<AccessTokenResponse> {
  console.log('[OAuth] getAccessToken via Rust command, code:', code.slice(0, 8) + '...');

  try {
    const body = await invoke<string>('exchange_oauth_token', {
      code,
      codeVerifier,
    });
    const data = JSON.parse(body) as AccessTokenResponse;
    console.log('[OAuth] token response received, has access_token:', !!data.access_token, 'has user:', !!data.user);
    return data;
  } catch (err) {
    console.error('[OAuth] exchange_oauth_token failed:', err);
    throw new Error(`Token request failed: ${err}`);
  }
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<AccessTokenResponse> {
  console.log('[OAuth] refreshAccessToken via Rust command');

  try {
    const body = await invoke<string>('refresh_oauth_token', {
      refreshToken,
    });
    const data = JSON.parse(body) as AccessTokenResponse;
    console.log('[OAuth] refresh response received, has access_token:', !!data.access_token);
    return data;
  } catch (err) {
    console.error('[OAuth] refresh_oauth_token failed:', err);
    throw new Error(`Token refresh failed: ${err}`);
  }
}

export function getAuthorizeUrl(codeChallenge: string): string {
  const params = new URLSearchParams({
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    client: 'pixiv-android',
  });
  return `${PIXIV_LOGIN_URL}?${params.toString()}`;
}
