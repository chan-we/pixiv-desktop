import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { getAccessToken } from '@/services/api/oauth';
import { saveAuth, getAuth, clearAuth } from '@/utils/storage';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  codeVerifier: string | null;
  isLoading: boolean;

  // Actions
  setCodeVerifier: (verifier: string) => void;
  login: (code: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      codeVerifier: null,
      isLoading: false,

      setCodeVerifier: (verifier: string) => {
        set({ codeVerifier: verifier });
      },

      login: async (code: string) => {
        console.log('[AuthStore] login called, code:', code.slice(0, 8) + '...');
        let { codeVerifier } = get();
        console.log('[AuthStore] codeVerifier from zustand:', codeVerifier ? `yes (${codeVerifier.length} chars)` : 'no');

        if (!codeVerifier) {
          codeVerifier = localStorage.getItem('oauth_code_verifier');
          console.log('[AuthStore] codeVerifier from localStorage:', codeVerifier ? `yes (${codeVerifier.length} chars)` : 'no');
        }

        if (!codeVerifier) {
          console.error('[AuthStore] no codeVerifier found in zustand or localStorage');
          throw new Error('Code verifier not found. Please try logging in again.');
        }

        set({ isLoading: true });
        try {
          console.log('[AuthStore] calling getAccessToken...');
          const response = await getAccessToken(code, codeVerifier);
          console.log('[AuthStore] getAccessToken succeeded, user:', response.user?.name, 'expires_in:', response.expires_in);

          localStorage.removeItem('oauth_code_verifier');

          const authData = {
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            expiresAt: Date.now() + response.expires_in * 1000,
            user: {
              id: response.user.id,
              name: response.user.name,
              account: response.user.account,
              avatar: response.user.profile_image_urls.medium,
            },
          };

          saveAuth(authData);
          console.log('[AuthStore] auth data saved to localStorage');

          set({
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            user: response.user,
            isAuthenticated: true,
            codeVerifier: null,
            isLoading: false,
          });
          console.log('[AuthStore] zustand state updated, login complete');
        } catch (error) {
          console.error('[AuthStore] login error:', error);
          console.error('[AuthStore] error type:', typeof error, 'instanceof Error:', error instanceof Error);
          if (error instanceof Error) {
            console.error('[AuthStore] error message:', error.message);
            console.error('[AuthStore] error stack:', error.stack);
          }
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        clearAuth();
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          codeVerifier: null,
        });
      },

      checkAuth: () => {
        const auth = getAuth();
        if (!auth) return false;

        // 检查 token 是否过期
        if (auth.expiresAt < Date.now()) {
          get().logout();
          return false;
        }

        set({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          user: auth.user ? {
            id: auth.user.id,
            name: auth.user.name,
            account: auth.user.account,
            profile_image_urls: { medium: auth.user.avatar },
            is_followed: false,
          } : null,
          isAuthenticated: true,
        });

        return true;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        codeVerifier: state.codeVerifier,
      }),
    }
  )
);
