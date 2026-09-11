import { foldAccents, surfaceForms } from './inflection';
import type { Word } from '../types';

export const BLANK = '______';

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Letters either side disqualify a match, so 'hound' is not found inside
 * 'bloodhound'. Written as lookarounds rather than \b because entries can span
 * a space or a hyphen ('non sequitur', 'self-effacing') and must match whole.
 */
function formPattern(forms: string[]): RegExp {
  const alternation = forms.map(escapeRegExp).join('|');
  return new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])(?:${alternation})(?![\\p{L}\\p{M}\\p{N}])`, 'giu');
}

/**
 * Replaces every appearance of the word in the sentence with a blank.
 *
 * Matching runs over accent-folded surface forms, which covers the inflections
 * Merriam-Webster's stem lists omit and the accented spellings its head words
 * drop. Folding preserves character positions, so matches found in the folded
 * text are spliced out of the original and the surrounding text keeps its
 * accents. `count` is zero when the word never appears — the sentence cannot be
 * used as a question, because the answer would be sitting in plain sight.
 */
export function blankOut(sentence: string, word: Word): { text: string; count: number } {
  const forms = surfaceForms(word);
  if (forms.length === 0) return { text: sentence, count: 0 };

  const folded = foldAccents(sentence);
  let out = '';
  let cursor = 0;
  let count = 0;

  for (const match of folded.matchAll(formPattern(forms))) {
    out += sentence.slice(cursor, match.index) + BLANK;
    cursor = match.index + match[0].length;
    count++;
  }

  return { text: out + sentence.slice(cursor), count };
}
