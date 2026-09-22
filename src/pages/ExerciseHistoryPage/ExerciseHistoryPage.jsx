import { useState, useMemo } from 'react';
import SectionHeading from '../../components/atoms/SectionHeading/SectionHeading';
import ExerciseSelector from '../../components/molecules/ExerciseSelector/ExerciseSelector';
import ProgressChart from '../../components/molecules/ProgressChart/ProgressChart';
import MetricToggle from '../../components/molecules/MetricToggle/MetricToggle';
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
        const maxWeight = Math.max(...sets.map(s => Number(s.weight)));
        const totalVolume = sets.reduce((sum, s) => sum + Number(s.weight) * Number(s.reps), 0);
        const maxE1RM = Math.max(...sets.map(s => calcE1RM(Number(s.weight), Number(s.reps))));
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

  return (
    <div className={styles.page}>
      <div className={styles.selectorSection}>
        <ExerciseSelector
          exercises={exercises}
          selectedExerciseId={selectedExerciseId}
          onSelectExercise={e => setSelectedExerciseId(e.target.value)}
        />
      </div>

      {!hasData ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
              <path d="M3 3v18h18" />
              <path d="M7 16l4-5 4 3 5-7" />
            </svg>
          </div>
          <p className={styles.emptyTitle}>No history for {selectedExercise?.name || 'this exercise'}</p>
          <p className={styles.emptyHint}>Start logging sets to track your progression.</p>
        </div>
      ) : (
        <>
          {/* Exercise Header */}
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

          {/* Metric Toggle + Chart */}
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
          </div>

          {/* Estimated 1RM Card */}
          <div className={styles.e1rmCard}>
            <div className={styles.e1rmLabel}>Estimated 1RM</div>
            <div className={styles.e1rmValue}>{bestE1RM} <span className={styles.e1rmUnit}>lbs</span></div>
            <div className={styles.e1rmSub}>Epley formula · Based on best logged set</div>
          </div>

          {/* Personal Records */}
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

          {/* Previous Performances */}
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
