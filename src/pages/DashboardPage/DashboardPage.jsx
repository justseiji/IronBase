import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import SectionHeading from '../../components/atoms/SectionHeading/SectionHeading';
import Button from '../../components/atoms/Button/Button';
import styles from './DashboardPage.module.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage({ exercises, workoutHistory }) {
  const navigate = useNavigate();

  // Strength overview: best weight per exercise
  const strengthData = useMemo(() => {
    return exercises.map(ex => {
      let maxWeight = 0;
      let maxReps = 0;
      workoutHistory.forEach(w => {
        w.sets.forEach(s => {
          if (s.exerciseId === ex.id && Number(s.weight) > maxWeight) {
            maxWeight = Number(s.weight);
            maxReps = Number(s.reps);
          }
        });
      });
      return { ...ex, maxWeight, maxReps };
    }).filter(ex => ex.maxWeight > 0);
  }, [exercises, workoutHistory]);

  // Personal records: top exercises by weight, check if PR is from most recent workout
  const mostRecentWorkoutId = useMemo(() => {
    if (workoutHistory.length === 0) return null;
    const sorted = [...workoutHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted[0]?.id;
  }, [workoutHistory]);

  const personalRecords = useMemo(() => {
    const prMap = {};
    workoutHistory.forEach(w => {
      w.sets.forEach(s => {
        const key = s.exerciseId;
        const weight = Number(s.weight);
        if (!prMap[key] || weight > prMap[key].weight) {
          prMap[key] = { 
            exerciseId: key, 
            weight, 
            reps: Number(s.reps),
            workoutId: w.id 
          };
        }
      });
    });
    return Object.values(prMap)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map(pr => ({
        ...pr,
        exerciseName: exercises.find(e => e.id === pr.exerciseId)?.name || 'Unknown',
        isNew: pr.workoutId === mostRecentWorkoutId,
      }));
  }, [workoutHistory, exercises, mostRecentWorkoutId]);

  // Recent workouts (last 5)
  const recentWorkouts = useMemo(() => {
    return [...workoutHistory]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map(w => {
        // Find heaviest lift in this workout
        let heaviest = { weight: 0, name: '' };
        w.sets.forEach(s => {
          if (Number(s.weight) > heaviest.weight) {
            heaviest = {
              weight: Number(s.weight),
              name: exercises.find(e => e.id === s.exerciseId)?.name || '',
            };
          }
        });
        return { ...w, heaviest };
      });
  }, [workoutHistory, exercises]);

  const hasData = workoutHistory.length > 0;

  return (
    <div className={styles.page}>
      {/* Greeting */}
      <div className={styles.greeting}>
        <h1 className={styles.greetingText}>{getGreeting()}</h1>
        {hasData && (
          <Button variant="primary" onClick={() => navigate('/log')}>
            Log Workout
          </Button>
        )}
      </div>

      {!hasData ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No workouts yet.</p>
          <p className={styles.emptyHint}>Log your first workout to start tracking your progress.</p>
          <div className={styles.emptyAction}>
            <Button variant="primary" onClick={() => navigate('/log')}>
              Log Workout
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Strength Overview */}
          {strengthData.length > 0 && (
            <div className={styles.section}>
              <span className={styles.sectionLabel}>Strength Overview</span>
              <div className={styles.strengthList}>
                {strengthData.map(ex => (
                  <div key={ex.id} className={styles.strengthRow}>
                    <span className={styles.strengthName}>{ex.name}</span>
                    <span className={styles.strengthValue}>
                      {ex.maxWeight}
                      <span className={styles.strengthUnit}> lbs</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personal Records */}
          {personalRecords.length > 0 && (
            <div className={styles.section}>
              <span className={styles.sectionLabel}>Personal Records</span>
              <div className={styles.prList}>
                {personalRecords.map((pr, i) => (
                  <div key={pr.exerciseId} className={styles.prCard}>
                    <div className={styles.prHeader}>
                      <span className={styles.prName}>{pr.exerciseName}</span>
                      {pr.isNew && <span className={styles.prNew}>NEW</span>}
                    </div>
                    <span className={styles.prValue}>
                      {pr.weight} lbs × {pr.reps}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Workouts */}
          <div className={styles.section}>
            <span className={styles.sectionLabel}>Recent Workouts</span>
            <div className={styles.workoutList}>
              {recentWorkouts.map(w => (
                <div
                  key={w.id}
                  className={styles.workoutCard}
                  onClick={() => navigate('/workout-history')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter') navigate('/workout-history'); }}
                >
                  <div className={styles.workoutLeft}>
                    <span className={styles.workoutDate}>{formatDate(w.date)}</span>
                    <span className={styles.workoutMeta}>
                      {w.sessionFocus} · {w.sets.length} set{w.sets.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {w.heaviest.weight > 0 && (
                    <div className={styles.workoutRight}>
                      <span className={styles.workoutHeavy}>{w.heaviest.weight}</span>
                      <span className={styles.workoutHeavyLabel}>lbs · {w.heaviest.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* View All */}
          <div className={styles.viewAll}>
            <Button variant="secondary" onClick={() => navigate('/workout-history')} fullWidth>
              View All Workouts
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
