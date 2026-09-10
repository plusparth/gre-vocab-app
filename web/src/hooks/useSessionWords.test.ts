import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionWords } from './useSessionWords';
import { useWordSelectionStore } from '../store/wordSelectionStore';
import { useProgressStore } from '../store/progressStore';
import type { Word } from '../types';

function makeWord(word: string): Word {
  return {
    word, prefix: 'ab', pos: 'verb', definition: `meaning of ${word}`,
    mwSentence: '', etymology: '', notes: '', stems: [word], sentenceSets: [],
  };
}

const LETTERS = 'abcdefghijklmnopqrst'.split('');
const allWords = LETTERS.map(l => makeWord(`word${l}`));
const allNames = allWords.map(w => w.word);

function selectAll() {
  useWordSelectionStore.setState({
    selectedWords: new Set(allNames),
    search: '', prefixFilter: '', masteryFilter: 'all', sortOrder: 'az', topN: null,
  });
}

beforeEach(() => {
  localStorage.clear();
  useProgressStore.setState({ progress: {} });
  selectAll();
});

describe('useSessionWords', () => {
  it('returns exactly the selected words', () => {
    useWordSelectionStore.setState({ selectedWords: new Set(['worda', 'wordb']) });
    const { result } = renderHook(() => useSessionWords(allWords));
    expect([...result.current.words.map(w => w.word)].sort()).toEqual(['worda', 'wordb']);
  });

  it('returns a permutation of the selection, losing nothing', () => {
    const { result } = renderHook(() => useSessionWords(allWords));
    expect([...result.current.words.map(w => w.word)].sort()).toEqual([...allNames].sort());
  });

  it('presents the words in a shuffled rather than alphabetical order', () => {
    const firsts = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const { result, unmount } = renderHook(() => useSessionWords(allWords));
      firsts.add(result.current.words[0].word);
      unmount();
    }
    expect(firsts.size).toBeGreaterThan(1);
  });

  it('keeps the same order across re-renders', () => {
    const { result, rerender } = renderHook(() => useSessionWords(allWords));
    const before = result.current.words.map(w => w.word);
    rerender();
    rerender();
    expect(result.current.words.map(w => w.word)).toEqual(before);
  });

  it('keeps the same order after an answer is recorded', () => {
    // Recording an answer changes progress, which recomputes the filtered list.
    // The session order must not be reshuffled underneath the user.
    const { result } = renderHook(() => useSessionWords(allWords));
    const before = result.current.words.map(w => w.word);
    act(() => useProgressStore.getState().recordAnswer('wordc', 5));
    expect(result.current.words.map(w => w.word)).toEqual(before);
  });

  it('does not drop a word mid-session when an answer changes its mastery status', () => {
    useWordSelectionStore.setState({ masteryFilter: 'new' });
    const { result } = renderHook(() => useSessionWords(allWords));
    const before = result.current.words.map(w => w.word);
    expect(before).toContain('wordc');
    // 'wordc' is no longer 'new' after this, so a live filter would evict it.
    act(() => useProgressStore.getState().recordAnswer('wordc', 5));
    expect(result.current.words.map(w => w.word)).toEqual(before);
  });

  it('reshuffle keeps the same words but reorders them', () => {
    const { result } = renderHook(() => useSessionWords(allWords));
    const before = result.current.words.map(w => w.word);

    let reordered = false;
    for (let i = 0; i < 10 && !reordered; i++) {
      act(() => result.current.reshuffle());
      const after = result.current.words.map(w => w.word);
      expect([...after].sort()).toEqual([...before].sort());
      reordered = after.join() !== before.join();
    }
    expect(reordered).toBe(true);
  });

  it('rebuilds the session when the selection changes', () => {
    const { result } = renderHook(() => useSessionWords(allWords));
    expect(result.current.words).toHaveLength(allWords.length);
    act(() => useWordSelectionStore.getState().selectWords(['worda', 'wordb', 'wordc']));
    expect(result.current.words.map(w => w.word).sort()).toEqual(['worda', 'wordb', 'wordc']);
  });

  it('returns an empty list when nothing is selected', () => {
    act(() => useWordSelectionStore.getState().clearSelection());
    const { result } = renderHook(() => useSessionWords(allWords));
    expect(result.current.words).toEqual([]);
  });
});
