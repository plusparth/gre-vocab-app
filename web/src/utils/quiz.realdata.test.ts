import { describe, it, expect } from 'vitest';
import { buildGreWordQuizOptions, hasUsableSentence } from './quiz';
import { blankOut } from './blank';
import { baseForm, classifyInflection, surfaceForms } from './inflection';
import { mulberry32, shuffle } from './shuffle';
import words from '../data/words.json';
import type { Word } from '../types';

const all = words as Word[];

/** Parts of speech with too few entries fall back to a cross-category draw. */
const MIN_POS_GROUP = 20;

const posCounts = all.reduce<Record<string, number>>((acc, w) => {
  acc[w.pos] = (acc[w.pos] ?? 0) + 1;
  return acc;
}, {});

/** Deterministic stand-in for sentenceSetFor, which picks at random. */
function firstUsableSentence(word: Word): string | null {
  const set = word.sentenceSets.find(s => blankOut(s.sentence, word).count > 0);
  if (set) return set.sentence;
  return hasUsableSentence(word, 'greWords') ? word.mwSentence : null;
}

const sampled = shuffle(all, mulberry32(99))
  .filter(w => posCounts[w.pos] >= MIN_POS_GROUP && firstUsableSentence(w) !== null)
  .slice(0, 120);

/**
 * The entry an option was rendered from, resolved within the target's category.
 * Most precise match first: the head word, then a recorded stem, then a regular
 * inflection (which is how a word whose stems omit the form is rendered).
 */
function resolve(text: string, pos: string): Word | undefined {
  const pool = all.filter(x => x.pos === pos);
  return pool.find(x => x.word.toLowerCase() === text)
      ?? pool.find(x => x.stems.some(f => f.toLowerCase() === text))
      ?? pool.find(x => surfaceForms(x).includes(text));
}

describe('GRE-word questions over the real word list', () => {
  it('has words to sample', () => {
    expect(sampled).toHaveLength(120);
  });

  it.each(sampled.map((w, i) => [w.word, w, i] as const))(
    '%s offers five distinct, consistently formed choices',
    (_name, word, i) => {
      const sentence = firstUsableSentence(word)!;
      const options = buildGreWordQuizOptions(word, sentence, all, mulberry32(i));

      expect(options).toHaveLength(5);
      expect(new Set(options.map(o => o.text)).size).toBe(5);

      const classes = new Set<string>();
      for (const option of options) {
        const source = resolve(option.text, word.pos);
        expect(source, `${option.text} is not a ${word.pos} in the word list`).toBeDefined();
        classes.add(classifyInflection(baseForm(source!), option.text));
      }
      // A lemma among four past-tense choices would give the answer away.
      expect([...classes]).toHaveLength(1);
    }
  );
});
