import type { Word, SentenceSet, QuizOption, AnswerChoice, FillInBlankMode } from '../types';
import { sample, shuffle, type Rng } from './shuffle';
import { pickGreDistractors, scoreSimilarity } from './similarity';
import { baseForm, classifyInflection, findStemInSentence, stemForClass, type InflectionClass } from './inflection';

const DISTRACTOR_COUNT = 4;

/** Relative closeness assigned to drawn distractors, most similar first. */
const CLOSENESS_BY_RANK: (1 | 2 | 3)[] = [3, 3, 2, 1];

export function pickSentenceSet(word: Word): SentenceSet {
  return word.sentenceSets[Math.floor(Math.random() * word.sentenceSets.length)];
}

/**
 * The sentence a question is built on. Roughly half the list has no generated
 * sentence sets; those words are still usable with GRE-word or typed answers as
 * long as the dictionary sentence actually contains the word to blank out.
 */
export function sentenceSetFor(word: Word): SentenceSet | null {
  if (word.sentenceSets.length > 0) return pickSentenceSet(word);
  if (word.mwSentence && findStemInSentence(word.mwSentence, word)) {
    return { sentence: word.mwSentence, answerChoices: [] };
  }
  return null;
}

/** Generated distractors need generated answer choices; the other modes do not. */
export function hasUsableSentence(word: Word, mode: FillInBlankMode): boolean {
  if (mode === 'multipleChoice') return word.sentenceSets.length > 0;
  return sentenceSetFor(word) !== null;
}

/**
 * The sentence blanks out one particular form of the word. Options must all be
 * rendered in that form, or the odd one out gives the answer away.
 */
function blankedInflection(word: Word, sentence: string): InflectionClass {
  const form = findStemInSentence(sentence, word);
  return form ? classifyInflection(baseForm(word), form) : 'lemma';
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

  const options: QuizOption[] = [
    { text: render(word, blankedInflection(word, set.sentence)), isCorrect: true, reasoning: '', closeness: 3 },
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
  const cls = blankedInflection(word, sentence);
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
    { text: render(word, renderAs), isCorrect: true, reasoning: '', closeness: 3 },
    ...ranked.map((d, i) => ({
      text: render(d, renderAs),
      isCorrect: false,
      reasoning: d.definition,
      closeness: CLOSENESS_BY_RANK[i] ?? 1,
    })),
  ];

  return shuffle(options, rng);
}
