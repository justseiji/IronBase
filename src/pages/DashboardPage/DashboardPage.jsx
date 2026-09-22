import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import Button from '../../components/atoms/Button/Button';
import ProgressChart from '../../components/molecules/ProgressChart/ProgressChart';
import MetricToggle from '../../components/molecules/MetricToggle/MetricToggle';
import TrainingHeatmap from '../../components/molecules/TrainingHeatmap/TrainingHeatmap';
import styles from './DashboardPage.module.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0,0,0,0);
  const diff = Math.floor((today - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function calcE1RM(weight, reps) {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

const METRIC_OPTIONS = [
  { value: 'weight', label: 'Weight' },
  { value: 'volume', label: 'Volume' },
  { value: 'e1rm', label: 'Est. 1RM' },
];

export default function DashboardPage({ exercises, workoutHistory }) {
  const navigate = useNavigate();
  const [chartExerciseId, setChartExerciseId] = useState(exercises[0]?.id || '');
  const [activeMetric, setActiveMetric] = useState('weight');

  const hasData = workoutHistory.length > 0;

  // Strength overview with progress %
  const strengthData = useMemo(() => {
    return exercises.map(ex => {
      const sessions = {};
      workoutHistory.forEach(w => {
        w.sets.forEach(s => {
          if (s.exerciseId === ex.id) {
            if (!sessions[w.date]) sessions[w.date] = 0;
            sessions[w.date] = Math.max(sessions[w.date], Number(s.weight));
          }
        });
      });
      const dates = Object.keys(sessions).sort();
      const maxWeight = Math.max(0, ...Object.values(sessions));
      const firstWeight = dates.length > 0 ? sessions[dates[0]] : 0;
      const lastWeight = dates.length > 0 ? sessions[dates[dates.length - 1]] : 0;
      let progressPct = null;
      if (dates.length >= 2 && firstWeight > 0) {
        progressPct = ((lastWeight - firstWeight) / firstWeight * 100).toFixed(1);
      }
      return { ...ex, maxWeight, progressPct, sessionCount: dates.length };
    }).filter(ex => ex.maxWeight > 0);
  }, [exercises, workoutHistory]);

  // Chart data for selected exercise
  const chartSessionData = useMemo(() => {
    const grouped = {};
    workoutHistory.forEach(w => {
      w.sets.forEach(s => {
        if (s.exerciseId === chartExerciseId) {
          if (!grouped[w.date]) grouped[w.date] = [];
          grouped[w.date].push(s);
        }
      });
    });
    return Object.entries(grouped)
      .map(([date, sets]) => {
        const maxWeight = Math.max(...sets.map(s => Number(s.weight)));
        const totalVolume = sets.reduce((sum, s) => sum + Number(s.weight) * Number(s.reps), 0);
        const maxE1RM = Math.max(...sets.map(s => calcE1RM(Number(s.weight), Number(s.reps))));
        return { date, maxWeight, totalVolume, maxE1RM };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [workoutHistory, chartExerciseId]);

  const chartData = useMemo(() => {
    return chartSessionData.map(s => ({
      date: s.date,
      value: activeMetric === 'weight' ? s.maxWeight : activeMetric === 'volume' ? s.totalVolume : s.maxE1RM,
    }));
  }, [chartSessionData, activeMetric]);

  const chartUnit = activeMetric === 'volume' ? 'lbs\u00b7reps' : 'lbs';
  const chartExercise = exercises.find(e => e.id === chartExerciseId);

  // Training insight
  const insight = useMemo(() => {
    if (chartSessionData.length === 0) return 'Your journey starts here. Keep logging to build your progression.';
    if (chartSessionData.length === 1) return `You've logged your first ${chartExercise?.name || 'exercise'} session. Keep going.`;
    const first = chartSessionData[0].maxWeight;
    const last = chartSessionData[chartSessionData.length - 1].maxWeight;
    const diff = last - first;
    if (last >= Math.max(...chartSessionData.map(s => s.maxWeight))) {
      return `Your latest ${chartExercise?.name || 'exercise'} session is your strongest.`;
    }
    if (diff > 0) {
      return `Your ${chartExercise?.name || 'exercise'} is up ${diff} lbs since your first session.`;
    }
    return `You've logged ${chartSessionData.length} ${chartExercise?.name || 'exercise'} sessions.`;
  }, [chartSessionData, chartExercise]);

  // Training consistency
  const consistency = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const dayOfWeek = (now.getDay() + 6) % 7; // Mon=0
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0,0,0,0);

    let thisMonth = 0;
    let thisWeek = 0;
    workoutHistory.forEach(w => {
      const d = new Date(w.date + 'T00:00:00');
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) thisMonth++;
      if (d >= weekStart) thisWeek++;
    });
    return { thisMonth, thisWeek };
  }, [workoutHistory]);

  // Personal records
  const mostRecentWorkoutId = useMemo(() => {
    if (workoutHistory.length === 0) return null;
    return [...workoutHistory].sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.id;
  }, [workoutHistory]);

  const personalRecords = useMemo(() => {
    const prMap = {};
    workoutHistory.forEach(w => {
      w.sets.forEach(s => {
        const wt = Number(s.weight);
        if (!prMap[s.exerciseId] || wt > prMap[s.exerciseId].weight) {
          prMap[s.exerciseId] = { exerciseId: s.exerciseId, weight: wt, reps: Number(s.reps), workoutId: w.id };
        }
      });
    });
    return Object.values(prMap)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map(pr => ({
        ...pr,
        name: exercises.find(e => e.id === pr.exerciseId)?.name || 'Unknown',
        isNew: pr.workoutId === mostRecentWorkoutId,
      }));
  }, [workoutHistory, exercises, mostRecentWorkoutId]);

  // Recent workouts
  const recentWorkouts = useMemo(() => {
    return [...workoutHistory]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map(w => {
        const exerciseNames = [...new Set(w.sets.map(s => exercises.find(e => e.id === s.exerciseId)?.name).filter(Boolean))];
        let heaviest = 0;
        w.sets.forEach(s => { if (Number(s.weight) > heaviest) heaviest = Number(s.weight); });
        return { ...w, exerciseNames, heaviest };
      });
  }, [workoutHistory, exercises]);

  return (
    <div className={styles.page}>
      <div className={styles.greeting}>
        <h1 className={styles.greetingText}>{getGreeting()}</h1>
        <Button variant="primary" onClick={() => navigate('/log')}>Log Workout</Button>
      </div>

      {/* Strength Overview */}
      {strengthData.length > 0 && (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Strength</span>
          <div className={styles.strengthList}>
            {strengthData.map(ex => (
              <div key={ex.id} className={styles.strengthRow}>
                <div className={styles.strengthLeft}>
                  <span className={styles.strengthName}>{ex.name}</span>
                  {ex.progressPct !== null ? (
                    <span className={Number(ex.progressPct) >= 0 ? styles.progressUp : styles.progressDown}>
                      {Number(ex.progressPct) >= 0 ? '\u2191' : '\u2193'} {Math.abs(Number(ex.progressPct))}%
                    </span>
                  ) : ex.sessionCount === 1 ? (
                    <span className={styles.progressFirst}>First session</span>
                  ) : null}
                </div>
                <span className={styles.strengthValue}>
                  {ex.maxWeight}<span className={styles.strengthUnit}> lbs</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Graph — ALWAYS VISIBLE */}
      <div className={styles.section}>
        <div className={styles.chartHeader}>
          <span className={styles.sectionLabel}>Progress</span>
          <div className={styles.chartControls}>
            <select
              className={styles.chartSelect}
              value={chartExerciseId}
              onChange={e => setChartExerciseId(e.target.value)}
            >
              {exercises.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
            <MetricToggle options={METRIC_OPTIONS} activeValue={activeMetric} onChange={setActiveMetric} />
          </div>
        </div>
        <ProgressChart key={`${chartExerciseId}-${activeMetric}`} data={chartData} metricLabel={METRIC_OPTIONS.find(o => o.value === activeMetric)?.label} unit={chartUnit} />
        <p className={styles.insight}>{insight}</p>
      </div>

      {/* Training Consistency */}
      {hasData && (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>This Month</span>
          <div className={styles.consistencyRow}>
            <div className={styles.consistencyStat}>
              <span className={styles.consistencyValue}>{consistency.thisMonth}</span>
              <span className={styles.consistencyLabel}>workout{consistency.thisMonth !== 1 ? 's' : ''}</span>
            </div>
            <div className={styles.consistencyStat}>
              <span className={styles.consistencyValue}>{consistency.thisWeek}</span>
              <span className={styles.consistencyLabel}>this week</span>
            </div>
          </div>
        </div>
      )}

      {/* Training Heatmap */}
      {hasData && (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Training Activity</span>
          <TrainingHeatmap workoutHistory={workoutHistory} />
        </div>
      )}

      {/* Personal Records */}
      {personalRecords.length > 0 && (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Personal Records</span>
          <div className={styles.prList}>
            {personalRecords.map(pr => (
              <div key={pr.exerciseId} className={styles.prRow}>
                <div className={styles.prLeft}>
                  <span className={styles.prName}>{pr.name}</span>
                  {pr.isNew && <span className={styles.prNew}>NEW</span>}
                </div>
                <span className={styles.prValue}>{pr.weight} lbs \u00d7 {pr.reps}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Workouts */}
      {recentWorkouts.length > 0 && (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Recent Workouts</span>
          <div className={styles.workoutTimeline}>
            {recentWorkouts.map(w => (
              <div key={w.id} className={styles.workoutEntry} onClick={() => navigate('/workout-history')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') navigate('/workout-history'); }}>
                <div className={styles.workoutDateCol}>
                  <span className={styles.workoutDate}>{formatDate(w.date)}</span>
                </div>
                <div className={styles.workoutContent}>
                  <span className={styles.workoutFocus}>{w.sessionFocus}</span>
                  <span className={styles.workoutExercises}>{w.exerciseNames.join(' \u00b7 ')}</span>
                  <span className={styles.workoutStats}>{w.sets.length} set{w.sets.length !== 1 ? 's' : ''}{w.heaviest > 0 ? ` \u00b7 ${w.heaviest} lbs` : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.viewAll}>
        <Button variant="secondary" onClick={() => navigate('/workout-history')} fullWidth>View All Workouts</Button>
      </div>
    </div>
  );
}
