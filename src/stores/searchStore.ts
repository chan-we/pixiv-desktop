import { create } from 'zustand';
import {
  defaultFilters,
  type SearchFilters,
} from '@/components/search/SearchFilterDrawer';

interface SearchState {
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  filters: { ...defaultFilters },
  setFilters: (filters) => set({ filters }),
}));
