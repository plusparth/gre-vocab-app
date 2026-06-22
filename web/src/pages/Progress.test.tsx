import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from './Progress';
import { useProgressStore } from '../store/progressStore';
import type { Word } from '../types';

const mockWords: Word[] = [
  { word: 'abase', prefix: 'ab', pos: 'verb', definition: 'to lower', mwSentence: '', etymology: '', notes: '', stems: [], sentenceSets: [] },
  { word: 'abash', prefix: 'ab', pos: 'verb', definition: 'to embarrass', mwSentence: '', etymology: '', notes: '', stems: [], sentenceSets: [] },
];

beforeEach(() => {
  vi.setSystemTime(new Date('2026-06-21'));
  useProgressStore.setState({ progress: {} });
});
afterEach(() => vi.useRealTimers());

describe('Progress', () => {
  it('shows all words as new when no progress', () => {
    render(<Progress allWords={mockWords} />);
    expect(screen.getByText(/2.*new/i)).toBeInTheDocument();
  });

  it('shows mastered count after words are studied', () => {
    useProgressStore.setState({
      progress: {
        abase: { interval: 21, easeFactor: 2.5, repetitions: 3, dueDate: '2026-07-12' },
      },
    });
    render(<Progress allWords={mockWords} />);
    expect(screen.getByText(/1.*mastered/i)).toBeInTheDocument();
  });

  it('renders a streak counter', () => {
    render(<Progress allWords={mockWords} />);
    expect(screen.getByText(/streak/i)).toBeInTheDocument();
  });
});
