import { useState, useMemo } from 'react';
import { useWordSelectionStore } from '../store/wordSelectionStore';
import { useProgressStore } from '../store/progressStore';
import { useSessionStore } from '../store/sessionStore';
import { useFilteredWords } from '../hooks/useFilteredWords';
import { buildQuizOptions, pickSentenceSet } from '../utils/quiz';
import { isCorrectAnswer } from '../utils/text';
import { QuizResults } from '../components/QuizResults';
import type { Word, QuizOption, SentenceSet } from '../types';

const LABELS = ['(A)', '(B)', '(C)', '(D)', '(E)'];

function blankSentence(sentence: string, word: string, stems: string[]): string {
  const allForms = [word, ...stems].join('|');
  return sentence.replace(new RegExp(`\\b(${allForms})\\b`, 'gi'), '______');
}

export function FillInBlank({ allWords }: { allWords: Word[] }) {
  const { fillInBlankMode, setFillInBlankMode } = useSessionStore();
  const { selectedWords } = useWordSelectionStore();
  const { recordAnswer } = useProgressStore();
  const filtered = useFilteredWords(allWords);
  const sessionWords = useMemo(
    () => filtered.filter(w => selectedWords.has(w.word)),
    [filtered, selectedWords]
  );

  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [correct, setCorrect] = useState(false);
  const [currentSet, setCurrentSet] = useState<SentenceSet | null>(null);
  const [currentOptions, setCurrentOptions] = useState<QuizOption[]>([]);

  if (sessionWords.length === 0) {
    return <div style={{ padding: 32, color: '#888' }}>No words selected — go to Word Bank to pick words.</div>;
  }

  if (index >= sessionWords.length) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <h2>Session complete!</h2>
        <button onClick={() => { setIndex(0); setSubmitted(false); setSelectedOption(null); setTypedAnswer(''); setCurrentSet(null); setCurrentOptions([]); }}
          style={{ marginTop: 16, padding: '8px 20px', background: '#0071e3', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Restart
        </button>
      </div>
    );
  }

  const word = sessionWords[index];

  const set = (() => {
    if (currentSet) return currentSet;
    const s = pickSentenceSet(word);
    setCurrentSet(s);
    return s;
  })();

  const options = (() => {
    if (currentOptions.length > 0) return currentOptions;
    if (fillInBlankMode === 'multipleChoice') {
      const o = buildQuizOptions(word, set);
      setCurrentOptions(o);
      return o;
    }
    return [];
  })();

  const blanked = blankSentence(set.sentence, word.word, word.stems);

  function handleSubmit() {
    let isCorrect = false;
    if (fillInBlankMode === 'multipleChoice') {
      isCorrect = selectedOption === word.word;
    } else {
      isCorrect = isCorrectAnswer(typedAnswer, word.word, word.stems);
    }
    setCorrect(isCorrect);
    setSubmitted(true);
    recordAnswer(word.word, isCorrect ? 4 : 1);
  }

  function handleNext() {
    setSubmitted(false);
    setSelectedOption(null);
    setTypedAnswer('');
    setCurrentSet(null);
    setCurrentOptions([]);
    setIndex(i => i + 1);
  }

  return (
    <div data-testid="fill-blank-workspace" className="study-workspace" style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, fontSize: 13 }}>
        <span style={{ color: '#666' }}>{index + 1} / {sessionWords.length}</span>
        <label>
          <input type="checkbox" checked={fillInBlankMode === 'typed'}
            onChange={e => setFillInBlankMode(e.target.checked ? 'typed' : 'multipleChoice')} />
          {' '}Type answer
        </label>
      </div>

      <div className="study-panel" style={{ background: 'white', border: '1px solid #ddd', borderRadius: 10, padding: 20,
                    fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
        {blanked}
      </div>

      {!submitted && fillInBlankMode === 'multipleChoice' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {options.map((opt, i) => (
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
          options={fillInBlankMode === 'multipleChoice' ? options : undefined}
          onNext={handleNext}
        />
      )}
    </div>
  );
}
