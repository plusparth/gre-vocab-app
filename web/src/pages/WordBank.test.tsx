import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WordBank } from './WordBank';
import { useWordSelectionStore } from '../store/wordSelectionStore';
import type { Word } from '../types';

const mockWords: Word[] = [
  { word: 'abase', prefix: 'ab', pos: 'verb', definition: 'to lower in esteem', mwSentence: '', etymology: '', notes: '', stems: [], sentenceSets: [] },
  { word: 'abash', prefix: 'ab', pos: 'verb', definition: 'to embarrass', mwSentence: '', etymology: '', notes: '', stems: [], sentenceSets: [] },
  { word: 'zenith', prefix: 'z', pos: 'noun', definition: 'highest point', mwSentence: '', etymology: '', notes: '', stems: [], sentenceSets: [] },
];

const mockOnStart = () => {};

beforeEach(() => useWordSelectionStore.setState({
  selectedWords: new Set(), search: '', prefixFilter: '',
  masteryFilter: 'all', sortOrder: 'az', topN: null,
}));

describe('WordBank', () => {
  it('renders the vocabulary ledger shell and selection summary', () => {
    render(<WordBank allWords={mockWords} onStart={mockOnStart} />);
    expect(screen.getByRole('heading', { name: /vocabulary ledger/i })).toBeInTheDocument();
    expect(screen.getByText(/words shown/i)).toHaveClass('selection-summary');
    expect(screen.getByTestId('selection-tray')).toHaveClass('selection-tray');
    expect(screen.getByText(/drag a box to select/i)).toBeVisible();
    expect(screen.getAllByText('abase')[0].closest('label')).toHaveClass('word-row--brush-select');
  });

  it('renders all words', () => {
    render(<WordBank allWords={mockWords} onStart={mockOnStart} />);
    expect(screen.getByText('abase')).toBeInTheDocument();
    expect(screen.getByText('abash')).toBeInTheDocument();
    expect(screen.getByText('zenith')).toBeInTheDocument();
  });

  it('selecting a word updates selected count', async () => {
    render(<WordBank allWords={mockWords} onStart={mockOnStart} />);
    await userEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(useWordSelectionStore.getState().selectedWords.size).toBe(1);
  });

  it('search filters displayed words', async () => {
    render(<WordBank allWords={mockWords} onStart={mockOnStart} />);
    await userEvent.type(screen.getByPlaceholderText(/search/i), 'aba');
    expect(screen.getByText('abase')).toBeInTheDocument();
    expect(screen.queryByText('zenith')).toBeNull();
  });

  it('prefix filter chip filters words', async () => {
    render(<WordBank allWords={mockWords} onStart={mockOnStart} />);
    await userEvent.click(screen.getByRole('button', { name: /^ab$/i }));
    expect(screen.queryByText('zenith')).toBeNull();
  });
});
