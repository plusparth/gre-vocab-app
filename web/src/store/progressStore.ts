import { create } from 'zustand';
import { applySM2, getWordStatus, todayISO } from '../utils/sm2';
import type { SM2State, SM2Quality, WordStatus } from '../types';

const STORAGE_KEY = 'gre-progress';

function loadFromStorage(): Record<string, SM2State> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

interface ProgressStore {
  progress: Record<string, SM2State>;
  recordAnswer: (word: string, quality: SM2Quality) => void;
  getStatus: (word: string) => WordStatus;
  clearAll: () => void;
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  progress: loadFromStorage(),

  recordAnswer(word, quality) {
    const current = get().progress[word] ?? {
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      dueDate: new Date().toISOString().split('T')[0],
    };
    const updated = { ...applySM2(current, quality), answeredDate: todayISO() };
    const next = { ...get().progress, [word]: updated };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    set({ progress: next });
  },

  getStatus(word) {
    return getWordStatus(get().progress[word]);
  },

  clearAll() {
    localStorage.removeItem(STORAGE_KEY);
    set({ progress: {} });
  },
}));
