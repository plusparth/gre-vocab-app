import { useMemo, useEffect, useRef } from 'react';
import { useFilteredWords } from '../hooks/useFilteredWords';
import { useWordSelectionStore } from '../store/wordSelectionStore';
import { useProgressStore } from '../store/progressStore';
import type { Word, MasteryFilter, SortOrder } from '../types';

interface WordBankProps {
  allWords: Word[];
  onStart: () => void;
}

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

  // Drag-to-select state (refs so no re-render overhead)
  const dragging = useRef(false);
  const dragAction = useRef<'select' | 'deselect'>('select');

  useEffect(() => {
    const onUp = () => { dragging.current = false; };
    window.addEventListener('pointerup', onUp);
    return () => window.removeEventListener('pointerup', onUp);
  }, []);

  function handlePointerDown(word: string, currentlySelected: boolean) {
    dragging.current = true;
    dragAction.current = currentlySelected ? 'deselect' : 'select';
    toggleWord(word);
  }

  function handlePointerEnter(word: string) {
    if (!dragging.current) return;
    const isSelected = selectedWords.has(word);
    if (dragAction.current === 'select' && !isSelected) toggleWord(word);
    if (dragAction.current === 'deselect' && isSelected) toggleWord(word);
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
    <div style={{ padding: 16, maxWidth: 800 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
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

      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
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

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, fontSize: 13 }}>
        <span>{filtered.length} words shown · {selectedWords.size} selected</span>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, touchAction: 'none' }}>
        {filtered.map(word => {
          const status = getStatus(word.word);
          const selected = selectedWords.has(word.word);
          return (
            <label
              key={word.word}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px',
                       border: `1px solid ${selected ? '#0071e3' : '#ddd'}`,
                       background: selected ? '#e8f4fd' : 'white',
                       borderRadius: 6, cursor: 'pointer', userSelect: 'none' }}
              onPointerDown={() => handlePointerDown(word.word, selected)}
              onPointerEnter={() => handlePointerEnter(word.word)}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => {}}
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
    </div>
  );
}
