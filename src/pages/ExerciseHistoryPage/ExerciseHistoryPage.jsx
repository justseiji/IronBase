import { useState } from 'react';
import SectionHeading from '../../components/atoms/SectionHeading/SectionHeading';
import ExerciseSelector from '../../components/molecules/ExerciseSelector/ExerciseSelector';
import styles from './ExerciseHistoryPage.module.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ExerciseHistoryPage({ exercises, workoutHistory }) {
  const [selectedExerciseId, setSelectedExerciseId] = useState(exercises[0]?.id || '');

  const selectedExercise = exercises.find(e => e.id === selectedExerciseId);

  // Gather all sets for this exercise across all workouts, with date info
  const allSetsForExercise = [];
  workoutHistory.forEach(w => {
    w.sets.forEach(s => {
      if (s.exerciseId === selectedExerciseId) {
        allSetsForExercise.push({ ...s, date: w.date, workoutId: w.id });
      }
    });
  });

  // Sort by date descending
  allSetsForExercise.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Best set = heaviest weight
  const bestSet = allSetsForExercise.reduce((best, s) => {
    if (!best || Number(s.weight) > Number(best.weight)) return s;
    return best;
  }, null);

  // Most recent set = first in sorted array
  const mostRecentSet = allSetsForExercise[0] || null;

  // Group by date
  const grouped = {};
  allSetsForExercise.forEach(s => {
    if (!grouped[s.date]) grouped[s.date] = [];
    grouped[s.date].push(s);
  });
  const dateKeys = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <SectionHeading as="h1">Exercise History</SectionHeading>
      </div>

      <div className={styles.selector}>
        <ExerciseSelector
          exercises={exercises}
          selectedExerciseId={selectedExerciseId}
          onSelectExercise={e => setSelectedExerciseId(e.target.value)}
        />
      </div>

      {allSetsForExercise.length === 0 ? (
        <p className={styles.empty}>No history for {selectedExercise?.name || 'this exercise'}.</p>
      ) : (
        <>
          <div className={styles.comparison}>
            {bestSet && (
              <div className={styles.compCard}>
                <div className={styles.compLabel}>Best</div>
                <div className={styles.compWeight}>{bestSet.weight} lbs</div>
                <div className={styles.compDetails}>
                  {bestSet.reps} reps{bestSet.rpe ? ` @ RPE ${bestSet.rpe}` : ''} — {formatDate(bestSet.date)}
                </div>
              </div>
            )}
            {mostRecentSet && (
              <div className={styles.compCard}>
                <div className={styles.compLabel}>Most Recent</div>
                <div className={styles.compWeight}>{mostRecentSet.weight} lbs</div>
                <div className={styles.compDetails}>
                  {mostRecentSet.reps} reps{mostRecentSet.rpe ? ` @ RPE ${mostRecentSet.rpe}` : ''} — {formatDate(mostRecentSet.date)}
                </div>
              </div>
            )}
          </div>

          <div className={styles.historySection}>
            <SectionHeading as="h3">Previous Performances</SectionHeading>
            {dateKeys.map(date => (
              <div key={date} className={styles.dateGroup}>
                <div className={styles.dateLabel}>{formatDate(date)}</div>
                {grouped[date].map((s, i) => (
                  <div key={i} className={styles.setRow}>
                    {s.weight} lbs × {s.reps} reps{s.rpe ? ` @ RPE ${s.rpe}` : ''}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
