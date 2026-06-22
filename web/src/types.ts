export interface AnswerChoice {
  distractor: string;
  closeness: 1 | 2 | 3;
  reasoning: string;
}

export interface SentenceSet {
  sentence: string;
  answerChoices: AnswerChoice[];
}

export interface Word {
  word: string;
  prefix: string;
  pos: string;
  definition: string;
  mwSentence: string;
  etymology: string;
  notes: string;
  stems: string[];
  sentenceSets: SentenceSet[];
}

export interface SM2State {
  interval: number;
  easeFactor: number;
  repetitions: number;
  dueDate: string;        // YYYY-MM-DD — when next review is due
  answeredDate?: string;  // YYYY-MM-DD — when last answered (used for streak)
  lastMode?: StudyMode;
}

/** 0=blackout, 1=incorrect, 2=incorrect easy recall, 3=correct hard, 4=correct, 5=correct easy */
export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

export type WordStatus = 'new' | 'due' | 'mastered' | 'struggling' | 'learning';

export type SortOrder = 'az' | 'za' | 'random';

export type MasteryFilter = 'all' | 'new' | 'due' | 'mastered' | 'struggling';

export type StudyMode = 'wordbank' | 'flashcards' | 'match' | 'fillInBlank' | 'progress';

export type FlashcardDirection = 'wordFirst' | 'definitionFirst';

export type FillInBlankMode = 'multipleChoice' | 'typed';

export interface QuizOption {
  text: string;
  isCorrect: boolean;
  reasoning: string;
  closeness: 1 | 2 | 3;
}

export interface SessionAnswer {
  word: string;
  correct: boolean;
  mode: StudyMode;
}
