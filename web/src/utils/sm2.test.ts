import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applySM2, getWordStatus, todayISO } from './sm2';
import type { SM2State } from '../types';

const baseState: SM2State = {
  interval: 1,
  easeFactor: 2.5,
  repetitions: 0,
  dueDate: '2026-01-01',
};

describe('applySM2', () => {
  it('resets interval on quality < 3', () => {
    const result = applySM2(baseState, 1);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  it('sets interval to 1 on first correct answer', () => {
    const result = applySM2({ ...baseState, repetitions: 0 }, 4);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(1);
  });

  it('sets interval to 6 on second correct answer', () => {
    const state: SM2State = { ...baseState, repetitions: 1, interval: 1 };
    const result = applySM2(state, 4);
    expect(result.interval).toBe(6);
    expect(result.repetitions).toBe(2);
  });

  it('multiplies interval by easeFactor on third correct answer', () => {
    const state: SM2State = { ...baseState, repetitions: 2, interval: 6, easeFactor: 2.5 };
    const result = applySM2(state, 4);
    expect(result.interval).toBe(15); // round(6 * 2.5)
    expect(result.repetitions).toBe(3);
  });

  it('increases easeFactor on quality 5', () => {
    const result = applySM2(baseState, 5);
    expect(result.easeFactor).toBeGreaterThan(2.5);
  });

  it('decreases easeFactor on quality 3', () => {
    const result = applySM2(baseState, 3);
    expect(result.easeFactor).toBeLessThan(2.5);
  });

  it('never lets easeFactor go below 1.3', () => {
    let state = { ...baseState, easeFactor: 1.3 };
    for (let i = 0; i < 10; i++) state = applySM2(state, 0);
    expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('sets dueDate to today + interval days', () => {
    const today = '2026-06-21';
    vi.setSystemTime(new Date(today));
    const result = applySM2({ ...baseState, repetitions: 0 }, 4); // interval becomes 1
    expect(result.dueDate).toBe('2026-06-22');
    vi.useRealTimers();
  });
});

describe('getWordStatus', () => {
  beforeEach(() => vi.setSystemTime(new Date('2026-06-21')));
  afterEach(() => vi.useRealTimers());

  it('returns new for undefined state', () => {
    expect(getWordStatus(undefined)).toBe('new');
  });

  it('returns struggling when easeFactor < 1.8', () => {
    expect(getWordStatus({ ...baseState, easeFactor: 1.5, dueDate: '2026-07-01' })).toBe('struggling');
  });

  it('returns mastered when repetitions >= 3 and interval >= 21', () => {
    expect(getWordStatus({ ...baseState, repetitions: 3, interval: 21, dueDate: '2026-07-12' })).toBe('mastered');
  });

  it('returns due when dueDate <= today', () => {
    expect(getWordStatus({ ...baseState, dueDate: '2026-06-21' })).toBe('due');
  });

  it('returns learning when studied but not due, not mastered, not struggling', () => {
    expect(getWordStatus({ ...baseState, repetitions: 1, interval: 6, dueDate: '2026-06-27' })).toBe('learning');
  });
});
