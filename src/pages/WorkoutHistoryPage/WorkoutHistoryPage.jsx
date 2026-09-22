import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionHeading from '../../components/atoms/SectionHeading/SectionHeading';
import Button from '../../components/atoms/Button/Button';
import IconButton from '../../components/atoms/IconButton/IconButton';
import { cleanNumber } from '../../utils/numbers';
import styles from './WorkoutHistoryPage.module.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function WorkoutHistoryPage({ exercises, workoutHistory, onDeleteWorkout }) {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState(null);

  const sorted = [...workoutHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

  function getExerciseName(exerciseId) {
    return exercises.find(e => e.id === exerciseId)?.name || 'Unknown';
  }

  function toggleExpand(id) {
    setExpandedId(prev => prev === id ? null : id);
  }

  function handleDelete(e, workoutId) {
    e.stopPropagation();
    if (window.confirm('Delete this workout? This cannot be undone.')) {
      onDeleteWorkout(workoutId);
      if (expandedId === workoutId) setExpandedId(null);
    }
  }

  if (workoutHistory.length === 0) {
    return (
      <div className={styles.page}>
        <SectionHeading as="h1">Workout History</SectionHeading>
        <div className={styles.empty}>
          <p>No workouts saved yet.</p>
          <div className={styles.emptyAction}>
            <Button variant="primary" onClick={() => navigate('/log')}>
              Log Workout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <SectionHeading as="h1">Workout History</SectionHeading>
      </div>

      <div className={styles.list}>
        {sorted.map(workout => {
          const isOpen = expandedId === workout.id;
          return (
            <div key={workout.id} className={styles.card}>
              <div
                className={styles.cardHeader}
                onClick={() => toggleExpand(workout.id)}
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(workout.id); } }}
              >
                <div className={styles.cardInfo}>
                  <span className={styles.cardDate}>{formatDate(workout.date)}</span>
                  <span className={styles.cardFocus}>{workout.sessionFocus} · {workout.sets.length} set{workout.sets.length !== 1 ? 's' : ''}</span>
                </div>
                <div className={styles.cardActions}>
                  <IconButton onClick={(e) => handleDelete(e, workout.id)} ariaLabel="Delete workout" title="Delete">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4M13 4v9.33a1.33 1.33 0 01-1.33 1.34H4.33A1.33 1.33 0 013 13.33V4" />
                    </svg>
                  </IconButton>
                  <span className={`${styles.expandIcon} ${isOpen ? styles.open : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 8l5 5 5-5" />
                    </svg>
                  </span>
                </div>
              </div>

              <div className={`${styles.details} ${isOpen ? styles.open : ''}`}>
                <div className={styles.detailsInner}>
                  {workout.sets.map((set, i) => (
                    <div key={i} className={styles.setRow}>
                      <span className={styles.setExercise}>{getExerciseName(set.exerciseId)}</span>
                      {' — '}
                      {cleanNumber(set.weight)} lbs × {cleanNumber(set.reps)} reps{set.rpe ? ` @ RPE ${cleanNumber(set.rpe)}` : ''}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
