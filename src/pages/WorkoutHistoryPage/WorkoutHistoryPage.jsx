import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionHeading from '../../components/atoms/SectionHeading/SectionHeading';
import Button from '../../components/atoms/Button/Button';
import { cleanNumber } from '../../utils/numbers';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';
import styles from './WorkoutHistoryPage.module.css';

const EXIT_MS = 280;

function monthKey(dateStr) {
  return dateStr.slice(0, 7);
}

function monthLabel(key) {
  const d = new Date(`${key}-01T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function summarize(workout, exercises) {
  const byExercise = new Map();
  let volume = 0;
  workout.sets.forEach(s => {
    const w = cleanNumber(s.weight);
    volume += w * Number(s.reps);
    if (!byExercise.has(s.exerciseId)) {
      byExercise.set(s.exerciseId, {
        name: exercises.find(e => e.id === s.exerciseId)?.name || s.exerciseName || 'Unknown',
        sets: [],
      });
    }
    byExercise.get(s.exerciseId).sets.push(s);
  });
  return { groups: [...byExercise.values()], volume: cleanNumber(volume) };
}

export default function WorkoutHistoryPage({ exercises, workoutHistory, onDeleteWorkout }) {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [exitingId, setExitingId] = useState(null);

  const months = useMemo(() => {
    const sorted = [...workoutHistory].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const groups = [];
    sorted.forEach(w => {
      const key = monthKey(w.date);
      let group = groups[groups.length - 1];
      if (!group || group.key !== key) {
        group = { key, label: monthLabel(key), workouts: [] };
        groups.push(group);
      }
      group.workouts.push({ ...w, ...summarize(w, exercises) });
    });
    return groups;
  }, [workoutHistory, exercises]);

  function toggleExpand(id) {
    setExpandedId(prev => (prev === id ? null : id));
    setConfirmId(null);
  }

  function handleDelete(workoutId) {
    setConfirmId(null);
    if (prefersReducedMotion()) {
      onDeleteWorkout(workoutId);
      return;
    }
    setExitingId(workoutId);
    setTimeout(() => {
      onDeleteWorkout(workoutId);
      setExitingId(null);
      setExpandedId(prev => (prev === workoutId ? null : prev));
    }, EXIT_MS);
  }

  if (workoutHistory.length === 0) {
    return (
      <div className={styles.page}>
        <div className={`${styles.titleGroup} motion-slide-up`}>
          <SectionHeading as="h1">Workout History</SectionHeading>
        </div>
        <div className={`${styles.empty} motion-slide-up`} style={{ '--i': 1 }}>
          <p className={styles.emptyTitle}>No workouts saved yet</p>
          <p className={styles.emptyHint}>Every workout you save will be listed here, grouped by month.</p>
          <Button variant="primary" onClick={() => navigate('/log')}>Log Workout</Button>
        </div>
      </div>
    );
  }

  let rowIndex = 0;

  return (
    <div className={styles.page}>
      <div className={`${styles.titleGroup} motion-slide-up`}>
        <SectionHeading as="h1">Workout History</SectionHeading>
        <p className={styles.subtitle}>
          {workoutHistory.length} workout{workoutHistory.length !== 1 ? 's' : ''} logged
        </p>
      </div>

      {months.map(month => (
        <section key={month.key} className={styles.month} aria-labelledby={`month-${month.key}`}>
          <h2 id={`month-${month.key}`} className={`${styles.monthLabel} motion-fade-in`} style={{ '--i': Math.min(rowIndex, 12) }}>
            {month.label}
            <span className={styles.monthCount}>{month.workouts.length}</span>
          </h2>
          <ul className={styles.list}>
            {month.workouts.map(workout => {
              const isOpen = expandedId === workout.id;
              const isConfirming = confirmId === workout.id;
              const d = new Date(`${workout.date}T00:00:00`);
              const panelId = `workout-${workout.id}`;
              const i = Math.min(rowIndex++, 12);
              return (
                <li
                  key={workout.id}
                  className={`${styles.item} ${isOpen ? styles.open : ''} ${exitingId === workout.id ? styles.exiting : ''} motion-slide-up`}
                  style={{ '--i': i + 1 }}
                >
                  <div className={styles.itemInner}>
                    <button
                      type="button"
                      className={styles.rowButton}
                      onClick={() => toggleExpand(workout.id)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                    >
                      <span className={styles.dateBlock} aria-hidden="true">
                        <span className={styles.day}>{d.getDate()}</span>
                        <span className={styles.weekday}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      </span>
                      <span className={styles.rowContent}>
                        <span className="visually-hidden">{d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}: </span>
                        <span className={styles.focus}>{workout.sessionFocus}</span>
                        <span className={styles.exerciseNames}>{workout.groups.map(g => g.name).join(' · ')}</span>
                        <span className={styles.meta}>
                          {workout.sets.length} set{workout.sets.length !== 1 ? 's' : ''}
                          {workout.volume > 0 ? ` · ${workout.volume.toLocaleString('en-US')} lbs volume` : ''}
                        </span>
                      </span>
                      <svg className={styles.chevron} width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 8l5 5 5-5" />
                      </svg>
                    </button>

                    <div id={panelId} className={styles.details} inert={!isOpen}>
                      <div className={styles.detailsInner}>
                        <div className={styles.groups}>
                          {workout.groups.map(group => (
                            <div key={group.name} className={styles.group}>
                              <span className={styles.groupName}>{group.name}</span>
                              <span className={styles.groupSets}>
                                {group.sets.map((s, j) => (
                                  <span key={s.id || j} className={styles.setChip}>
                                    {cleanNumber(s.weight)}<span className={styles.times}>×</span>{cleanNumber(s.reps)}
                                    {s.rpe ? <span className={styles.rpe}>@{cleanNumber(s.rpe)}</span> : null}
                                  </span>
                                ))}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className={styles.footer}>
                          {isConfirming ? (
                            <div className={styles.confirm} role="group" aria-label="Confirm delete">
                              <span className={styles.confirmText}>Delete this workout? This can’t be undone.</span>
                              <div className={styles.confirmActions}>
                                <Button variant="ghost" onClick={() => setConfirmId(null)}>Cancel</Button>
                                <Button variant="danger" onClick={() => handleDelete(workout.id)}>Delete</Button>
                              </div>
                            </div>
                          ) : (
                            <Button variant="ghost" className={styles.deleteButton} onClick={() => setConfirmId(workout.id)}>
                              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4M13 4v9.33a1.33 1.33 0 01-1.33 1.34H4.33A1.33 1.33 0 013 13.33V4" />
                              </svg>
                              Delete workout
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
