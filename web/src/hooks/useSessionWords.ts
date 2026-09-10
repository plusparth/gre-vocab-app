import { useCallback, useState } from 'react';
import { useWordSelectionStore } from '../store/wordSelectionStore';
import { useFilteredWords } from './useFilteredWords';
import { mulberry32, shuffle } from '../utils/shuffle';
import type { Word } from '../types';

export interface SessionWords {
  /** The selected words in a shuffled order, fixed for the session. */
  words: Word[];
  /** Draws a fresh order — call it when the user restarts a session. */
  reshuffle: () => void;
}

interface Session {
  /** The selection this list was built from; its identity changes only on edit. */
  selection: Set<string>;
  seed: number;
  words: Word[];
}

function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 32);
}

/**
 * The word list a study session runs on: the current selection, shuffled once.
 *
 * The order is deliberately snapshotted rather than derived live. Filtering
 * depends on progress, so it recomputes on every answer — left live, that would
 * reorder the remaining cards and, with a mastery filter on, drop words out from
 * under the user as they got them right. The snapshot is rebuilt only when the
 * selection itself changes or the session is restarted.
 */
export function useSessionWords(allWords: Word[]): SessionWords {
  const selectedWords = useWordSelectionStore(s => s.selectedWords);
  const filtered = useFilteredWords(allWords);

  const [seed, setSeed] = useState(randomSeed);
  const [session, setSession] = useState<Session | null>(null);

  const current: Session =
    session && session.selection === selectedWords && session.seed === seed
      ? session
      : {
          selection: selectedWords,
          seed,
          words: shuffle(filtered.filter(w => selectedWords.has(w.word)), mulberry32(seed)),
        };

  if (current !== session) setSession(current);

  const reshuffle = useCallback(() => setSeed(randomSeed()), []);

  return { words: current.words, reshuffle };
}
