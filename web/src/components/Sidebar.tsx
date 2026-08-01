import type { StudyMode } from '../types';

interface SidebarProps {
  activeMode: StudyMode;
  onSetMode: (mode: StudyMode) => void;
  selectedCount: number;
}

const NAV_ITEMS: { mode: StudyMode; icon: string; label: string }[] = [
  { mode: 'wordbank',    icon: '📚', label: 'Word Bank' },
  { mode: 'flashcards',  icon: '🃏', label: 'Flashcards' },
  { mode: 'match',       icon: '🔗', label: 'Match' },
  { mode: 'fillInBlank', icon: '✏️', label: 'Fill in Blank' },
  { mode: 'progress',    icon: '📈', label: 'Progress' },
];

const QUIZ_MODES: StudyMode[] = ['flashcards', 'match', 'fillInBlank'];

export function Sidebar({ activeMode, onSetMode, selectedCount }: SidebarProps) {
  const isQuizMode = QUIZ_MODES.includes(activeMode);

  return (
    <nav
      aria-label="Mode navigation"
      className={`app-sidebar ${isQuizMode ? 'app-sidebar--rail' : 'app-sidebar--expanded'}`}
    >
      <div className="sidebar-brand">GRE Vocab</div>
      {NAV_ITEMS.map(({ mode, icon, label }) => (
        <button
          key={mode}
          aria-label={label}
          onClick={() => onSetMode(mode)}
          className={`sidebar-nav-button ${mode === activeMode ? 'sidebar-nav-button--active' : ''}`}
        >
          <span>{icon}</span>
          <span className="sidebar-nav-label">{label}</span>
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <div className="sidebar-selection-count">
        {selectedCount} word{selectedCount !== 1 ? 's' : ''} selected
      </div>
    </nav>
  );
}
