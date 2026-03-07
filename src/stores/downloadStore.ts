import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export interface DownloadTask {
  id: string;
  illustId: number;
  illustTitle: string;
  pageIndex: number;
  totalPages: number;
  fileName: string;
  url: string;
  savePath: string;
  status: 'pending' | 'downloading' | 'done' | 'error';
  error?: string;
}

type NewTask = Omit<DownloadTask, 'status'>;

interface DownloadState {
  tasks: DownloadTask[];
  panelOpen: boolean;
  _processing: boolean;

  addTasks: (tasks: NewTask[]) => void;
  togglePanel: () => void;
  clearCompleted: () => void;
  clearAll: () => void;
}

async function processQueue(get: () => DownloadState, set: (partial: Partial<DownloadState> | ((s: DownloadState) => Partial<DownloadState>)) => void) {
  if (get()._processing) return;
  set({ _processing: true });

  while (true) {
    const next = get().tasks.find((t) => t.status === 'pending');
    if (!next) break;

    set((s) => ({
      tasks: s.tasks.map((t) => t.id === next.id ? { ...t, status: 'downloading' as const } : t),
    }));

    try {
      await invoke('download_image', { url: next.url, path: next.savePath });
      set((s) => ({
        tasks: s.tasks.map((t) => t.id === next.id ? { ...t, status: 'done' as const } : t),
      }));
    } catch (e) {
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === next.id
            ? { ...t, status: 'error' as const, error: String(e) }
            : t,
        ),
      }));
    }
  }

  set({ _processing: false });
}

export const useDownloadStore = create<DownloadState>()((set, get) => ({
  tasks: [],
  panelOpen: false,
  _processing: false,

  addTasks: (newTasks) => {
    const tasks: DownloadTask[] = newTasks.map((t) => ({ ...t, status: 'pending' }));
    set((s) => ({ tasks: [...s.tasks, ...tasks], panelOpen: true }));
    processQueue(get, set);
  },

  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),

  clearCompleted: () =>
    set((s) => ({ tasks: s.tasks.filter((t) => t.status !== 'done') })),

  clearAll: () => set({ tasks: [] }),
}));
