import { useState, useMemo } from 'react';
import { useProgressStore } from '../store/progressStore';
import { useSessionWords } from '../hooks/useSessionWords';
import { shuffle } from '../utils/shuffle';
import type { Word } from '../types';

const ROUND_SIZE = 6;

export function Match({ allWords }: { allWords: Word[] }) {
  const { recordAnswer } = useProgressStore();
  const { words: sessionWords, reshuffle } = useSessionWords(allWords);

  const [roundIndex, setRoundIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);

  const rounds = useMemo(() => {
    const r: Word[][] = [];
    for (let i = 0; i < sessionWords.length; i += ROUND_SIZE) {
      r.push(sessionWords.slice(i, i + ROUND_SIZE));
    }
    return r;
  }, [sessionWords]);

  // The definition column is shuffled independently of the word column, once
  // per round, so the two lists never line up.
  const [defs, setDefs] = useState<{ rounds: Word[][]; roundIndex: number; words: Word[] } | null>(null);
  const currentDefs = defs && defs.rounds === rounds && defs.roundIndex === roundIndex
    ? defs
    : { rounds, roundIndex, words: rounds[roundIndex] ? shuffle(rounds[roundIndex]) : [] };
  if (currentDefs !== defs) setDefs(currentDefs);
  const shuffledDefs = currentDefs.words;

  if (sessionWords.length < 2) {
    return <div style={{ padding: 32, color: '#888' }}>Not enough words selected — select at least 2 words in the Word Bank.</div>;
  }

  if (roundIndex >= rounds.length) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <h2>All rounds complete!</h2>
        <button onClick={() => { setRoundIndex(0); setMatched(new Set()); reshuffle(); }}
          style={{ marginTop: 16, padding: '8px 20px', background: '#0071e3', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Restart
        </button>
      </div>
    );
  }

  const round = rounds[roundIndex];

  function handleWordClick(word: string) {
    if (matched.has(word)) return;
    setSelectedWord(word === selectedWord ? null : word);
    setWrong(null);
  }

  function handleDefClick(word: string) {
    if (matched.has(word) || !selectedWord) return;
    if (word === selectedWord) {
      const next = new Set(matched);
      next.add(word);
      recordAnswer(word, 4);
      setMatched(next);
      setSelectedWord(null);
      if (next.size === round.length) {
        setTimeout(() => {
          setRoundIndex(r => r + 1);
          setMatched(new Set());
          setSelectedWord(null);
        }, 600);
      }
    } else {
      recordAnswer(selectedWord, 1);
      setWrong(selectedWord);
      setTimeout(() => { setWrong(null); setSelectedWord(null); }, 600);
    }
  }

  return (
    <div data-testid="match-workspace" className="study-workspace" style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 13, color: '#666' }}>
        <span>Round {roundIndex + 1} of {rounds.length}</span>
        <span>{matched.size} / {round.length} matched</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {round.map(w => {
            const isMatched = matched.has(w.word);
            const isSelected = selectedWord === w.word;
            const isWrong = wrong === w.word;
            return (
              <button
                key={w.word}
                data-matched={isMatched || undefined}
                onClick={() => handleWordClick(w.word)}
                disabled={isMatched}
                style={{
                  padding: '10px 14px', borderRadius: 8, cursor: isMatched ? 'default' : 'pointer',
                  border: `2px solid ${isWrong ? '#ff3b30' : isSelected ? '#0071e3' : isMatched ? '#34c759' : '#ddd'}`,
                  background: isWrong ? '#fff0f0' : isSelected ? '#e8f4fd' : isMatched ? '#f0fff4' : 'white',
                  fontWeight: 600, textAlign: 'left',
                  textDecoration: isMatched ? 'line-through' : 'none',
                  color: isMatched ? '#34c759' : 'inherit',
                }}
              >
                <span>{w.word}</span>{isMatched ? ' ✓' : isWrong ? ' ✗' : ''}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shuffledDefs.map(w => {
            const isMatched = matched.has(w.word);
            return (
              <button
                key={w.word}
                onClick={() => handleDefClick(w.word)}
                disabled={isMatched || !selectedWord}
                style={{
                  padding: '10px 14px', borderRadius: 8,
                  cursor: isMatched || !selectedWord ? 'default' : 'pointer',
                  border: `2px solid ${isMatched ? '#34c759' : '#ddd'}`,
                  background: isMatched ? '#f0fff4' : 'white',
                  fontSize: 12, textAlign: 'left',
                  textDecoration: isMatched ? 'line-through' : 'none',
                  color: isMatched ? '#34c759' : 'inherit',
                }}
              >
                {w.definition} {isMatched ? '✓' : ''}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
