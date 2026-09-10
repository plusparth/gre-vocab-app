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

export function classifyInflection(lemma: string, form: string): InflectionClass {
  const l = lemma.toLowerCase();
  const f = form.toLowerCase();
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
  const forms = [word.word, ...word.stems]
    .map(s => s.toLowerCase())
    .sort((a, b) => b.length - a.length);

  for (const form of forms) {
    if (new RegExp(`\\b${escapeRegExp(form)}\\b`, 'i').test(sentence)) return form;
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
