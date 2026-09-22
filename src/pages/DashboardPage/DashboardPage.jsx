import { useNavigate } from 'react-router-dom';
import SectionHeading from '../../components/atoms/SectionHeading/SectionHeading';
import Button from '../../components/atoms/Button/Button';
import styles from './DashboardPage.module.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DashboardPage({ exercises, workoutHistory }) {
  const navigate = useNavigate();

  // Compute best lifts per exercise
  const bestLifts = exercises.map(ex => {
    let maxWeight = 0;
    workoutHistory.forEach(w => {
      w.sets.forEach(s => {
        if (s.exerciseId === ex.id && Number(s.weight) > maxWeight) {
          maxWeight = Number(s.weight);
        }
      });
    });
    return { ...ex, maxWeight };
  });

  const recentWorkouts = [...workoutHistory]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  if (workoutHistory.length === 0) {
    return (
      <div className={styles.page}>
        <SectionHeading as="h1">Dashboard</SectionHeading>
        <div className={styles.empty}>
          <p>No workouts yet.</p>
          <Button variant="primary" onClick={() => navigate('/log')} className={styles.emptyButton}>
            Log Workout
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <SectionHeading as="h1">Dashboard</SectionHeading>
        <Button variant="primary" onClick={() => navigate('/log')}>
          Log Workout
        </Button>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <SectionHeading as="h3" className={styles.sectionTitle}>Best Lifts</SectionHeading>
          <div className={styles.progressGrid}>
            {bestLifts.map(lift => (
              <div key={lift.id} className={styles.progressCard}>
                <span className={styles.progressExercise}>{lift.name}</span>
                <span className={styles.progressWeight}>
                  {lift.maxWeight > 0 ? lift.maxWeight : '—'}
                  {lift.maxWeight > 0 && <span className={styles.progressUnit}> lbs</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <SectionHeading as="h3" className={styles.sectionTitle}>Recent Workouts</SectionHeading>
          <div className={styles.recentList}>
            {recentWorkouts.map(w => (
              <div key={w.id} className={styles.workoutCard}>
                <div>
                  <div className={styles.workoutDate}>{formatDate(w.date)}</div>
                  <div className={styles.workoutSets}>{w.sets.length} set{w.sets.length !== 1 ? 's' : ''}</div>
                </div>
                <span className={styles.workoutFocus}>{w.sessionFocus}</span>
              </div>
            ))}
          </div>
          <div className={styles.viewAll}>
            <Button variant="secondary" onClick={() => navigate('/workout-history')} fullWidth>
              View Workout History
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
