import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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

function makeVerb(word: string, definition: string, stems: string[]): Word {
  return { word, prefix: '', pos: 'verb', definition, mwSentence: '', etymology: '', notes: '', stems, sentenceSets: [] };
}

const greCorpus: Word[] = [
  mockWord,
  makeVerb('humble',   'to lower in esteem or dignity', ['humble', 'humbled', 'humbles']),
  makeVerb('demean',   'to lower in character or rank', ['demean', 'demeaned', 'demeans']),
  makeVerb('degrade',  'to lower in grade or rank',     ['degrade', 'degraded', 'degrades']),
  makeVerb('censure',  'to blame or condemn formally',  ['censure', 'censured', 'censures']),
  makeVerb('rebuke',   'to criticize sharply',          ['rebuke', 'rebuked', 'rebukes']),
  makeVerb('extol',    'to praise highly',              ['extol', 'extolled', 'extols']),
  makeVerb('lionize',  'to treat as a celebrity',       ['lionize', 'lionized', 'lionizes']),
];

describe('FillInBlank - GRE word distractors', () => {
  beforeEach(() => useSessionStore.setState({ fillInBlankMode: 'greWords', activeMode: 'fillInBlank', flashcardDirection: 'wordFirst', currentIndex: 0, answers: [], sessionActive: false }));

  it('renders 5 answer choices', () => {
    render(<FillInBlank allWords={greCorpus} />);
    expect(screen.getAllByRole('button', { name: /^\([A-E]\)/ })).toHaveLength(5);
  });

  it('draws its distractors from the GRE word list, not the generated choices', () => {
    render(<FillInBlank allWords={greCorpus} />);
    const texts = screen.getAllByRole('button', { name: /^\([A-E]\)/ }).map(b => b.textContent!.replace(/^\([A-E]\)\s*/, ''));
    const generated = mockWord.sentenceSets[0].answerChoices.map(a => a.distractor);
    texts.forEach(t => expect(generated).not.toContain(t));
    const greForms = new Set(greCorpus.flatMap(w => [w.word, ...w.stems]));
    texts.forEach(t => expect(greForms.has(t)).toBe(true));
  });

  it('marks the inflected target as the correct answer', async () => {
    render(<FillInBlank allWords={greCorpus} />);
    await userEvent.click(screen.getByRole('button', { name: /^\([A-E]\) abased$/ }));
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByText(/✓ Correct/)).toBeInTheDocument();
  });

  it('explains a wrong answer with that word own definition', async () => {
    render(<FillInBlank allWords={greCorpus} />);
    const wrong = screen.getAllByRole('button', { name: /^\([A-E]\)/ }).find(b => !/abased/.test(b.textContent!))!;
    const text = wrong.textContent!.replace(/^\([A-E]\)\s*/, '');
    await userEvent.click(wrong);
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    const source = greCorpus.find(w => [w.word, ...w.stems].includes(text))!;
    expect(screen.getByText(new RegExp(source.definition))).toBeInTheDocument();
  });

  it('works for a word that has no generated sentence sets', () => {
    const bare: Word = { ...mockWord, word: 'abase', sentenceSets: [], mwSentence: 'He abased himself before the king.' };
    useWordSelectionStore.setState({ selectedWords: new Set(['abase']) });
    render(<FillInBlank allWords={[bare, ...greCorpus.slice(1)]} />);
    expect(screen.getByText(/before the king/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^\([A-E]\)/ })).toHaveLength(5);
  });
});

describe('FillInBlank - unusable words', () => {
  it('skips a word with no sentence to blank rather than crashing', () => {
    const noSentence: Word = { ...mockWord, word: 'orphan', stems: ['orphan'], sentenceSets: [], mwSentence: '' };
    useWordSelectionStore.setState({ selectedWords: new Set(['orphan', 'abase']) });
    render(<FillInBlank allWords={[noSentence, mockWord]} />);
    expect(screen.getByText(/The general was/)).toBeInTheDocument();
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
  });

  it('reports when no selected word has a usable sentence', () => {
    const noSentence: Word = { ...mockWord, word: 'orphan', stems: ['orphan'], sentenceSets: [], mwSentence: '' };
    useWordSelectionStore.setState({ selectedWords: new Set(['orphan']) });
    render(<FillInBlank allWords={[noSentence]} />);
    expect(screen.getByText(/none of the selected words has a sentence/i)).toBeInTheDocument();
  });
});

describe('FillInBlank - answer mode switcher', () => {
  it('offers all three answer modes', () => {
    render(<FillInBlank allWords={greCorpus} />);
    const group = screen.getByRole('radiogroup', { name: /answer mode/i });
    expect(within(group).getAllByRole('radio')).toHaveLength(3);
  });

  it('switches to GRE word distractors when selected', async () => {
    render(<FillInBlank allWords={greCorpus} />);
    await userEvent.click(screen.getByRole('radio', { name: /gre words/i }));
    expect(useSessionStore.getState().fillInBlankMode).toBe('greWords');
  });
});
