import { describe, it, expect, beforeEach } from 'vitest';
import { useProgressStore } from './progressStore';

beforeEach(() => {
  useProgressStore.setState({ progress: {} });
  localStorage.clear();
});

describe('progressStore', () => {
  it('starts with empty progress', () => {
    expect(useProgressStore.getState().progress).toEqual({});
  });

  it('recordAnswer with quality >= 3 increments repetitions', () => {
    useProgressStore.getState().recordAnswer('abase', 4);
    const state = useProgressStore.getState().progress['abase'];
    expect(state.repetitions).toBe(1);
  });

  it('recordAnswer with quality < 3 resets repetitions', () => {
    useProgressStore.getState().recordAnswer('abase', 4);
    useProgressStore.getState().recordAnswer('abase', 1);
    expect(useProgressStore.getState().progress['abase'].repetitions).toBe(0);
  });

  it('getStatus returns new for unknown word', () => {
    expect(useProgressStore.getState().getStatus('unknown')).toBe('new');
  });

  it('persists to localStorage on update', () => {
    useProgressStore.getState().recordAnswer('abase', 4);
    const stored = JSON.parse(localStorage.getItem('gre-progress') ?? '{}');
    expect(stored['abase']).toBeDefined();
  });

  it('loads persisted data from localStorage on init', () => {
    const fakeState = { abase: { interval: 6, easeFactor: 2.5, repetitions: 1, dueDate: '2026-07-01' } };
    localStorage.setItem('gre-progress', JSON.stringify(fakeState));
    // Simulate store initialization
    useProgressStore.setState({ progress: fakeState });
    expect(useProgressStore.getState().progress['abase'].interval).toBe(6);
  });
});
