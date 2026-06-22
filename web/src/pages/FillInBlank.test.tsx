import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FillInBlank } from './FillInBlank';
import { useWordSelectionStore } from '../store/wordSelectionStore';
import { useSessionStore } from '../store/sessionStore';
import type { Word } from '../types';

const mockWord: Word = {
  word: 'abase', prefix: 'ab', pos: 'verb',
  definition: 'to lower in rank or esteem',
  mwSentence: '', etymology: '', notes: '',
  stems: ['abase', 'abased', 'abasing'],
  sentenceSets: [{
    sentence: 'The general was abased after the scandal.',
    answerChoices: [
      { distractor: 'demote',    closeness: 3, reasoning: 'close' },
      { distractor: 'degrade',   closeness: 3, reasoning: 'close2' },
      { distractor: 'relegate',  closeness: 3, reasoning: 'close3' },
      { distractor: 'discredit', closeness: 3, reasoning: 'close4' },
      { distractor: 'censure',   closeness: 2, reasoning: 'mid' },
      { distractor: 'rebuke',    closeness: 2, reasoning: 'mid2' },
      { distractor: 'penalize',  closeness: 2, reasoning: 'mid3' },
      { distractor: 'suspend',   closeness: 2, reasoning: 'mid4' },
      { distractor: 'extol',     closeness: 1, reasoning: 'far' },
      { distractor: 'exalt',     closeness: 1, reasoning: 'far2' },
      { distractor: 'lionize',   closeness: 1, reasoning: 'far3' },
    ],
  }],
};

beforeEach(() => {
  useWordSelectionStore.setState({ selectedWords: new Set(['abase']), search: '', prefixFilter: '', masteryFilter: 'all', sortOrder: 'az', topN: null });
  useSessionStore.setState({ fillInBlankMode: 'multipleChoice', activeMode: 'fillInBlank', flashcardDirection: 'wordFirst', currentIndex: 0, answers: [], sessionActive: false });
});

describe('FillInBlank - multiple choice', () => {
  it('renders sentence with blank', () => {
    render(<FillInBlank allWords={[mockWord]} />);
    expect(screen.getByText(/The general was/)).toBeInTheDocument();
  });

  it('renders 5 answer choices', () => {
    render(<FillInBlank allWords={[mockWord]} />);
    const buttons = screen.getAllByRole('button', { name: /^\([A-E]\)/ });
    expect(buttons).toHaveLength(5);
  });

  it('selecting correct answer and submitting shows green feedback', async () => {
    render(<FillInBlank allWords={[mockWord]} />);
    const correct = screen.getByRole('button', { name: /abase/i });
    await userEvent.click(correct);
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByText(/correct/i)).toBeInTheDocument();
  });
});

describe('FillInBlank - typed', () => {
  beforeEach(() => useSessionStore.setState({ fillInBlankMode: 'typed', activeMode: 'fillInBlank', flashcardDirection: 'wordFirst', currentIndex: 0, answers: [], sessionActive: false }));

  it('renders a text input instead of choices', () => {
    render(<FillInBlank allWords={[mockWord]} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('accepts inflected stem as correct', async () => {
    render(<FillInBlank allWords={[mockWord]} />);
    await userEvent.type(screen.getByRole('textbox'), 'abased');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByText(/correct/i)).toBeInTheDocument();
  });

  it('rejects wrong answer', async () => {
    render(<FillInBlank allWords={[mockWord]} />);
    await userEvent.type(screen.getByRole('textbox'), 'extol');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
  });
});
