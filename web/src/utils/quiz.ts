import type { Word, SentenceSet, QuizOption, AnswerChoice } from '../types';

function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export function pickSentenceSet(word: Word): SentenceSet {
  return word.sentenceSets[Math.floor(Math.random() * word.sentenceSets.length)];
}

export function buildQuizOptions(word: Word, set: SentenceSet): QuizOption[] {
  const byCloseness = (c: number) => set.answerChoices.filter(a => a.closeness === c);

  const distractors: AnswerChoice[] = [
    ...sample(byCloseness(3), 2),
    ...sample(byCloseness(2), 1),
    ...sample(byCloseness(1), 1),
  ];

  const options: QuizOption[] = [
    { text: word.word, isCorrect: true, reasoning: '', closeness: 3 },
    ...distractors.map(d => ({
      text: d.distractor,
      isCorrect: false,
      reasoning: d.reasoning,
      closeness: d.closeness,
    })),
  ];

  return sample(options, options.length);
}
