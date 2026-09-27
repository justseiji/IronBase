import { useEffect, useMemo, useRef, useState } from 'react';
import SectionHeading from '../../atoms/SectionHeading/SectionHeading';
import AnimatedNumber from '../../atoms/AnimatedNumber/AnimatedNumber';
import LoggedSetRow from '../../molecules/LoggedSetRow/LoggedSetRow';
import { prefersReducedMotion } from '../../../hooks/useReducedMotion';
import styles from './LoggedSetsList.module.css';

const EXIT_MS = 260;

export default function LoggedSetsList({ sets, summary, onEditSet, onDeleteSet, editingId, flash }) {
  const [exiting, setExiting] = useState(() => new Set());
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function remove(id) {
    if (prefersReducedMotion()) {
      onDeleteSet(id);
      return;
    }
    setExiting(prev => new Set(prev).add(id));
    timers.current.push(setTimeout(() => {
      onDeleteSet(id);
      setExiting(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, EXIT_MS));
  }

  // Number sets within each exercise ("Squat · Set 2")
  const numbered = useMemo(() => {
    const counts = {};
    return sets.map(s => {
      counts[s.exerciseId] = (counts[s.exerciseId] || 0) + 1;
      return { set: s, number: counts[s.exerciseId] };
    });
  }, [sets]);

  return (
    <section className={`${styles.section} motion-slide-up`} style={{ '--i': 3 }} aria-labelledby="logged-sets-heading">
      <div className={styles.header}>
        <SectionHeading as="h2" className={styles.heading}>
          <span id="logged-sets-heading">Logged Sets</span>
        </SectionHeading>
        {sets.length > 0 && (
          <dl className={styles.summary}>
            <div><dt>Sets</dt><dd><AnimatedNumber value={summary.sets} duration={350} /></dd></div>
            <div><dt>Exercises</dt><dd><AnimatedNumber value={summary.exercises} duration={350} /></dd></div>
            <div><dt>Volume</dt><dd><AnimatedNumber value={summary.volume} duration={500} /><span className={styles.unit}> lbs</span></dd></div>
          </dl>
        )}
      </div>

      {sets.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No sets yet</p>
          <p className={styles.emptyHint}>Pick an exercise, enter weight and reps, then tap Add Set.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {numbered.map(({ set, number }) => (
            <LoggedSetRow
              key={set.id}
              set={set}
              number={number}
              onEdit={() => onEditSet(set.id)}
              onDelete={() => remove(set.id)}
              isEditing={editingId === set.id}
              isExiting={exiting.has(set.id)}
              flashKey={flash.id === set.id ? flash.n : 0}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
