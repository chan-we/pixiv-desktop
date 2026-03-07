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
        let { codeVerifier } = get();

        // 尝试从 localStorage 获取 code verifier 作为后备
        if (!codeVerifier) {
          codeVerifier = localStorage.getItem('oauth_code_verifier');
          console.log('Got codeVerifier from localStorage:', codeVerifier ? 'yes' : 'no');
        }

        if (!codeVerifier) {
          throw new Error('Code verifier not found. Please try logging in again.');
        }

        set({ isLoading: true });
        try {
          const response = await getAccessToken(code, codeVerifier);

          // 清除 localStorage 中的 code verifier
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

          set({
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            user: response.user,
            isAuthenticated: true,
            codeVerifier: null,
            isLoading: false,
          });
        } catch (error) {
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
