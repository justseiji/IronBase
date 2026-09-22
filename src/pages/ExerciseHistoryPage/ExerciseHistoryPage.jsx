import { useState, useMemo } from 'react';
import SectionHeading from '../../components/atoms/SectionHeading/SectionHeading';
import ExerciseSelector from '../../components/molecules/ExerciseSelector/ExerciseSelector';
import MetricToggle from '../../components/molecules/MetricToggle/MetricToggle';
import ProgressChart from '../../components/molecules/ProgressChart/ProgressChart';
import { cleanNumber } from '../../utils/numbers';
import styles from './ExerciseHistoryPage.module.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

export default function ExerciseHistoryPage({ exercises = [], workoutHistory = [] }) {
  const [selectedExerciseId, setSelectedExerciseId] = useState(exercises[0]?.id || '');
  const [activeMetric, setActiveMetric] = useState('weight');

  const selectedExercise = exercises.find(e => e.id === selectedExerciseId);

  // Gather all sets for this exercise with date info
  const allSets = useMemo(() => {
    const sets = [];
    workoutHistory.forEach(w => {
      w.sets.forEach(s => {
        if (s.exerciseId === selectedExerciseId) {
          sets.push({ ...s, date: w.date });
        }
      });
    });
    return sets;
  }, [workoutHistory, selectedExerciseId]);

  // Group by date and compute per-session metrics
  const sessionData = useMemo(() => {
    const grouped = {};
    allSets.forEach(s => {
      if (!grouped[s.date]) grouped[s.date] = [];
      grouped[s.date].push(s);
    });

    return Object.entries(grouped)
      .map(([date, sets]) => {
        const maxWeight = cleanNumber(Math.max(...sets.map(s => cleanNumber(s.weight))));
        const totalVolume = cleanNumber(sets.reduce((sum, s) => sum + cleanNumber(s.weight) * Number(s.reps), 0));
        const maxE1RM = cleanNumber(Math.max(...sets.map(s => calcE1RM(cleanNumber(s.weight), Number(s.reps)))));
        return { date, maxWeight, totalVolume, maxE1RM, sets };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [allSets]);

  // Chart data based on active metric
  const chartData = useMemo(() => {
    return sessionData.map(s => ({
      date: s.date,
      value: activeMetric === 'weight' ? s.maxWeight
           : activeMetric === 'volume' ? s.totalVolume
           : s.maxE1RM,
    }));
  }, [sessionData, activeMetric]);

  const chartUnit = activeMetric === 'volume' ? 'lbs·reps' : 'lbs';

  // Best set overall
  const bestSet = useMemo(() => {
    if (allSets.length === 0) return null;
    return allSets.reduce((best, s) => {
      if (!best || Number(s.weight) > Number(best.weight)) return s;
      return best;
    }, null);
  }, [allSets]);

  // Best e1RM
  const bestE1RM = useMemo(() => {
    if (allSets.length === 0) return 0;
    return Math.max(...allSets.map(s => calcE1RM(Number(s.weight), Number(s.reps))));
  }, [allSets]);

  // Progress percentage (first session vs last session max weight)
  const progressPct = useMemo(() => {
    if (sessionData.length < 2) return null;
    const first = sessionData[0].maxWeight;
    const last = sessionData[sessionData.length - 1].maxWeight;
    if (first === 0) return null;
    return ((last - first) / first * 100).toFixed(1);
  }, [sessionData]);

  const hasData = allSets.length > 0;

  const insight = useMemo(() => {
    if (sessionData.length === 0) return 'Start logging to build your progression history.';
    if (sessionData.length === 1) return `You've logged your first ${selectedExercise?.name || 'exercise'} session.`;
    const first = sessionData[0].maxWeight;
    const last = sessionData[sessionData.length - 1].maxWeight;
    const diff = cleanNumber(last - first);
    if (last >= Math.max(...sessionData.map(s => s.maxWeight))) {
      return `Your latest ${selectedExercise?.name} session is your strongest.`;
    }
    if (diff > 0) return `Your ${selectedExercise?.name} is up ${diff} lbs since your first session.`;
    return `You've logged ${sessionData.length} ${selectedExercise?.name} sessions.`;
  }, [sessionData, selectedExercise]);

  return (
    <div className={styles.page}>
      <div className={styles.selectorSection}>
        <ExerciseSelector
          exercises={exercises}
          selectedExerciseId={selectedExerciseId}
          onSelectExercise={e => setSelectedExerciseId(e.target.value)}
        />
      </div>

      {hasData && (
        <div className={styles.exerciseHeader}>
          <h1 className={styles.exerciseName}>{selectedExercise?.name}</h1>
          <div className={styles.exerciseStats}>
            <span className={styles.bestSetLabel}>
              {bestSet?.weight} lbs × {bestSet?.reps}
            </span>
            {bestE1RM > 0 && (
              <span className={styles.e1rmBadge}>
                Est. 1RM {bestE1RM} lbs
              </span>
            )}
            {progressPct !== null && (
              <span className={Number(progressPct) >= 0 ? styles.progressUp : styles.progressDown}>
                {Number(progressPct) >= 0 ? '↑' : '↓'} {Math.abs(Number(progressPct))}% since first session
              </span>
            )}
          </div>
        </div>
      )}

      <div className={styles.chartSection}>
        <div className={styles.chartHeader}>
          <span className={styles.chartLabel}>Progression</span>
          <MetricToggle
            options={METRIC_OPTIONS}
            activeValue={activeMetric}
            onChange={setActiveMetric}
          />
        </div>
        <ProgressChart
          key={activeMetric}
          data={chartData}
          metricLabel={METRIC_OPTIONS.find(o => o.value === activeMetric)?.label}
          unit={chartUnit}
        />
        <p className={styles.insight}>{insight}</p>
      </div>

      {sessionData.length >= 2 && (
        <div className={styles.progressComparison}>
          <div className={styles.compCard}>
            <span className={styles.compLabel}>Current</span>
            <span className={styles.compValue}>
              {sessionData[sessionData.length-1].maxWeight} lbs × {sessionData[sessionData.length-1].sets.find(s => Number(s.weight) === sessionData[sessionData.length-1].maxWeight)?.reps}
            </span>
          </div>
          <div className={styles.compCard}>
            <span className={styles.compLabel}>First Logged</span>
            <span className={styles.compValue}>
              {sessionData[0].maxWeight} lbs
            </span>
          </div>
          <div className={styles.compCard}>
            <span className={styles.compLabel}>Progress</span>
            <span className={styles.compValue}>
              +{cleanNumber(sessionData[sessionData.length-1].maxWeight - sessionData[0].maxWeight)} lbs
            </span>
          </div>
        </div>
      )}

      {sessionData.length === 1 && (
        <div className={styles.firstSession}>
          <span className={styles.compLabel}>First Session</span>
          <span className={styles.compValue}>{sessionData[0].maxWeight} lbs</span>
          <span className={styles.compHint}>Keep logging to see your progress.</span>
        </div>
      )}

      {hasData && (
        <>
          <div className={styles.e1rmCard}>
            <div className={styles.e1rmLabel}>Estimated 1RM</div>
            <div className={styles.e1rmValue}>{bestE1RM} <span className={styles.e1rmUnit}>lbs</span></div>
            <div className={styles.e1rmSub}>Epley formula · Based on best logged set</div>
          </div>

          <div className={styles.prSection}>
            <span className={styles.prTitle}>Personal Records</span>
            <div className={styles.prGrid}>
              <div className={styles.prCard}>
                <span className={styles.prLabel}>Heaviest</span>
                <span className={styles.prValue}>{bestSet?.weight} <span className={styles.prUnit}>lbs</span></span>
              </div>
              <div className={styles.prCard}>
                <span className={styles.prLabel}>Best e1RM</span>
                <span className={styles.prValue}>{bestE1RM} <span className={styles.prUnit}>lbs</span></span>
              </div>
              <div className={styles.prCard}>
                <span className={styles.prLabel}>Max Volume</span>
                <span className={styles.prValue}>
                  {sessionData.length > 0 ? Math.max(...sessionData.map(s => s.totalVolume)) : 0}
                  <span className={styles.prUnit}> lbs·reps</span>
                </span>
              </div>
            </div>
          </div>

          <div className={styles.historySection}>
            <span className={styles.historyTitle}>Session History</span>
            {[...sessionData].reverse().map(session => (
              <div key={session.date} className={styles.dateGroup}>
                <div className={styles.dateLabel}>{formatDate(session.date)}</div>
                {session.sets.map((s, i) => (
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
