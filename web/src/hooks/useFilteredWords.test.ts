import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFilteredWords } from './useFilteredWords';
import { useWordSelectionStore } from '../store/wordSelectionStore';
import type { Word } from '../types';

const mockWords: Word[] = [
  { word: 'abase', prefix: 'ab', pos: 'verb', definition: 'to lower in esteem', mwSentence: '', etymology: '', notes: '', stems: ['abase'], sentenceSets: [] },
  { word: 'abash', prefix: 'ab', pos: 'verb', definition: 'to embarrass', mwSentence: '', etymology: '', notes: '', stems: ['abash'], sentenceSets: [] },
  { word: 'zenith', prefix: 'zen', pos: 'noun', definition: 'the highest point', mwSentence: '', etymology: '', notes: '', stems: ['zenith'], sentenceSets: [] },
];

beforeEach(() => useWordSelectionStore.setState({
  selectedWords: new Set(),
  search: '',
  prefixFilter: '',
  masteryFilter: 'all',
  sortOrder: 'az',
  topN: null,
}));

describe('useFilteredWords', () => {
  it('returns all words with no filters', () => {
    const { result } = renderHook(() => useFilteredWords(mockWords));
    expect(result.current).toHaveLength(3);
  });

  it('filters by search string (word match)', () => {
    useWordSelectionStore.setState({ search: 'abas' });
    const { result } = renderHook(() => useFilteredWords(mockWords));
    expect(result.current.map(w => w.word)).toContain('abase');
    expect(result.current.map(w => w.word)).not.toContain('zenith');
  });

  it('filters by prefix', () => {
    useWordSelectionStore.setState({ prefixFilter: 'ab' });
    const { result } = renderHook(() => useFilteredWords(mockWords));
    expect(result.current.every(w => w.prefix === 'ab')).toBe(true);
  });

  it('respects topN', () => {
    useWordSelectionStore.setState({ topN: 2 });
    const { result } = renderHook(() => useFilteredWords(mockWords));
    expect(result.current).toHaveLength(2);
  });

  it('sorts az by default', () => {
    const { result } = renderHook(() => useFilteredWords(mockWords));
    const words = result.current.map(w => w.word);
    expect(words).toEqual([...words].sort());
  });
});
