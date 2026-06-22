import { describe, it, expect, beforeEach } from 'vitest';
import { useWordSelectionStore } from './wordSelectionStore';

beforeEach(() => useWordSelectionStore.setState({
  selectedWords: new Set(),
  search: '',
  prefixFilter: '',
  masteryFilter: 'all',
  sortOrder: 'az',
  topN: null,
}));

describe('wordSelectionStore', () => {
  it('toggles a word on and off', () => {
    useWordSelectionStore.getState().toggleWord('abase');
    expect(useWordSelectionStore.getState().selectedWords.has('abase')).toBe(true);
    useWordSelectionStore.getState().toggleWord('abase');
    expect(useWordSelectionStore.getState().selectedWords.has('abase')).toBe(false);
  });

  it('selectWords replaces selection', () => {
    useWordSelectionStore.getState().toggleWord('abase');
    useWordSelectionStore.getState().selectWords(['abash', 'abate']);
    expect(useWordSelectionStore.getState().selectedWords.has('abase')).toBe(false);
    expect(useWordSelectionStore.getState().selectedWords.has('abash')).toBe(true);
  });

  it('clearSelection empties the set', () => {
    useWordSelectionStore.getState().toggleWord('abase');
    useWordSelectionStore.getState().clearSelection();
    expect(useWordSelectionStore.getState().selectedWords.size).toBe(0);
  });
});
