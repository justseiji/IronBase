import { useEffect, useRef } from 'react';
import styles from './ExerciseChips.module.css';

export default function ExerciseChips({ exercises, selectedId, onSelect, label = 'Exercise' }) {
  const listRef = useRef(null);

  // Keep the selected chip visible by scrolling the row only (never the page).
  useEffect(() => {
    const list = listRef.current;
    const scroller = list?.parentElement;
    const el = list?.querySelector('[aria-checked="true"]');
    if (!scroller || !el || scroller.scrollWidth <= scroller.clientWidth) return;
    const left = el.offsetLeft - 24;
    const right = el.offsetLeft + el.offsetWidth + 24 - scroller.clientWidth;
    if (scroller.scrollLeft > left) scroller.scrollTo({ left, behavior: 'smooth' });
    else if (scroller.scrollLeft < right) scroller.scrollTo({ left: right, behavior: 'smooth' });
  }, [selectedId]);

  function handleKeyDown(e, index) {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = exercises[(index + delta + exercises.length) % exercises.length];
    onSelect(next.id);
    listRef.current?.querySelector(`[data-id="${next.id}"]`)?.focus();
  }

  return (
    <div className={styles.scroller}>
      <div ref={listRef} className={styles.list} role="radiogroup" aria-label={label}>
        {exercises.map((ex, i) => {
          const active = ex.id === selectedId;
          return (
            <button
              key={ex.id}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              data-id={ex.id}
              className={`${styles.chip} ${active ? styles.active : ''}`}
              onClick={() => onSelect(ex.id)}
              onKeyDown={e => handleKeyDown(e, i)}
            >
              {ex.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
