import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Match } from './Match';
import { useWordSelectionStore } from '../store/wordSelectionStore';
import type { Word } from '../types';

function makeWord(w: string, def: string): Word {
  return { word: w, prefix: 'ab', pos: 'verb', definition: def, mwSentence: '', etymology: '', notes: '', stems: [w], sentenceSets: [] };
}

const sixWords = [
  makeWord('abase',    'to lower in esteem'),
  makeWord('abash',    'to embarrass'),
  makeWord('abate',    'to reduce in force'),
  makeWord('abdicate', 'to give up power'),
  makeWord('aberrant', 'deviating from norm'),
  makeWord('abet',     'to encourage wrongdoing'),
];

beforeEach(() => useWordSelectionStore.setState({
  selectedWords: new Set(sixWords.map(w => w.word)),
  search: '', prefixFilter: '', masteryFilter: 'all', sortOrder: 'az', topN: null,
}));

describe('Match', () => {
  it('renders 6 word tiles and 6 definition tiles', () => {
    render(<Match allWords={sixWords} />);
    sixWords.forEach(w => {
      expect(screen.getByText(w.word)).toBeInTheDocument();
      expect(screen.getByText(w.definition)).toBeInTheDocument();
    });
  });

  it('selecting a word then its correct definition locks both green', async () => {
    render(<Match allWords={sixWords} />);
    await userEvent.click(screen.getByText('abase'));
    await userEvent.click(screen.getByText('to lower in esteem'));
    expect(screen.getByText('abase').closest('[data-matched]')).toBeInTheDocument();
  });

  it('shows no-words message when fewer than 2 words selected', () => {
    useWordSelectionStore.setState({ selectedWords: new Set(['abase']), search: '', prefixFilter: '', masteryFilter: 'all', sortOrder: 'az', topN: null });
    render(<Match allWords={sixWords} />);
    expect(screen.getByText(/not enough words/i)).toBeInTheDocument();
  });
});

describe('Match - presentation order', () => {
  const twelve = Array.from({ length: 12 }, (_, i) =>
    makeWord(`word${String.fromCharCode(97 + i)}`, `meaning ${i}`)
  );

  beforeEach(() => useWordSelectionStore.setState({
    selectedWords: new Set(twelve.map(w => w.word)),
    search: '', prefixFilter: '', masteryFilter: 'all', sortOrder: 'az', topN: null,
  }));

  it('does not always put the same words in the first round', () => {
    const rounds = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const { unmount } = render(<Match allWords={twelve} />);
      rounds.add(screen.getAllByText(/^word[a-l]$/).map(e => e.textContent).join(','));
      unmount();
    }
    expect(rounds.size).toBeGreaterThan(1);
  });
});
