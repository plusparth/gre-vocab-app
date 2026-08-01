import { Routes, Route, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { WordBank } from './pages/WordBank';
import { Flashcards } from './pages/Flashcards';
import { Match } from './pages/Match';
import { FillInBlank } from './pages/FillInBlank';
import { Progress } from './pages/Progress';
import { useSessionStore } from './store/sessionStore';
import { useWordSelectionStore } from './store/wordSelectionStore';
import type { StudyMode, Word } from './types';
import words from './data/words.json';

const allWords = words as Word[];

const MODE_ROUTES: Record<StudyMode, string> = {
  wordbank: '/',
  flashcards: '/flashcards',
  match: '/match',
  fillInBlank: '/fill-in-blank',
  progress: '/progress',
};

export default function App() {
  const navigate = useNavigate();
  const { activeMode, setActiveMode } = useSessionStore();
  const { selectedWords } = useWordSelectionStore();

  function handleSetMode(mode: StudyMode) {
    setActiveMode(mode);
    navigate(MODE_ROUTES[mode]);
  }

  return (
    <div className="app-shell">
      <Sidebar
        activeMode={activeMode}
        onSetMode={handleSetMode}
        selectedCount={selectedWords.size}
      />
      <main className="app-main">
        <Routes>
          <Route path="/"              element={<WordBank allWords={allWords} onStart={() => handleSetMode('flashcards')} />} />
          <Route path="/flashcards"    element={<Flashcards allWords={allWords} />} />
          <Route path="/match"         element={<Match allWords={allWords} />} />
          <Route path="/fill-in-blank" element={<FillInBlank allWords={allWords} />} />
          <Route path="/progress"      element={<Progress allWords={allWords} />} />
        </Routes>
      </main>
    </div>
  );
}
