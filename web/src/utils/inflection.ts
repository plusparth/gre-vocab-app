import type { Word } from '../types';

/**
 * The grammatical form a surface word takes relative to its lemma. Quiz options
 * are only interchangeable when they share a class — a lemma sitting among four
 * past-tense distractors gives the answer away.
 */
export type InflectionClass = 'lemma' | 's' | 'ed' | 'ing' | 'other';

/** Checked longest-first so 'admonishing' is not read as an -ing-less form. */
const SUFFIXES: { suffix: string; cls: InflectionClass }[] = [
  { suffix: 'ing', cls: 'ing' },
  { suffix: 'ed', cls: 'ed' },
  { suffix: 's', cls: 's' },
];

/**
 * Strips diacritics. Entries are filed under an unaccented spelling ('soupcon')
 * while the sentences use the accented one ('soupçon'), so every comparison
 * between a word and sentence text runs through this.
 */
export function foldAccents(text: string): string {
  // Folded one code point at a time so the result lines up with the input
  // character for character; blanking maps matches back onto the original text.
  return text.replace(/./gu, char => {
    const stripped = char.normalize('NFD').replace(/\p{Mn}/gu, '');
    return stripped.length === 1 ? stripped : char;
  });
}

/**
 * The regular inflections of a lemma.
 *
 * Merriam-Webster's stem lists follow its own primary sense, so a word filed as
 * a noun carries no verb forms -- 'badger' lists only badger/badgers, and a
 * sentence using 'badgered' would leave the answer sitting in plain sight.
 * These are spelling rules, not a lookup, so they can over-generate; that is
 * harmless, since a form only matters when it actually appears in a sentence.
 */
export function regularInflections(lemma: string): string[] {
  const l = foldAccents(lemma.toLowerCase());
  const forms = new Set<string>([l]);

  if (l.endsWith('e')) {
    forms.add(`${l}d`).add(`${l}s`).add(`${l.slice(0, -1)}ing`);
  } else if (/[^aeiou]y$/.test(l)) {
    forms.add(`${l.slice(0, -1)}ies`).add(`${l.slice(0, -1)}ied`).add(`${l}ing`);
  } else if (/(?:[sxz]|ch|sh)$/.test(l)) {
    forms.add(`${l}es`).add(`${l}ed`).add(`${l}ing`);
  } else {
    forms.add(`${l}s`).add(`${l}ed`).add(`${l}ing`);
  }

  // 'extol' -> 'extolled': a short vowel between consonants doubles the last.
  if (/[^aeiou][aeiou][^aeiouwxy]$/.test(l)) {
    forms.add(`${l}${l.slice(-1)}ed`).add(`${l}${l.slice(-1)}ing`);
  }

  return [...forms];
}

/** Every surface form of the word, accent-folded, longest first. */
export function surfaceForms(word: Word): string[] {
  const forms = new Set<string>([
    foldAccents(word.word.toLowerCase()),
    ...word.stems.map(s => foldAccents(s.toLowerCase())),
    ...regularInflections(word.word),
  ]);
  return [...forms].sort((a, b) => b.length - a.length);
}

export function classifyInflection(lemma: string, form: string): InflectionClass {
  const l = foldAccents(lemma.toLowerCase());
  const f = foldAccents(form.toLowerCase());
  if (f === l) return 'lemma';
  for (const { suffix, cls } of SUFFIXES) {
    if (f.endsWith(suffix)) return cls;
  }
  return 'other';
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Which of the word's forms actually appears in the sentence — the form the
 * blank will stand in for. Longest first, so 'admonishment' wins over the
 * 'admonish' it contains.
 */
export function findStemInSentence(sentence: string, word: Word): string | null {
  const folded = foldAccents(sentence);

  for (const form of surfaceForms(word)) {
    if (new RegExp(`\\b${escapeRegExp(form)}\\b`, 'i').test(folded)) return form;
  }
  return null;
}

/**
 * The uninflected form of an entry.
 *
 * Some entries in the word list are filed under an inflected head word --
 * 'adorned' with no 'adorn' entry, 'progenitors' alongside 'progenitor'. Left
 * alone those render as the odd one out among lemma options. A stem only
 * rewrites the head word when it is a strictly shorter form the head word is a
 * recognised inflection of, so variant spellings and derivations are untouched.
 */
export function baseForm(word: Word): string {
  const head = word.word.toLowerCase();

  return word.stems
    .map(s => s.toLowerCase())
    .filter(s => s.length < head.length && head.startsWith(s) && classifyInflection(s, head) !== 'other')
    .sort((a, b) => b.length - a.length)[0] ?? head;
}

/**
 * The word rendered in the given class, or null if it has no such form.
 * Shortest match wins: for -s that picks the verb form 'admonishes' over the
 * derived plurals 'admonishers' and 'admonishments'.
 */
export function stemForClass(word: Word, cls: InflectionClass): string | null {
  const lemma = baseForm(word);
  if (cls === 'lemma') return lemma;
  if (cls === 'other') return null;

  const matches = word.stems
    .map(s => s.toLowerCase())
    .filter(s => s !== lemma && isInflectionOf(lemma, s) && classifyInflection(lemma, s) === cls)
    .sort((a, b) => a.length - b.length || a.localeCompare(b));

  return matches[0] ?? null;
}

/**
 * Whether the form is built from the lemma rather than merely related to it.
 * Stem lists mix in neighbouring words -- the entry for 'adulation' carries the
 * verb's forms too, and 'adulates' is not its plural. Inflection may drop a
 * trailing e ('abase' -> 'abasing') or replace a trailing y ('carry' ->
 * 'carries'), so those truncations count as bases as well.
 */
function isInflectionOf(lemma: string, form: string): boolean {
  const bases = [lemma];
  if (/[ey]$/.test(lemma)) bases.push(lemma.slice(0, -1));
  return bases.some(base => form.length > base.length && form.startsWith(base));
}
