import { describe, it, expect } from 'vitest';
import { buildQuizOptions, buildGreWordQuizOptions, pickSentenceSet, sentenceSetFor, hasUsableSentence } from './quiz';
import { mulberry32 } from './shuffle';
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

  it('renders the correct option in the form the sentence blanks out', () => {
    // The sentence reads 'The general was abased.', so a lemma option would be
    // the only ungrammatical choice on the list -- a giveaway.
    const opts = buildQuizOptions(mockWord, mockWord.sentenceSets[0]);
    const correct = opts.find(o => o.isCorrect)!;
    expect(correct.text).toBe('abased');
  });

  it('renders the correct option as the lemma when the sentence uses the lemma', () => {
    const set = { ...mockWord.sentenceSets[0], sentence: 'They abase themselves daily.' };
    const opts = buildQuizOptions(mockWord, set);
    expect(opts.find(o => o.isCorrect)!.text).toBe('abase');
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


function makeWord(word: string, pos: string, definition: string, stems: string[]): Word {
  return { word, prefix: '', pos, definition, mwSentence: '', etymology: '', notes: '', stems, sentenceSets: [] };
}

const verbs = [
  makeWord('humble',   'verb', 'to lower in esteem or dignity',   ['humble', 'humbled', 'humbles', 'humbling']),
  makeWord('demean',   'verb', 'to lower in character or rank',   ['demean', 'demeaned', 'demeans', 'demeaning']),
  makeWord('degrade',  'verb', 'to lower in grade or rank',       ['degrade', 'degraded', 'degrades', 'degrading']),
  makeWord('censure',  'verb', 'to blame or condemn formally',    ['censure', 'censured', 'censures', 'censuring']),
  makeWord('rebuke',   'verb', 'to criticize sharply',            ['rebuke', 'rebuked', 'rebukes', 'rebuking']),
  makeWord('extol',    'verb', 'to praise highly',                ['extol', 'extolled', 'extols', 'extolling']),
  makeWord('lionize',  'verb', 'to treat as a celebrity',         ['lionize', 'lionized', 'lionizes', 'lionizing']),
  makeWord('relegate', 'verb', 'to assign to a lower position',   ['relegate', 'relegated', 'relegates', 'relegating']),
];
const nouns = [
  makeWord('zenith',  'noun', 'the highest point of the sky',  ['zenith', 'zeniths']),
  makeWord('nadir',   'noun', 'the lowest point of something', ['nadir', 'nadirs']),
  makeWord('acumen',  'noun', 'keenness of judgment',          ['acumen', 'acumens']),
];
const greCorpus = [mockWord, ...verbs, ...nouns];

describe('buildGreWordQuizOptions', () => {
  const sentence = 'The general was abased after the scandal.';

  it('returns 5 options with exactly one correct', () => {
    const opts = buildGreWordQuizOptions(mockWord, sentence, greCorpus, mulberry32(1));
    expect(opts).toHaveLength(5);
    expect(opts.filter(o => o.isCorrect)).toHaveLength(1);
  });

  it('uses other GRE list words as the distractors', () => {
    const opts = buildGreWordQuizOptions(mockWord, sentence, greCorpus, mulberry32(1));
    const greForms = new Set(greCorpus.flatMap(w => [w.word, ...w.stems]));
    opts.filter(o => !o.isCorrect).forEach(o => expect(greForms).toContain(o.text));
  });

  it('renders every option in the inflection the sentence blanks out', () => {
    const opts = buildGreWordQuizOptions(mockWord, sentence, greCorpus, mulberry32(1));
    expect(opts.find(o => o.isCorrect)!.text).toBe('abased');
    opts.forEach(o => expect(o.text.endsWith('ed')).toBe(true));
  });

  it('renders every option as a lemma when the sentence uses the lemma', () => {
    const opts = buildGreWordQuizOptions(mockWord, 'They abase themselves.', greCorpus, mulberry32(1));
    const lemmas = new Set(greCorpus.map(w => w.word));
    opts.forEach(o => expect(lemmas).toContain(o.text));
  });

  it('only uses distractors with the same part of speech', () => {
    const nounForms = new Set(nouns.flatMap(w => [w.word, ...w.stems]));
    for (let seed = 0; seed < 30; seed++) {
      const opts = buildGreWordQuizOptions(mockWord, sentence, greCorpus, mulberry32(seed));
      opts.forEach(o => expect(nounForms.has(o.text)).toBe(false));
    }
  });

  it('never offers the target word or one of its inflections as a distractor', () => {
    for (let seed = 0; seed < 30; seed++) {
      const opts = buildGreWordQuizOptions(mockWord, sentence, greCorpus, mulberry32(seed));
      const distractors = opts.filter(o => !o.isCorrect).map(o => o.text);
      ['abase', 'abased', 'abasing'].forEach(f => expect(distractors).not.toContain(f));
    }
  });

  it('explains each distractor with its own definition', () => {
    const opts = buildGreWordQuizOptions(mockWord, sentence, greCorpus, mulberry32(1));
    const byForm = new Map(greCorpus.flatMap(w => [w.word, ...w.stems].map(f => [f, w.definition] as const)));
    opts.filter(o => !o.isCorrect).forEach(o => expect(o.reasoning).toBe(byForm.get(o.text)));
  });

  it('falls back to lemmas for every option when no candidate has the inflection', () => {
    // Nouns have no -ed form, so an -ed blank cannot be matched; the whole list
    // drops to lemmas rather than mixing forms.
    const noEd = [mockWord, ...verbs.map(v => makeWord(v.word, 'verb', v.definition, [v.word]))];
    const opts = buildGreWordQuizOptions(mockWord, sentence, noEd, mulberry32(1));
    expect(opts).toHaveLength(5);
    opts.forEach(o => expect(o.text.endsWith('ed')).toBe(false));
    expect(opts.find(o => o.isCorrect)!.text).toBe('abase');
  });

  it('renders an inflected head word in the same form as the rest of the list', () => {
    // 'adorned' is its own entry in the word list; among lemma options it must
    // still read as 'adorn'.
    const adorned = makeWord('adorned', 'verb', 'to enhance the appearance of', ['adorn', 'adorned', 'adorning', 'adorns']);
    const corpus = [mockWord, adorned, ...verbs];
    for (let seed = 0; seed < 30; seed++) {
      const opts = buildGreWordQuizOptions(mockWord, 'They abase themselves.', corpus, mulberry32(seed));
      expect(opts.map(o => o.text)).not.toContain('adorned');
    }
  });

  it('is deterministic for a given seed', () => {
    const a = buildGreWordQuizOptions(mockWord, sentence, greCorpus, mulberry32(4)).map(o => o.text);
    const b = buildGreWordQuizOptions(mockWord, sentence, greCorpus, mulberry32(4)).map(o => o.text);
    expect(a).toEqual(b);
  });
});

describe('sentenceSetFor', () => {
  it('uses a generated sentence set when the word has one', () => {
    const set = sentenceSetFor(mockWord)!;
    expect(mockWord.sentenceSets).toContain(set);
  });

  it('falls back to the Merriam-Webster sentence when there are no generated sets', () => {
    const bare = { ...mockWord, sentenceSets: [], mwSentence: 'He abased himself before the king.' };
    expect(sentenceSetFor(bare)!.sentence).toBe('He abased himself before the king.');
  });

  it('carries no answer choices on the fallback set', () => {
    const bare = { ...mockWord, sentenceSets: [], mwSentence: 'He abased himself before the king.' };
    expect(sentenceSetFor(bare)!.answerChoices).toEqual([]);
  });

  it('rejects a Merriam-Webster sentence that never uses the word', () => {
    // Nothing to blank out, so the question would be unanswerable.
    const bare = { ...mockWord, sentenceSets: [], mwSentence: 'A sentence about something else.' };
    expect(sentenceSetFor(bare)).toBeNull();
  });

  it('returns null when the word has no sentence at all', () => {
    expect(sentenceSetFor({ ...mockWord, sentenceSets: [], mwSentence: '' })).toBeNull();
  });
});

describe('hasUsableSentence', () => {
  const bare = { ...mockWord, sentenceSets: [], mwSentence: 'He abased himself before the king.' };

  it('requires generated answer choices for the generated-distractor mode', () => {
    expect(hasUsableSentence(mockWord, 'multipleChoice')).toBe(true);
    expect(hasUsableSentence(bare, 'multipleChoice')).toBe(false);
  });

  it('accepts a Merriam-Webster fallback for the GRE-word and typed modes', () => {
    expect(hasUsableSentence(bare, 'greWords')).toBe(true);
    expect(hasUsableSentence(bare, 'typed')).toBe(true);
  });

  it('rejects a word with no usable sentence in every mode', () => {
    const none = { ...mockWord, sentenceSets: [], mwSentence: '' };
    expect(hasUsableSentence(none, 'multipleChoice')).toBe(false);
    expect(hasUsableSentence(none, 'greWords')).toBe(false);
    expect(hasUsableSentence(none, 'typed')).toBe(false);
  });
});
