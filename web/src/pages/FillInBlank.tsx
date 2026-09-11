import { useMemo, useState } from 'react';
import { useProgressStore } from '../store/progressStore';
import { useSessionStore } from '../store/sessionStore';
import { useSessionWords } from '../hooks/useSessionWords';
import { buildQuizOptions, buildGreWordQuizOptions, sentenceSetFor, hasUsableSentence } from '../utils/quiz';
import { blankOut } from '../utils/blank';
import { isCorrectAnswer } from '../utils/text';
import { QuizResults } from '../components/QuizResults';
import type { Word, QuizOption, SentenceSet, FillInBlankMode } from '../types';

const LABELS = ['(A)', '(B)', '(C)', '(D)', '(E)'];

const ANSWER_MODES: { value: FillInBlankMode; label: string }[] = [
  { value: 'multipleChoice', label: 'Generated choices' },
  { value: 'greWords', label: 'GRE words' },
  { value: 'typed', label: 'Type answer' },
];

interface Question {
  key: string;
  set: SentenceSet;
  options: QuizOption[];
}

function buildQuestion(word: Word, mode: FillInBlankMode, allWords: Word[], key: string): Question {
  const set = sentenceSetFor(word)!;
  if (mode === 'multipleChoice') return { key, set, options: buildQuizOptions(word, set) };
  if (mode === 'greWords') return { key, set, options: buildGreWordQuizOptions(word, set.sentence, allWords) };
  return { key, set, options: [] };
}

export function FillInBlank({ allWords }: { allWords: Word[] }) {
  const { fillInBlankMode, setFillInBlankMode } = useSessionStore();
  const { recordAnswer } = useProgressStore();
  const { words, reshuffle } = useSessionWords(allWords);

  // Generated-distractor questions need generated answer choices; the other
  // modes can fall back to the dictionary sentence.
  const sessionWords = useMemo(
    () => words.filter(w => hasUsableSentence(w, fillInBlankMode)),
    [words, fillInBlankMode]
  );

  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [correct, setCorrect] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);

  // Switching answer mode changes which words are usable, so start over.
  const [modeInProgress, setModeInProgress] = useState(fillInBlankMode);
  if (modeInProgress !== fillInBlankMode) {
    setModeInProgress(fillInBlankMode);
    setIndex(0);
    setSubmitted(false);
    setSelectedOption(null);
    setTypedAnswer('');
    setQuestion(null);
  }

  const word = sessionWords[index];
  const key = word ? `${word.word}|${fillInBlankMode}` : '';
  const current = word && question?.key === key
    ? question
    : word
      ? buildQuestion(word, fillInBlankMode, allWords, key)
      : null;
  if (current && current !== question) setQuestion(current);

  function restart() {
    setIndex(0);
    setSubmitted(false);
    setSelectedOption(null);
    setTypedAnswer('');
    setQuestion(null);
    reshuffle();
  }

  function handleSubmit() {
    const isCorrect = fillInBlankMode === 'typed'
      ? isCorrectAnswer(typedAnswer, word.word, word.stems)
      : current!.options.find(o => o.text === selectedOption)?.isCorrect === true;
    setCorrect(isCorrect);
    setSubmitted(true);
    recordAnswer(word.word, isCorrect ? 4 : 1);
  }

  function handleNext() {
    setSubmitted(false);
    setSelectedOption(null);
    setTypedAnswer('');
    setQuestion(null);
    setIndex(i => i + 1);
  }

  const modeSwitch = (
    <div role="radiogroup" aria-label="Answer mode" style={{ display: 'flex', gap: 4 }}>
      {ANSWER_MODES.map(m => {
        const active = fillInBlankMode === m.value;
        return (
          <button
            key={m.value}
            role="radio"
            aria-checked={active}
            aria-label={m.label}
            onClick={() => setFillInBlankMode(m.value)}
            style={{
              padding: '4px 10px', fontSize: 12, borderRadius: 6, cursor: 'pointer',
              border: `1px solid ${active ? '#0071e3' : '#ddd'}`,
              background: active ? '#e8f4fd' : 'white',
              fontWeight: active ? 600 : 400,
            }}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );

  if (words.length === 0) {
    return <div style={{ padding: 32, color: '#888' }}>No words selected — go to Word Bank to pick words.</div>;
  }

  if (sessionWords.length === 0) {
    return (
      <div style={{ padding: 32, color: '#888' }}>
        <p style={{ margin: 0 }}>
          None of the selected words has a sentence to fill in — try another answer mode or pick different words.
        </p>
        <div style={{ marginTop: 16 }}>{modeSwitch}</div>
      </div>
    );
  }

  if (!word || !current) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <h2>Session complete!</h2>
        <button onClick={restart}
          style={{ marginTop: 16, padding: '8px 20px', background: '#0071e3', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Restart
        </button>
      </div>
    );
  }

  const blanked = blankOut(current.set.sentence, word).text;

  return (
    <div data-testid="fill-blank-workspace" className="study-workspace" style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, fontSize: 13 }}>
        <span style={{ color: '#666' }}>{index + 1} / {sessionWords.length}</span>
        {modeSwitch}
      </div>

      <div className="study-panel" style={{ background: 'white', border: '1px solid #ddd', borderRadius: 10, padding: 20,
                    fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
        {blanked}
      </div>

      {!submitted && fillInBlankMode !== 'typed' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {current.options.map((opt, i) => (
              <button
                key={opt.text}
                aria-label={`${LABELS[i]} ${opt.text}`}
                onClick={() => setSelectedOption(opt.text)}
                style={{
                  padding: '10px 14px', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
                  border: `2px solid ${selectedOption === opt.text ? '#0071e3' : '#ddd'}`,
                  background: selectedOption === opt.text ? '#e8f4fd' : 'white',
                  fontWeight: selectedOption === opt.text ? 600 : 400,
                }}
              >
                {LABELS[i]} {opt.text}
              </button>
            ))}
          </div>
          <button
            aria-label="Submit"
            disabled={!selectedOption}
            onClick={handleSubmit}
            style={{ padding: '8px 24px', background: '#0071e3', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', float: 'right' }}
          >
            Submit
          </button>
        </>
      )}

      {!submitted && fillInBlankMode === 'typed' && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={typedAnswer}
            onChange={e => setTypedAnswer(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && typedAnswer.trim()) handleSubmit(); }}
            placeholder="Type the missing word..."
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14 }}
          />
          <button
            aria-label="Submit"
            disabled={!typedAnswer.trim()}
            onClick={handleSubmit}
            style={{ padding: '8px 20px', background: '#0071e3', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            Submit
          </button>
        </div>
      )}

      {submitted && (
        <QuizResults
          word={word.word}
          definition={word.definition}
          correct={correct}
          options={fillInBlankMode !== 'typed' ? current.options : undefined}
          onNext={handleNext}
        />
      )}
    </div>
  );
}
