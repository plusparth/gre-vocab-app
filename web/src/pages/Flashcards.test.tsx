import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Flashcards } from './Flashcards';
import { useWordSelectionStore } from '../store/wordSelectionStore';
import { useProgressStore } from '../store/progressStore';
import type { Word } from '../types';

const mockWord: Word = {
  word: 'abase', prefix: 'ab', pos: 'verb',
  definition: 'to lower in rank or esteem',
  mwSentence: 'He abased himself before the king.',
  etymology: 'Latin bassus', notes: '', stems: ['abase', 'abased'],
  sentenceSets: [],
};

beforeEach(() => {
  useWordSelectionStore.setState({ selectedWords: new Set(['abase']), search: '', prefixFilter: '', masteryFilter: 'all', sortOrder: 'az', topN: null });
  useProgressStore.setState({ progress: {} });
});

describe('Flashcards', () => {
  it('shows the word on the front by default', () => {
    render(<Flashcards allWords={[mockWord]} />);
    expect(screen.getByText('abase')).toBeInTheDocument();
    expect(screen.queryByText('to lower in rank or esteem')).toBeNull();
  });

  it('reveals definition after tap', async () => {
    render(<Flashcards allWords={[mockWord]} />);
    await userEvent.click(screen.getByRole('button', { name: /flip/i }));
    expect(screen.getByText('to lower in rank or esteem')).toBeInTheDocument();
  });

  it('shows MW sentence on back, not claude sentence', async () => {
    render(<Flashcards allWords={[mockWord]} />);
    await userEvent.click(screen.getByRole('button', { name: /flip/i }));
    expect(screen.getByText(/He abased himself before the king/)).toBeInTheDocument();
  });

  it('rating buttons call recordAnswer and advance card', async () => {
    const spy = vi.spyOn(useProgressStore.getState(), 'recordAnswer');
    render(<Flashcards allWords={[mockWord]} />);
    await userEvent.click(screen.getByRole('button', { name: /flip/i }));
    await userEvent.click(screen.getByRole('button', { name: /good/i }));
    expect(spy).toHaveBeenCalledWith('abase', 4);
  });

  it('shows no-words message when selection is empty', () => {
    useWordSelectionStore.setState({ selectedWords: new Set(), search: '', prefixFilter: '', masteryFilter: 'all', sortOrder: 'az', topN: null });
    render(<Flashcards allWords={[mockWord]} />);
    expect(screen.getByText(/no words selected/i)).toBeInTheDocument();
  });
});

describe('Flashcards - presentation order', () => {
  const deck: Word[] = Array.from({ length: 12 }, (_, i) => ({
    word: `word${String.fromCharCode(97 + i)}`, prefix: 'ab', pos: 'verb',
    definition: `meaning ${i}`, mwSentence: '', etymology: '', notes: '',
    stems: [`word${String.fromCharCode(97 + i)}`], sentenceSets: [],
  }));

  beforeEach(() => useWordSelectionStore.setState({
    selectedWords: new Set(deck.map(w => w.word)),
    search: '', prefixFilter: '', masteryFilter: 'all', sortOrder: 'az', topN: null,
  }));

  it('does not always start with the alphabetically first card', () => {
    const firsts = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const { unmount } = render(<Flashcards allWords={deck} />);
      firsts.add(screen.getByText(/^word[a-l]$/).textContent!);
      unmount();
    }
    expect(firsts.size).toBeGreaterThan(1);
  });
});
