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

  if (isQuizMode) {
    return (
      <nav
        aria-label="Mode navigation"
        style={{ width: 44, display: 'flex', flexDirection: 'column', alignItems: 'center',
                 padding: '12px 0', gap: 12, borderRight: '1px solid #ccc', flexShrink: 0 }}
      >
        {NAV_ITEMS.map(({ mode, icon, label }) => (
          <button
            key={mode}
            aria-label={label}
            onClick={() => onSetMode(mode)}
            title={label}
            style={{
              background: mode === activeMode ? '#0071e3' : 'transparent',
              border: 'none', borderRadius: 6, padding: 4, cursor: 'pointer', fontSize: 18,
            }}
          >
            {icon}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Mode navigation"
      style={{ width: 180, display: 'flex', flexDirection: 'column',
               borderRight: '1px solid #ccc', flexShrink: 0 }}
    >
      <div style={{ padding: '12px 12px 8px', fontWeight: 700, fontSize: 15 }}>GRE Vocab</div>
      {NAV_ITEMS.map(({ mode, icon, label }) => (
        <button
          key={mode}
          aria-label={label}
          onClick={() => onSetMode(mode)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', border: 'none', cursor: 'pointer', textAlign: 'left',
            background: mode === activeMode ? '#0071e3' : 'transparent',
            color: mode === activeMode ? 'white' : 'inherit',
            borderRadius: mode === activeMode ? '0 6px 6px 0' : 0,
            marginRight: mode === activeMode ? 8 : 0,
          }}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ padding: '8px 12px', fontSize: 12, color: '#666' }}>
        {selectedCount} word{selectedCount !== 1 ? 's' : ''} selected
      </div>
    </nav>
  );
}
