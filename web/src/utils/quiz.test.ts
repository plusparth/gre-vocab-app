import { describe, it, expect } from 'vitest';
import { buildQuizOptions, buildGreWordQuizOptions, pickSentenceSet, sentenceSetFor, hasUsableSentence, isWellFormedSentence } from './quiz';
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

  it('renders the target in the blanked form even when its stem list lacks it', () => {
    // 'scoff' is filed as a noun, so M-W records no -ed form for it. When the
    // sentence uses 'scoffed' and the distractors render as -ed, a lemma
    // correct answer would be the only odd form on the list.
    const scoff = makeWord('scoff', 'noun', 'an expression of scorn', ['scoff', 'scoffs']);
    const edNouns = [
      makeWord('buttress',  'noun', 'a projecting support', ['buttress', 'buttressed', 'buttresses']),
      makeWord('crescendo', 'noun', 'a peak of intensity',  ['crescendo', 'crescendoed', 'crescendos']),
      makeWord('interplay', 'noun', 'reciprocal action',    ['interplay', 'interplayed', 'interplays']),
      makeWord('ire',       'noun', 'intense anger',        ['ire', 'ired', 'ires']),
      makeWord('quarrel',   'noun', 'an angry dispute',     ['quarrel', 'quarrelled', 'quarrels']),
    ];
    const opts = buildGreWordQuizOptions(scoff, 'He scoffed at the concern.', [scoff, ...edNouns], mulberry32(2));
    expect(opts.find(o => o.isCorrect)!.text).toBe('scoffed');
    opts.forEach(o => expect(o.text.endsWith('ed')).toBe(true));
  });

  it('keeps the target as a lemma when the list falls back to lemmas', () => {
    // Same target, but no candidate can take the inflection, so everything
    // including the answer must render as a lemma.
    const scoff = makeWord('scoff', 'noun', 'an expression of scorn', ['scoff', 'scoffs']);
    const plainNouns = [
      makeWord('disdain',   'noun', 'a feeling of contempt',  ['disdain', 'disdains']),
      makeWord('coffer',    'noun', 'a strongbox',            ['coffer', 'coffers']),
      makeWord('neologism', 'noun', 'a new word',             ['neologism', 'neologisms']),
      makeWord('rebuff',    'noun', 'a blunt refusal',        ['rebuff', 'rebuffs']),
    ];
    const opts = buildGreWordQuizOptions(scoff, 'He scoffed at the concern.', [scoff, ...plainNouns], mulberry32(2));
    expect(opts.find(o => o.isCorrect)!.text).toBe('scoff');
    opts.forEach(o => expect(o.text.endsWith('ed')).toBe(false));
  });

  it('renders everything as lemmas when the blank is a derived form', () => {
    // 'admonishment' is not an inflection any distractor could match.
    const opts = buildGreWordQuizOptions(mockWord, 'His abasement stung.', greCorpus, mulberry32(2));
    const lemmas = new Set(greCorpus.map(w => w.word));
    opts.forEach(o => expect(lemmas.has(o.text)).toBe(true));
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

describe('isWellFormedSentence', () => {
  it('accepts a complete sentence', () => {
    expect(isWellFormedSentence('He abased himself before the king.')).toBe(true);
  });

  it('rejects a dictionary collocation with no terminal punctuation', () => {
    expect(isWellFormedSentence('adorned the wall with her paintings')).toBe(false);
    expect(isWellFormedSentence('a cabal of artists')).toBe(false);
  });

  it('rejects a fragment that starts mid-sentence', () => {
    expect(isWellFormedSentence('burdensome restrictions on the import of goods.')).toBe(false);
  });

  it('rejects anything too short to give context', () => {
    expect(isWellFormedSentence('Freud\'s adherents.')).toBe(false);
  });

  it("rejects Merriam-Webster's elided quotations", () => {
    expect(isWellFormedSentence('… they are adequate for almost any computing need.')).toBe(false);
    expect(isWellFormedSentence('The mill foreman so badgered them ... that they quit.')).toBe(false);
  });

  it('allows a closing quote or bracket after the terminal punctuation', () => {
    expect(isWellFormedSentence('She called the plan "an unmitigated disaster."')).toBe(true);
  });
});

describe('sentenceSetFor rejects unusable sentences', () => {
  it('rejects a Merriam-Webster fragment even though it contains the word', () => {
    const bare = { ...mockWord, sentenceSets: [], mwSentence: 'abased the defeated general' };
    expect(sentenceSetFor(bare)).toBeNull();
    expect(hasUsableSentence(bare, 'greWords')).toBe(false);
  });

  it('skips a generated set whose sentence never uses the word', () => {
    const broken = { sentence: 'The genetic anomaly went unexplained.', answerChoices: [] };
    const word = { ...mockWord, sentenceSets: [broken, mockWord.sentenceSets[0]] };
    for (let i = 0; i < 30; i++) {
      expect(sentenceSetFor(word)!.sentence).toBe(mockWord.sentenceSets[0].sentence);
    }
  });

  it('returns null when every generated set is unusable', () => {
    const word = { ...mockWord, mwSentence: '', sentenceSets: [{ sentence: 'The genetic anomaly went unexplained.', answerChoices: [] }] };
    expect(sentenceSetFor(word)).toBeNull();
  });
});
