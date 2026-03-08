import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';

interface ProxyState {
  enabled: boolean;
  url: string;

  updateProxy: (enabled: boolean, url: string) => Promise<void>;
  initProxy: () => Promise<void>;
}

export const useProxyStore = create<ProxyState>()(
  persist(
    (set, get) => ({
      enabled: false,
      url: '',

      updateProxy: async (enabled: boolean, url: string) => {
        set({ enabled, url });
        const proxyUrl = enabled && url ? url : null;
        try {
          await invoke('set_proxy', { url: proxyUrl });
        } catch (e) {
          console.error('[ProxyStore] set_proxy failed:', e);
        }
      },

      initProxy: async () => {
        const { enabled, url } = get();
        if (enabled && url) {
          try {
            await invoke('set_proxy', { url });
            console.log('[ProxyStore] proxy initialized:', url);
          } catch (e) {
            console.error('[ProxyStore] init set_proxy failed:', e);
          }
        }
      },
    }),
    {
      name: 'proxy-settings',
      partialize: (state) => ({
        enabled: state.enabled,
        url: state.url,
      }),
    }
  )
);
