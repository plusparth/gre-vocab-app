import type { QuizOption } from '../types';

interface QuizResultsProps {
  word: string;
  definition: string;
  correct: boolean;
  options?: QuizOption[];
  onNext: () => void;
}

export function QuizResults({ word, definition, correct, options, onNext }: QuizResultsProps) {
  return (
    <div style={{ marginTop: 16, padding: 16, borderRadius: 8,
                  border: `2px solid ${correct ? '#34c759' : '#ff3b30'}`,
                  background: correct ? '#f0fff4' : '#fff0f0' }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
        {correct ? '✓ Correct' : '✗ Incorrect'} — <em>{word}</em>
      </div>
      <div style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>{definition}</div>
      {options && options.filter(o => !o.isCorrect).map(o => (
        <div key={o.text} style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
          <strong>{o.text}</strong>: {o.reasoning}
        </div>
      ))}
      <button onClick={onNext}
        style={{ marginTop: 12, padding: '6px 20px', background: '#0071e3', color: 'white',
                 border: 'none', borderRadius: 6, cursor: 'pointer' }}>
        Next →
      </button>
    </div>
  );
}
