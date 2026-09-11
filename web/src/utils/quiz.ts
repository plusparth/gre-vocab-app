import type { Word, SentenceSet, QuizOption, AnswerChoice, FillInBlankMode } from '../types';
import { sample, shuffle, type Rng } from './shuffle';
import { pickGreDistractors, scoreSimilarity } from './similarity';
import { baseForm, classifyInflection, findStemInSentence, stemForClass, type InflectionClass } from './inflection';
import { blankOut } from './blank';

const DISTRACTOR_COUNT = 4;

/** Relative closeness assigned to drawn distractors, most similar first. */
const CLOSENESS_BY_RANK: (1 | 2 | 3)[] = [3, 3, 2, 1];

export function pickSentenceSet(word: Word): SentenceSet {
  return word.sentenceSets[Math.floor(Math.random() * word.sentenceSets.length)];
}

/** Shortest sentence that can carry enough context to be answerable. */
const MIN_SENTENCE_WORDS = 6;

/**
 * Whether the text is a sentence rather than a dictionary snippet.
 *
 * Merriam-Webster's examples are usage evidence, not prose: most are bare
 * collocations ('a cabal of artists'), start mid-clause, or are quotations
 * elided with an ellipsis. Blanking a word out of one of those leaves nothing
 * to reason from.
 */
export function isWellFormedSentence(text: string): boolean {
  const trimmed = text.trim();

  return trimmed.split(/\s+/).length >= MIN_SENTENCE_WORDS
    && /^[A-Z]/.test(trimmed)
    && /[.!?]["'\u2019)\]]?$/.test(trimmed)
    && !/\u2026|\.\.\./.test(trimmed);
}

/** A sentence is only usable if the word actually appears in it to blank out. */
function isUsableSentence(sentence: string, word: Word): boolean {
  return blankOut(sentence, word).count > 0;
}

/**
 * The sentence a question is built on.
 *
 * Generated sets come first, skipping any whose sentence never uses the word.
 * Roughly half the list has no generated sets at all; those words fall back to
 * the dictionary sentence, but only when it is a real sentence.
 */
export function sentenceSetFor(word: Word): SentenceSet | null {
  const usable = word.sentenceSets.filter(s => isUsableSentence(s.sentence, word));
  if (usable.length > 0) return usable[Math.floor(Math.random() * usable.length)];

  if (word.mwSentence && isWellFormedSentence(word.mwSentence) && isUsableSentence(word.mwSentence, word)) {
    return { sentence: word.mwSentence, answerChoices: [] };
  }
  return null;
}

/** Generated distractors need generated answer choices; the other modes do not. */
export function hasUsableSentence(word: Word, mode: FillInBlankMode): boolean {
  if (mode === 'multipleChoice') {
    return word.sentenceSets.some(s => s.answerChoices.length > 0 && isUsableSentence(s.sentence, word));
  }
  return sentenceSetFor(word) !== null;
}

/**
 * The form of the word the sentence blanks out, and its class. Options must all
 * be rendered in that class, or the odd one out gives the answer away.
 */
function blankedForm(word: Word, sentence: string): { surface: string | null; cls: InflectionClass } {
  const surface = findStemInSentence(sentence, word);
  return { surface, cls: surface ? classifyInflection(baseForm(word), surface) : 'lemma' };
}

/**
 * How the target itself is written on the answer list.
 *
 * When the list is rendered in the blanked class, the surface form taken from
 * the sentence wins: it is attested there, and a word whose recorded stems lack
 * that inflection would otherwise fall back to its lemma and stand out as the
 * only odd form. When the list has fallen back to lemmas, so must the target.
 */
function renderTarget(word: Word, blanked: { surface: string | null; cls: InflectionClass }, renderAs: InflectionClass): string {
  if (renderAs === blanked.cls && blanked.surface) return blanked.surface;
  return render(word, renderAs);
}

function render(word: Word, cls: InflectionClass): string {
  return stemForClass(word, cls) ?? baseForm(word);
}

export function buildQuizOptions(word: Word, set: SentenceSet, rng: Rng = Math.random): QuizOption[] {
  const byCloseness = (c: number) => set.answerChoices.filter(a => a.closeness === c);

  const distractors: AnswerChoice[] = [
    ...sample(byCloseness(3), 2, rng),
    ...sample(byCloseness(2), 1, rng),
    ...sample(byCloseness(1), 1, rng),
  ];

  // A set whose closeness tiers are unevenly filled would otherwise leave the
  // question a choice short, so make it up from whatever is left, closest first.
  if (distractors.length < DISTRACTOR_COUNT) {
    const spare = set.answerChoices
      .filter(a => !distractors.includes(a))
      .sort((a, b) => b.closeness - a.closeness);
    distractors.push(...sample(spare, DISTRACTOR_COUNT - distractors.length, rng));
  }

  const blanked = blankedForm(word, set.sentence);

  const options: QuizOption[] = [
    { text: renderTarget(word, blanked, blanked.cls), isCorrect: true, reasoning: '', closeness: 3 },
    ...distractors.map(d => ({
      text: d.distractor,
      isCorrect: false,
      reasoning: d.reasoning,
      closeness: d.closeness,
    })),
  ];

  return shuffle(options, rng);
}

/**
 * Builds a question whose distractors are other words from the GRE list rather
 * than the generated answer choices.
 *
 * Candidates are narrowed before they are ranked, so an option list can never
 * end up half-inflected or mixing parts of speech: first same part of speech
 * and able to take the blanked inflection, then same part of speech as lemmas,
 * and finally — for a part of speech with too few words — the whole list.
 */
export function buildGreWordQuizOptions(
  word: Word,
  sentence: string,
  allWords: Word[],
  rng: Rng = Math.random
): QuizOption[] {
  const blanked = blankedForm(word, sentence);
  const cls = blanked.cls;
  const samePos = allWords.filter(w => w.pos === word.pos);

  const tiers: { candidates: Word[]; renderAs: InflectionClass }[] = [
    { candidates: samePos.filter(w => stemForClass(w, cls) !== null), renderAs: cls },
    { candidates: samePos, renderAs: 'lemma' },
    { candidates: allWords, renderAs: 'lemma' },
  ];

  let distractors: Word[] = [];
  let renderAs: InflectionClass = 'lemma';
  for (const tier of tiers) {
    const picked = pickGreDistractors(word, tier.candidates, DISTRACTOR_COUNT, rng);
    if (picked.length > distractors.length) {
      distractors = picked;
      renderAs = tier.renderAs;
    }
    if (distractors.length === DISTRACTOR_COUNT) break;
  }

  const ranked = [...distractors].sort((a, b) => scoreSimilarity(word, b) - scoreSimilarity(word, a));

  const options: QuizOption[] = [
    { text: renderTarget(word, blanked, renderAs), isCorrect: true, reasoning: '', closeness: 3 },
    ...ranked.map((d, i) => ({
      text: render(d, renderAs),
      isCorrect: false,
      reasoning: d.definition,
      closeness: CLOSENESS_BY_RANK[i] ?? 1,
    })),
  ];

  return shuffle(options, rng);
}
