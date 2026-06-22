import { create } from 'zustand';
import type { StudyMode, FlashcardDirection, FillInBlankMode, SessionAnswer } from '../types';

interface SessionStore {
  activeMode: StudyMode;
  flashcardDirection: FlashcardDirection;
  fillInBlankMode: FillInBlankMode;
  currentIndex: number;
  answers: SessionAnswer[];
  sessionActive: boolean;
  setActiveMode: (mode: StudyMode) => void;
  setFlashcardDirection: (dir: FlashcardDirection) => void;
  setFillInBlankMode: (mode: FillInBlankMode) => void;
  startSession: () => void;
  endSession: () => void;
  nextCard: () => void;
  recordAnswer: (answer: SessionAnswer) => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  activeMode: 'wordbank',
  flashcardDirection: 'wordFirst',
  fillInBlankMode: 'multipleChoice',
  currentIndex: 0,
  answers: [],
  sessionActive: false,

  setActiveMode: (activeMode) => set({ activeMode }),
  setFlashcardDirection: (flashcardDirection) => set({ flashcardDirection }),
  setFillInBlankMode: (fillInBlankMode) => set({ fillInBlankMode }),

  startSession() {
    set({ currentIndex: 0, answers: [], sessionActive: true });
  },

  endSession() {
    set({ sessionActive: false });
  },

  nextCard() {
    set({ currentIndex: get().currentIndex + 1 });
  },

  recordAnswer(answer) {
    set({ answers: [...get().answers, answer] });
  },
}));
