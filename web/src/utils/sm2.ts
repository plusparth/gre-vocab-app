import type { SM2State, SM2Quality, WordStatus } from '../types';

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function applySM2(state: SM2State, quality: SM2Quality): SM2State {
  let { interval, easeFactor, repetitions } = state;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  const due = new Date();
  due.setDate(due.getDate() + interval);
  const dueDate = due.toISOString().split('T')[0];

  return { interval, easeFactor, repetitions, dueDate };
}

export function getWordStatus(state: SM2State | undefined): WordStatus {
  if (!state) return 'new';
  if (state.easeFactor < 1.8) return 'struggling';
  if (state.repetitions >= 3 && state.interval >= 21) return 'mastered';
  if (state.dueDate <= todayISO()) return 'due';
  return 'learning';
}
