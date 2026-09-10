import { useMemo } from 'react';
import { useWordSelectionStore } from '../store/wordSelectionStore';
import { useProgressStore } from '../store/progressStore';
import { shuffle } from '../utils/shuffle';
import type { Word } from '../types';

export function useFilteredWords(allWords: Word[]): Word[] {
  const { search, prefixFilter, masteryFilter, sortOrder, topN } = useWordSelectionStore();
  const { getStatus } = useProgressStore();

  return useMemo(() => {
    let filtered = allWords;

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        w => w.word.toLowerCase().includes(q) || w.definition.toLowerCase().includes(q)
      );
    }

    if (prefixFilter) {
      filtered = filtered.filter(w => w.prefix === prefixFilter);
    }

    if (masteryFilter !== 'all') {
      filtered = filtered.filter(w => {
        const status = getStatus(w.word);
        if (masteryFilter === 'due') return status === 'due' || status === 'struggling';
        return status === masteryFilter;
      });
    }

    let sorted = [...filtered];
    if (sortOrder === 'az') sorted.sort((a, b) => a.word.localeCompare(b.word));
    else if (sortOrder === 'za') sorted.sort((a, b) => b.word.localeCompare(a.word));
    else if (sortOrder === 'random') sorted = shuffle(sorted);

    return topN !== null ? sorted.slice(0, topN) : sorted;
  }, [allWords, search, prefixFilter, masteryFilter, sortOrder, topN, getStatus]);
}
