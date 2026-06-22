import { describe, it, expect } from 'vitest';
import { buildQuizOptions, pickSentenceSet } from './quiz';
import type { Word } from '../types';

const mockWord: Word = {
  word: 'abase',
  prefix: 'ab',
  pos: 'verb',
  definition: 'to lower in rank or esteem',
  mwSentence: 'He abased himself.',
  etymology: '',
  notes: '',
  stems: ['abase', 'abased', 'abasing'],
  sentenceSets: [
    {
      sentence: 'The general was abased.',
      answerChoices: [
        { distractor: 'demote',    closeness: 3, reasoning: 'r1' },
        { distractor: 'degrade',   closeness: 3, reasoning: 'r2' },
        { distractor: 'relegate',  closeness: 3, reasoning: 'r3' },
        { distractor: 'discredit', closeness: 3, reasoning: 'r4' },
        { distractor: 'censure',   closeness: 2, reasoning: 'r5' },
        { distractor: 'penalize',  closeness: 2, reasoning: 'r6' },
        { distractor: 'rebuke',    closeness: 2, reasoning: 'r7' },
        { distractor: 'suspend',   closeness: 2, reasoning: 'r8' },
        { distractor: 'extol',     closeness: 1, reasoning: 'r9' },
        { distractor: 'exalt',     closeness: 1, reasoning: 'r10' },
        { distractor: 'lionize',   closeness: 1, reasoning: 'r11' },
      ],
    },
  ],
};

describe('buildQuizOptions', () => {
  it('returns exactly 5 options', () => {
    const opts = buildQuizOptions(mockWord, mockWord.sentenceSets[0]);
    expect(opts).toHaveLength(5);
  });

  it('includes exactly one correct option', () => {
    const opts = buildQuizOptions(mockWord, mockWord.sentenceSets[0]);
    expect(opts.filter(o => o.isCorrect)).toHaveLength(1);
  });

  it('correct option text is the word itself', () => {
    const opts = buildQuizOptions(mockWord, mockWord.sentenceSets[0]);
    const correct = opts.find(o => o.isCorrect)!;
    expect(correct.text).toBe('abase');
  });

  it('includes 2 closeness-3, 1 closeness-2, 1 closeness-1 distractors', () => {
    const opts = buildQuizOptions(mockWord, mockWord.sentenceSets[0]);
    const distractors = opts.filter(o => !o.isCorrect);
    expect(distractors.filter(d => d.closeness === 3)).toHaveLength(2);
    expect(distractors.filter(d => d.closeness === 2)).toHaveLength(1);
    expect(distractors.filter(d => d.closeness === 1)).toHaveLength(1);
  });
});

describe('pickSentenceSet', () => {
  it('returns one of the word sentenceSets', () => {
    const set = pickSentenceSet(mockWord);
    expect(mockWord.sentenceSets).toContain(set);
  });
});
