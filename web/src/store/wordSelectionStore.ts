import { create } from 'zustand';
import type { SortOrder, MasteryFilter } from '../types';

interface WordSelectionStore {
  selectedWords: Set<string>;
  search: string;
  prefixFilter: string;
  masteryFilter: MasteryFilter;
  sortOrder: SortOrder;
  topN: number | null;
  toggleWord: (word: string) => void;
  selectWords: (words: string[]) => void;
  clearSelection: () => void;
  setSearch: (s: string) => void;
  setPrefixFilter: (p: string) => void;
  setMasteryFilter: (f: MasteryFilter) => void;
  setSortOrder: (o: SortOrder) => void;
  setTopN: (n: number | null) => void;
}

export const useWordSelectionStore = create<WordSelectionStore>((set, get) => ({
  selectedWords: new Set(),
  search: '',
  prefixFilter: '',
  masteryFilter: 'all',
  sortOrder: 'az',
  topN: null,

  toggleWord(word) {
    const next = new Set(get().selectedWords);
    if (next.has(word)) next.delete(word);
    else next.add(word);
    set({ selectedWords: next });
  },

  selectWords(words) {
    set({ selectedWords: new Set(words) });
  },

  clearSelection() {
    set({ selectedWords: new Set() });
  },

  setSearch: (search) => set({ search }),
  setPrefixFilter: (prefixFilter) => set({ prefixFilter }),
  setMasteryFilter: (masteryFilter) => set({ masteryFilter }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setTopN: (topN) => set({ topN }),
}));
