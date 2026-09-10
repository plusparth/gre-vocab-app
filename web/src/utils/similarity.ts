import type { Word } from '../types';
import { shuffle, type Rng } from './shuffle';

/**
 * Picks distractors that are plausibly confusable with the target: close in
 * meaning, close in spelling, or built from the same word parts.
 */

const DEFINITION_WEIGHT = 0.5;  // meaning
const TRIGRAM_WEIGHT    = 0.3;  // spelling / sound
const MORPHOLOGY_WEIGHT = 0.2;  // shared word parts
const POS_BONUS         = 0.05;

const PREFIX_SHARE = 0.6;  // split of MORPHOLOGY_WEIGHT between prefix and stems
const STEM_SHARE   = 0.4;

/** Draw distractors from this many of the most similar candidates. */
export const MAX_POOL_SIZE = 25;
const POOL_FRACTION = 0.01;

/** Definition words too common to say anything about meaning. */
const STOPWORDS = new Set([
  'the', 'and', 'not', 'but', 'for', 'with', 'from', 'into', 'that', 'this',
  'these', 'those', 'which', 'who', 'whom', 'its', 'his', 'her', 'their',
  'any', 'all', 'some', 'such', 'other', 'than', 'more', 'most', 'very',
  'one', 'two', 'being', 'been', 'have', 'has', 'having', 'are', 'was',
  'were', 'especially', 'esp', 'usually', 'often', 'something', 'someone',
  'person', 'thing', 'quality', 'state', 'act', 'make', 'made', 'used',
]);

interface Features {
  lemma: string;
  trigrams: Set<string>;
  defTokens: Set<string>;
  stems: Set<string>;
}

/**
 * Feature extraction is the expensive part, so cache it per word. A WeakMap
 * keyed on the word object means no invalidation to get wrong.
 */
const featureCache = new WeakMap<Word, Features>();

function trigramsOf(s: string): Set<string> {
  const out = new Set<string>();
  if (s.length < 3) {
    out.add(s);
    return out;
  }
  for (let i = 0; i <= s.length - 3; i++) out.add(s.slice(i, i + 3));
  return out;
}

function definitionTokens(definition: string): Set<string> {
  return new Set(
    definition
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter(t => t.length >= 3 && !STOPWORDS.has(t))
  );
}

function featuresOf(word: Word): Features {
  const cached = featureCache.get(word);
  if (cached) return cached;

  const lemma = word.word.toLowerCase();
  const features: Features = {
    lemma,
    trigrams: trigramsOf(lemma),
    defTokens: definitionTokens(word.definition),
    stems: new Set([lemma, ...word.stems.map(s => s.toLowerCase())]),
  };
  featureCache.set(word, features);
  return features;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const v of a) if (b.has(v)) intersection++;
  return intersection / (a.size + b.size - intersection);
}

/** Symmetric, in [0, 1 + POS_BONUS]. Higher means more confusable. */
export function scoreSimilarity(a: Word, b: Word): number {
  const fa = featuresOf(a);
  const fb = featuresOf(b);

  const prefixMatch = a.prefix && a.prefix === b.prefix ? 1 : 0;
  const morphology = PREFIX_SHARE * prefixMatch + STEM_SHARE * jaccard(fa.stems, fb.stems);

  return (
    DEFINITION_WEIGHT * jaccard(fa.defTokens, fb.defTokens) +
    TRIGRAM_WEIGHT * jaccard(fa.trigrams, fb.trigrams) +
    MORPHOLOGY_WEIGHT * morphology +
    (a.pos && a.pos === b.pos ? POS_BONUS : 0)
  );
}

/**
 * How many of the top-ranked candidates to draw from. Scales with the corpus so
 * the pool stays a meaningful subset, and never falls so low that distractors
 * repeat identically every time.
 */
export function poolSizeFor(candidateCount: number, n: number): number {
  const scaled = Math.ceil(candidateCount * POOL_FRACTION);
  const clamped = Math.min(MAX_POOL_SIZE, Math.max(n * 2, scaled));
  return Math.min(clamped, candidateCount);
}

/** True when the two words are inflections of each other — never both options. */
function sharesStem(a: Word, b: Word): boolean {
  const fa = featuresOf(a);
  const fb = featuresOf(b);
  for (const s of fa.stems) if (fb.stems.has(s)) return true;
  return false;
}

/**
 * Returns up to n distractors drawn at random from the most similar candidates,
 * so they stay plausible without being identical on every attempt.
 */
export function pickGreDistractors(
  target: Word,
  candidates: Word[],
  n: number,
  rng: Rng = Math.random
): Word[] {
  const eligible = candidates.filter(c => c !== target && !sharesStem(target, c));

  const pool = [...eligible]
    .sort((a, b) => scoreSimilarity(target, b) - scoreSimilarity(target, a))
    .slice(0, poolSizeFor(eligible.length, n));

  // Drawn one at a time so no two distractors are inflections of each other:
  // the list has separate entries for e.g. 'progenitor' and 'progenitors'.
  const picked: Word[] = [];
  for (const candidate of shuffle(pool, rng)) {
    if (picked.length === n) break;
    if (picked.some(p => sharesStem(p, candidate))) continue;
    picked.push(candidate);
  }
  return picked;
}
