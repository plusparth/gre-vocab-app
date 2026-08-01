import { useMemo, useRef, useState, type PointerEvent } from 'react';
import { useFilteredWords } from '../hooks/useFilteredWords';
import { useWordSelectionStore } from '../store/wordSelectionStore';
import { useProgressStore } from '../store/progressStore';
import type { Word, MasteryFilter, SortOrder } from '../types';

interface WordBankProps {
  allWords: Word[];
  onStart: () => void;
}

const MARQUEE_THRESHOLD_PX = 20;

export function WordBank({ allWords, onStart }: WordBankProps) {
  const {
    search, setSearch, prefixFilter, setPrefixFilter,
    masteryFilter, setMasteryFilter, sortOrder, setSortOrder,
    topN, setTopN, selectedWords, toggleWord, selectWords, clearSelection,
  } = useWordSelectionStore();
  const { getStatus } = useProgressStore();
  const filtered = useFilteredWords(allWords);

  const allPrefixes = useMemo(
    () => [...new Set(allWords.map(w => w.prefix).filter(Boolean))].sort(),
    [allWords]
  );

  const listRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; word?: string; mode: 'add' | 'subtract' } | null>(null);
  const [marquee, setMarquee] = useState<{ x: number; y: number; width: number; height: number; mode: 'add' | 'subtract' } | null>(null);
  const [previewWords, setPreviewWords] = useState<Set<string>>(new Set());

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('input, button, select')) return;
    const row = (event.target as HTMLElement).closest<HTMLElement>('[data-word]');
    const word = row?.dataset.word;
    const mode = word && selectedWords.has(word) ? 'subtract' : 'add';
    dragStart.current = { x: event.clientX, y: event.clientY, word, mode };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setMarquee({ x: event.clientX, y: event.clientY, width: 0, height: 0, mode });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    const { x, y, mode } = dragStart.current;
    const width = Math.abs(event.clientX - x); const height = Math.abs(event.clientY - y);
    if (Math.hypot(width, height) < MARQUEE_THRESHOLD_PX) {
      setMarquee(null);
      setPreviewWords(new Set());
      return;
    }
    (event.target as HTMLElement).blur?.();
    setMarquee({ x: Math.min(x, event.clientX), y: Math.min(y, event.clientY), width, height, mode });
    if (listRef.current) {
      const left = Math.min(x, event.clientX); const right = Math.max(x, event.clientX);
      const top = Math.min(y, event.clientY); const bottom = Math.max(y, event.clientY);
      setPreviewWords(new Set([...listRef.current.querySelectorAll<HTMLElement>('[data-word]')]
        .filter(row => { const rect = row.getBoundingClientRect(); return rect.right >= left && rect.left <= right && rect.bottom >= top && rect.top <= bottom; })
        .map(row => row.dataset.word!).filter(Boolean)));
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!dragStart.current || !listRef.current) return;
    const start = dragStart.current;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < MARQUEE_THRESHOLD_PX) {
      if (start.word) toggleWord(start.word);
      dragStart.current = null;
      setMarquee(null);
      setPreviewWords(new Set());
      return;
    }
    const left = Math.min(start.x, event.clientX); const right = Math.max(start.x, event.clientX);
    const top = Math.min(start.y, event.clientY); const bottom = Math.max(start.y, event.clientY);
    const hit = [...listRef.current.querySelectorAll<HTMLElement>('[data-word]')].filter(row => {
      const rect = row.getBoundingClientRect();
      return rect.right >= left && rect.left <= right && rect.bottom >= top && rect.top <= bottom;
    }).map(row => row.dataset.word!).filter(Boolean);
    if (hit.length) {
      const next = new Set(selectedWords);
      hit.forEach(word => start.mode === 'add' ? next.add(word) : next.delete(word));
      selectWords([...next]);
    }
    dragStart.current = null;
    setMarquee(null);
    setPreviewWords(new Set());
  }

  function handleSelectAll() {
    selectWords(filtered.map(w => w.word));
  }

  const statusLabel: Record<string, string> = {
    new: 'New',
    due: '📅 Due',
    mastered: '✓ Mastered',
    struggling: '⚠ Struggling',
    learning: '🔄',
  };

  return (
    <div className="word-bank page">
      <header className="page-header"><h1>Vocabulary ledger</h1><p>Curate a focused set, then study it your way.</p></header>
      <div className="word-bank-filters" style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <input
          placeholder="Search words or definitions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '6px 10px', border: '1px solid #ccc', borderRadius: 6 }}
        />
        <select value={sortOrder} onChange={e => setSortOrder(e.target.value as SortOrder)}>
          <option value="az">A–Z</option>
          <option value="za">Z–A</option>
          <option value="random">Random</option>
        </select>
        <select value={masteryFilter} onChange={e => setMasteryFilter(e.target.value as MasteryFilter)}>
          <option value="all">All</option>
          <option value="new">New</option>
          <option value="due">Due for review</option>
          <option value="mastered">Mastered</option>
          <option value="struggling">Struggling</option>
        </select>
      </div>

      <div className="prefix-filters" style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#666' }}>Prefix:</span>
        <button
          onClick={() => setPrefixFilter('')}
          style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12,
                   border: '1px solid #ccc', background: prefixFilter === '' ? '#0071e3' : 'transparent',
                   color: prefixFilter === '' ? 'white' : 'inherit', cursor: 'pointer' }}
        >All</button>
        {allPrefixes.map(p => (
          <button
            key={p}
            onClick={() => setPrefixFilter(prefixFilter === p ? '' : p)}
            style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12,
                     border: '1px solid #ccc', background: prefixFilter === p ? '#0071e3' : 'transparent',
                     color: prefixFilter === p ? 'white' : 'inherit', cursor: 'pointer' }}
          >{p}</button>
        ))}
      </div>

      <div data-testid="selection-tray" className="selection-tray" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, fontSize: 13 }}>
        <span className="selection-summary">{filtered.length} words shown · {selectedWords.size} selected</span>
        <span className="drag-hint"><span aria-hidden="true">▧</span> Drag a box to select · start on selected rows to remove</span>
        <button onClick={handleSelectAll} style={{ fontSize: 12, padding: '2px 8px', cursor: 'pointer' }}>
          Select all {filtered.length}
        </button>
        {topN !== null && (
          <span>First <input
            type="number" min={1} max={filtered.length}
            value={topN}
            onChange={e => setTopN(Number(e.target.value))}
            style={{ width: 50 }}
          /> of {filtered.length}</span>
        )}
        <button onClick={() => setTopN(topN === null ? 20 : null)} style={{ fontSize: 12, padding: '2px 8px', cursor: 'pointer' }}>
          {topN === null ? 'Limit N' : 'Show all'}
        </button>
        <button onClick={clearSelection} style={{ fontSize: 12, padding: '2px 8px', cursor: 'pointer' }}>
          Clear
        </button>
        <button
          onClick={onStart}
          disabled={selectedWords.size === 0}
          style={{ marginLeft: 'auto', padding: '6px 16px', background: '#0071e3', color: 'white',
                   border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
        >
          ▶ Start Quiz
        </button>
      </div>

      <div ref={listRef} className={`word-list ${marquee ? 'word-list--dragging' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: 4, touchAction: 'none' }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        {filtered.map(word => {
          const status = getStatus(word.word);
          const selected = selectedWords.has(word.word);
          return (
            <label
              key={word.word}
              data-word={word.word}
              className={`word-row word-row--brush-select ${selected ? 'word-row--selected' : ''} ${previewWords.has(word.word) ? `word-row--preview-${marquee?.mode}` : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px',
                       border: `1px solid ${selected ? '#0071e3' : '#ddd'}`,
                       background: selected ? '#e8f4fd' : 'white',
                       borderRadius: 6, cursor: 'pointer', userSelect: 'none' }}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggleWord(word.word)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600, minWidth: 100 }}>{word.word}</span>
              <span style={{ fontSize: 11, color: '#666' }}>{word.pos}</span>
              <span style={{ fontSize: 11, color: '#888', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {word.definition}
              </span>
              <span style={{ fontSize: 11, color: '#999', whiteSpace: 'nowrap' }}>
                {statusLabel[status] ?? ''}
              </span>
            </label>
          );
        })}
      </div>
      {marquee && <div className={`selection-marquee selection-marquee--${marquee.mode}`} style={{ left: marquee.x, top: marquee.y, width: marquee.width, height: marquee.height }} aria-hidden="true" />}
    </div>
  );
}
