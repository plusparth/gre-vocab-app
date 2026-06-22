import { useState } from 'react';
import { useWordSelectionStore } from '../store/wordSelectionStore';
import { useProgressStore } from '../store/progressStore';
import { useSessionStore } from '../store/sessionStore';
import { useFilteredWords } from '../hooks/useFilteredWords';
import type { Word, SM2Quality } from '../types';

const RATINGS: { label: string; quality: SM2Quality; color: string }[] = [
  { label: 'Missed', quality: 0, color: '#ff3b30' },
  { label: 'Hard',   quality: 2, color: '#888' },
  { label: 'Good',   quality: 4, color: '#ff9f0a' },
  { label: 'Easy',   quality: 5, color: '#34c759' },
];

export function Flashcards({ allWords }: { allWords: Word[] }) {
  const { flashcardDirection } = useSessionStore();
  const { selectedWords } = useWordSelectionStore();
  const { recordAnswer } = useProgressStore();
  const filtered = useFilteredWords(allWords);
  const sessionWords = filtered.filter(w => selectedWords.has(w.word));

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);

  if (selectedWords.size === 0) {
    return <div style={{ padding: 32, color: '#888' }}>No words selected — go to Word Bank to pick words.</div>;
  }

  if (done || index >= sessionWords.length) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <h2>Session complete!</h2>
        <p>{sessionWords.length} cards reviewed.</p>
        <button onClick={() => { setIndex(0); setRevealed(false); setDone(false); }}
          style={{ marginTop: 16, padding: '8px 20px', background: '#0071e3', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Restart
        </button>
      </div>
    );
  }

  const word = sessionWords[index];
  const showWord = flashcardDirection === 'wordFirst';

  function handleRate(quality: SM2Quality) {
    recordAnswer(word.word, quality);
    setRevealed(false);
    if (index + 1 >= sessionWords.length) setDone(true);
    else setIndex(i => i + 1);
  }

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 13, color: '#666' }}>
        <span>{index + 1} / {sessionWords.length}</span>
        <label>
          <input type="checkbox" checked={flashcardDirection === 'definitionFirst'}
            onChange={e => useSessionStore.getState().setFlashcardDirection(e.target.checked ? 'definitionFirst' : 'wordFirst')} />
          {' '}Definition first
        </label>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 12, minHeight: 220, padding: 32,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    textAlign: 'center', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
        {!revealed ? (
          <>
            {showWord ? (
              <>
                <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{word.pos}</div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>{word.word}</div>
                {word.prefix && <div style={{ fontSize: 12, color: '#bbb', marginTop: 4 }}>{word.prefix}-</div>}
              </>
            ) : (
              <div style={{ fontSize: 15, lineHeight: 1.6 }}>{word.definition}</div>
            )}
            <button
              aria-label="Flip card"
              onClick={() => setRevealed(true)}
              style={{ marginTop: 24, padding: '6px 20px', border: '1px dashed #bbb', borderRadius: 20,
                       background: 'transparent', cursor: 'pointer', color: '#666', fontSize: 12 }}
            >
              tap to reveal →
            </button>
          </>
        ) : (
          <>
            {showWord ? (
              <>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>Definition</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{word.definition}</div>
                {word.mwSentence && (
                  <div style={{ fontSize: 13, color: '#555', fontStyle: 'italic', marginBottom: 8 }}>
                    "{word.mwSentence}"
                  </div>
                )}
                {word.etymology && (
                  <div style={{ fontSize: 11, color: '#aaa' }}>{word.etymology}</div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 24, fontWeight: 700 }}>{word.word}</div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
              {RATINGS.map(r => (
                <button key={r.quality} aria-label={r.label}
                  onClick={() => handleRate(r.quality)}
                  style={{ padding: '8px 16px', border: 'none', borderRadius: 6, background: r.color,
                           color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  {r.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
