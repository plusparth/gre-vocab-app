import { useMemo } from 'react';
import { useProgressStore } from '../store/progressStore';
import { getWordStatus, todayISO } from '../utils/sm2';
import type { Word, WordStatus } from '../types';

const STATUS_COLORS: Record<WordStatus, string> = {
  new:       '#888',
  learning:  '#ff9f0a',
  due:       '#0071e3',
  struggling:'#ff3b30',
  mastered:  '#34c759',
};

const STATUS_LABELS: Record<WordStatus, string> = {
  new:       'new',
  learning:  'learning',
  due:       'due for review',
  struggling:'struggling',
  mastered:  'mastered',
};

export function Progress({ allWords }: { allWords: Word[] }) {
  const { progress } = useProgressStore();

  const counts = useMemo(() => {
    const c: Record<WordStatus, number> = { new: 0, learning: 0, due: 0, struggling: 0, mastered: 0 };
    for (const w of allWords) {
      const status = getWordStatus(progress[w.word]);
      c[status] = (c[status] ?? 0) + 1;
    }
    return c;
  }, [allWords, progress]);

  const streak = useMemo(() => {
    const answeredDates = new Set(
      Object.values(progress).map(s => s.answeredDate).filter(Boolean)
    );
    const today = new Date(todayISO());
    let s = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      if (answeredDates.has(iso)) s++;
      else break;
    }
    return s;
  }, [progress]);

  const total = allWords.length;

  return (
    <div className="progress-page page" style={{ padding: 24, maxWidth: 600 }}>
      <header className="page-header"><h1>Study progress</h1><p>Your review cadence, at a glance.</p></header>

      {/* Stat cards — count and label in a single text node so getByText regex can match */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
        {(['new', 'due', 'learning', 'mastered', 'struggling'] as WordStatus[]).map(status => (
          <div key={status} style={{ background: 'white', border: '1px solid #eee', borderRadius: 10,
                                     padding: '16px 12px', textAlign: 'center',
                                     fontWeight: 700, fontSize: 18, color: STATUS_COLORS[status] }}>
            {`${counts[status] ?? 0} ${STATUS_LABELS[status]}`}
          </div>
        ))}
        <div style={{ background: 'white', border: '1px solid #eee', borderRadius: 10,
                       padding: '16px 12px', textAlign: 'center',
                       fontWeight: 700, fontSize: 18, color: '#0071e3' }}>
          {total} total
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid #eee', borderRadius: 10, padding: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Current streak</div>
        <div style={{ fontSize: 32, fontWeight: 700 }}>{streak} day{streak !== 1 ? 's' : ''} 🔥</div>
      </div>

      <div data-testid="progress-ledger" className="progress-ledger" style={{ background: 'white', border: '1px solid #eee', borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Word breakdown</div>
        {(['mastered', 'due', 'learning', 'struggling', 'new'] as WordStatus[]).map(status => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[status], flexShrink: 0 }} />
            <div style={{ fontSize: 13, textTransform: 'capitalize', width: 120 }}>
              {STATUS_LABELS[status]}
            </div>
            <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{ width: `${((counts[status] ?? 0) / total) * 100}%`, height: '100%', background: STATUS_COLORS[status] }} />
            </div>
            <div style={{ fontSize: 12, color: '#666', width: 30, textAlign: 'right' }}>{counts[status] ?? 0}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
