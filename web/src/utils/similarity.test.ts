import { describe, it, expect } from 'vitest';
import { scoreSimilarity, pickGreDistractors, poolSizeFor, MAX_POOL_SIZE } from './similarity';
import { mulberry32 } from './shuffle';
import type { Word } from '../types';

function makeWord(overrides: Partial<Word> & { word: string }): Word {
  return {
    prefix: '', pos: 'noun', definition: '', mwSentence: '',
    etymology: '', notes: '', stems: [overrides.word], sentenceSets: [],
    ...overrides,
  };
}

const target = makeWord({
  word: 'abase', prefix: 'ab', pos: 'verb',
  definition: 'to lower in rank or esteem',
  stems: ['abase', 'abased', 'abasing'],
});

describe('scoreSimilarity', () => {
  it('ranks a word with overlapping definition above an unrelated one', () => {
    const related   = makeWord({ word: 'humble',  pos: 'verb', definition: 'to lower in esteem or dignity' });
    const unrelated = makeWord({ word: 'zenith',  pos: 'noun', definition: 'the highest point of the sky' });
    expect(scoreSimilarity(target, related)).toBeGreaterThan(scoreSimilarity(target, unrelated));
  });

  it('ranks a look-alike word above a word that shares no letters', () => {
    const lookAlike = makeWord({ word: 'abash',  pos: 'verb', definition: 'to destroy the composure of' });
    const different = makeWord({ word: 'quixotic', pos: 'verb', definition: 'to destroy the composure of' });
    expect(scoreSimilarity(target, lookAlike)).toBeGreaterThan(scoreSimilarity(target, different));
  });

  it('ranks a word sharing the same prefix above one that does not', () => {
    const samePrefix = makeWord({ word: 'obtrude', prefix: 'ab', pos: 'verb', definition: 'to thrust forward' });
    const diffPrefix = makeWord({ word: 'obtrude', prefix: 'ob', pos: 'verb', definition: 'to thrust forward' });
    expect(scoreSimilarity(target, samePrefix)).toBeGreaterThan(scoreSimilarity(target, diffPrefix));
  });

  it('ranks a word with the same part of speech above one without', () => {
    const sameiPos = makeWord({ word: 'plunge', pos: 'verb', definition: 'to move suddenly downward' });
    const diffPos  = makeWord({ word: 'plunge', pos: 'noun', definition: 'to move suddenly downward' });
    expect(scoreSimilarity(target, sameiPos)).toBeGreaterThan(scoreSimilarity(target, diffPos));
  });

  it('is symmetric', () => {
    const other = makeWord({ word: 'humble', pos: 'verb', definition: 'to lower in esteem or dignity' });
    expect(scoreSimilarity(target, other)).toBeCloseTo(scoreSimilarity(other, target), 10);
  });

  it('never returns a negative score', () => {
    const other = makeWord({ word: 'zzz', pos: 'noun', definition: '' });
    expect(scoreSimilarity(target, other)).toBeGreaterThanOrEqual(0);
  });
});

describe('poolSizeFor', () => {
  it('caps the pool for a large word list', () => {
    expect(poolSizeFor(2866, 4)).toBe(MAX_POOL_SIZE);
  });

  it('keeps the pool at least twice the number of distractors needed', () => {
    expect(poolSizeFor(40, 4)).toBe(8);
  });

  it('never exceeds the number of available candidates', () => {
    expect(poolSizeFor(5, 4)).toBe(5);
  });
});

describe('pickGreDistractors', () => {
  // 40 filler words so the pool is a genuine subset of the corpus.
  const filler = Array.from({ length: 40 }, (_, i) =>
    makeWord({ word: `filler${i}`, pos: 'noun', definition: `unrelated meaning number ${i}` })
  );
  const corpus = [
    target,
    makeWord({ word: 'humble', pos: 'verb', definition: 'to lower in esteem or dignity' }),
    makeWord({ word: 'demean', pos: 'verb', definition: 'to lower in character or rank' }),
    ...filler,
  ];

  it('returns the requested number of distractors', () => {
    expect(pickGreDistractors(target, corpus, 4, mulberry32(1))).toHaveLength(4);
  });

  it('never includes the target word', () => {
    for (let seed = 0; seed < 50; seed++) {
      const picked = pickGreDistractors(target, corpus, 4, mulberry32(seed));
      expect(picked.map(w => w.word)).not.toContain('abase');
    }
  });

  it('excludes words that share a stem with the target', () => {
    // 'abased' is an inflection of the target: as a distractor it would be a
    // second correct answer.
    const inflection = makeWord({ word: 'abased', pos: 'verb', definition: 'to lower in rank or esteem', stems: ['abase', 'abased'] });
    for (let seed = 0; seed < 50; seed++) {
      const picked = pickGreDistractors(target, [...corpus, inflection], 4, mulberry32(seed));
      expect(picked.map(w => w.word)).not.toContain('abased');
    }
  });

  it('never repeats a distractor within one set', () => {
    const picked = pickGreDistractors(target, corpus, 4, mulberry32(11));
    expect(new Set(picked.map(w => w.word)).size).toBe(4);
  });

  it('draws only from the most similar candidates', () => {
    const candidates = corpus.filter(w => w.word !== target.word);
    const pool = new Set(
      [...candidates]
        .sort((a, b) => scoreSimilarity(target, b) - scoreSimilarity(target, a))
        .slice(0, poolSizeFor(candidates.length, 4))
        .map(w => w.word)
    );
    for (let seed = 0; seed < 20; seed++) {
      const picked = pickGreDistractors(target, corpus, 4, mulberry32(seed));
      picked.forEach(d => expect(pool.has(d.word)).toBe(true));
    }
  });

  it('is deterministic for a given seed but varies across seeds', () => {
    const a = pickGreDistractors(target, corpus, 4, mulberry32(3)).map(w => w.word);
    const b = pickGreDistractors(target, corpus, 4, mulberry32(3)).map(w => w.word);
    expect(a).toEqual(b);

    const seen = new Set<string>();
    for (let seed = 0; seed < 20; seed++) {
      seen.add(pickGreDistractors(target, corpus, 4, mulberry32(seed)).map(w => w.word).join(','));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('never offers two distractors that are inflections of each other', () => {
    // The word list has separate entries for e.g. 'progenitor' and
    // 'progenitors'; offering both as choices reads as a bug.
    const pairA = makeWord({ word: 'progenitor',  pos: 'verb', definition: 'an ancestor in the direct line', stems: ['progenitor', 'progenitors'] });
    const pairB = makeWord({ word: 'progenitors', pos: 'verb', definition: 'an ancestor in the direct line', stems: ['progenitor', 'progenitors'] });
    const small = [target, pairA, pairB, ...filler.slice(0, 4)];
    for (let seed = 0; seed < 50; seed++) {
      const picked = pickGreDistractors(target, small, 4, mulberry32(seed)).map(w => w.word);
      expect(picked.includes('progenitor') && picked.includes('progenitors')).toBe(false);
    }
  });

  it('returns fewer distractors than requested rather than throwing on a tiny corpus', () => {
    const tiny = [target, makeWord({ word: 'humble', pos: 'verb', definition: 'to lower' })];
    expect(pickGreDistractors(target, tiny, 4, mulberry32(1))).toHaveLength(1);
  });
});
