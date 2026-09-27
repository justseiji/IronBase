import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import Button from '../../components/atoms/Button/Button';
import AnimatedNumber from '../../components/atoms/AnimatedNumber/AnimatedNumber';
import Sparkline from '../../components/atoms/Sparkline/Sparkline';
import ProgressChart from '../../components/molecules/ProgressChart/ProgressChart';
import MetricToggle from '../../components/molecules/MetricToggle/MetricToggle';
import ExerciseChips from '../../components/molecules/ExerciseChips/ExerciseChips';
import TrainingHeatmap from '../../components/molecules/TrainingHeatmap/TrainingHeatmap';
import Toast from '../../components/molecules/Toast/Toast';
import { useAuth } from '../../auth/useAuth';
import { cleanNumber } from '../../utils/numbers';
import { formatRelativeDate, getGreeting } from '../../utils/dateFormatters';
import { getSetsForExercise, computeSessionMetrics, computeChartData, generateProgressInsight } from '../../services/analyticsService';
import { computePersonalRecords } from '../../services/prService';
import styles from './DashboardPage.module.css';

const METRIC_OPTIONS = [
  { value: 'weight', label: 'Weight' },
  { value: 'volume', label: 'Volume' },
  { value: 'e1rm', label: 'Est. 1RM' },
];

function lastTrainedPhrase(dateStr) {
  const rel = formatRelativeDate(dateStr);
  return rel === 'Today' || rel === 'Yesterday' ? rel.toLowerCase() : `on ${rel}`;
}

function sortByDateDesc(workouts) {
  return [...workouts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export default function DashboardPage({ exercises, workoutHistory }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [chartExerciseId, setChartExerciseId] = useState(() => {
    const latest = sortByDateDesc(workoutHistory)[0];
    return latest?.sets[0]?.exerciseId || exercises[0]?.id || '';
  });
  const [activeMetric, setActiveMetric] = useState('weight');
  const [savedToast] = useState(() => location.state?.savedWorkout ?? null);

  useEffect(() => {
    if (location.state?.savedWorkout) navigate('.', { replace: true, state: null });
  }, [location.state, navigate]);

  const hasData = workoutHistory.length > 0;
  const sortedWorkouts = useMemo(() => sortByDateDesc(workoutHistory), [workoutHistory]);

  // Strength overview with progress % and per-session trend
  const strengthData = useMemo(() => {
    return exercises.map(ex => {
      const sessions = {};
      workoutHistory.forEach(w => {
        w.sets.forEach(s => {
          if (s.exerciseId === ex.id) {
            if (!sessions[w.date]) sessions[w.date] = 0;
            sessions[w.date] = Math.max(sessions[w.date], cleanNumber(s.weight));
          }
        });
      });
      const dates = Object.keys(sessions).sort();
      const trend = dates.map(d => sessions[d]);
      const maxWeight = Math.max(0, ...trend);
      const firstWeight = trend[0] ?? 0;
      const lastWeight = trend[trend.length - 1] ?? 0;
      let progressPct = null;
      if (dates.length >= 2 && firstWeight > 0) {
        progressPct = cleanNumber(((lastWeight - firstWeight) / firstWeight) * 100);
      }
      return { ...ex, maxWeight, progressPct, sessionCount: dates.length, trend: trend.slice(-10) };
    }).filter(ex => ex.maxWeight > 0);
  }, [exercises, workoutHistory]);

  // Chart data for selected exercise
  const chartSessionData = useMemo(() => {
    const sets = getSetsForExercise(workoutHistory, chartExerciseId);
    return computeSessionMetrics(sets);
  }, [workoutHistory, chartExerciseId]);

  const chartData = useMemo(() => computeChartData(chartSessionData, activeMetric), [chartSessionData, activeMetric]);

  const chartUnit = activeMetric === 'volume' ? 'lbs·reps' : 'lbs';
  const chartExercise = exercises.find(e => e.id === chartExerciseId);
  const latestPoint = chartData[chartData.length - 1];
  const chartDelta = chartData.length >= 2 ? cleanNumber(latestPoint.value - chartData[0].value) : null;

  const insight = useMemo(() => {
    return generateProgressInsight(chartSessionData, chartExercise?.name, {
      emptyMessage: 'Your journey starts here. Keep logging to build your progression.',
      singleSuffix: ' Keep going.',
    });
  }, [chartSessionData, chartExercise]);

  // Training consistency
  const consistency = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const dayOfWeek = (now.getDay() + 6) % 7; // Mon=0
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    let thisMonth = 0;
    let thisWeek = 0;
    let monthVolume = 0;
    workoutHistory.forEach(w => {
      const d = new Date(w.date + 'T00:00:00');
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        thisMonth++;
        w.sets.forEach(s => { monthVolume += cleanNumber(s.weight) * Number(s.reps); });
      }
      if (d >= weekStart) thisWeek++;
    });
    return { thisMonth, thisWeek, monthVolume: cleanNumber(monthVolume) };
  }, [workoutHistory]);

  // Personal records
  const mostRecentWorkoutId = sortedWorkouts[0]?.id ?? null;
  const personalRecords = useMemo(
    () => computePersonalRecords(workoutHistory, exercises, mostRecentWorkoutId),
    [workoutHistory, exercises, mostRecentWorkoutId]
  );

  // Recent workouts
  const recentWorkouts = useMemo(() => {
    return sortedWorkouts.slice(0, 5).map(w => {
      const exerciseNames = [...new Set(w.sets.map(s => exercises.find(e => e.id === s.exerciseId)?.name).filter(Boolean))];
      let heaviest = 0;
      let volume = 0;
      w.sets.forEach(s => {
        const wt = cleanNumber(s.weight);
        if (wt > heaviest) heaviest = wt;
        volume += wt * Number(s.reps);
      });
      return { ...w, exerciseNames, heaviest, volume: cleanNumber(volume) };
    });
  }, [sortedWorkouts, exercises]);

  const lastWorkout = sortedWorkouts[0];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className={styles.page}>
      {savedToast && (
        <Toast title="Workout saved">
          {savedToast.sessionFocus} · {savedToast.setCount} set{savedToast.setCount !== 1 ? 's' : ''}
        </Toast>
      )}

      <header className={styles.hero}>
        <div className={styles.heroText}>
          <span className={`${styles.kicker} motion-slide-up`}>{today}</span>
          <h1 className={`${styles.greeting} motion-slide-up`} style={{ '--i': 1 }}>
            {getGreeting()}{user?.username ? <>, <span className={styles.name}>{user.username}</span></> : null}.
          </h1>
          <p className={`${styles.heroSub} motion-slide-up`} style={{ '--i': 2 }}>
            {lastWorkout
              ? <>Last trained <strong>{lastTrainedPhrase(lastWorkout.date)}</strong> · {lastWorkout.sessionFocus}</>
              : 'Log your first session to start building your record.'}
          </p>
        </div>
        <div className={`${styles.heroAction} motion-slide-up`} style={{ '--i': 2 }}>
          <Button variant="primary" size="lg" onClick={() => navigate('/log')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            Log Workout
          </Button>
        </div>
      </header>

      <dl className={styles.metrics}>
        <div className={`${styles.metric} motion-slide-up`} style={{ '--i': 3 }}>
          <dt>This week</dt>
          <dd><AnimatedNumber value={consistency.thisWeek} /><span className={styles.metricUnit}>workout{consistency.thisWeek !== 1 ? 's' : ''}</span></dd>
        </div>
        <div className={`${styles.metric} motion-slide-up`} style={{ '--i': 4 }}>
          <dt>This month</dt>
          <dd><AnimatedNumber value={consistency.thisMonth} /><span className={styles.metricUnit}>workout{consistency.thisMonth !== 1 ? 's' : ''}</span></dd>
        </div>
        <div className={`${styles.metric} motion-slide-up`} style={{ '--i': 5 }}>
          <dt>Month volume</dt>
          <dd><AnimatedNumber value={consistency.monthVolume} /><span className={styles.metricUnit}>lbs</span></dd>
        </div>
      </dl>

      <div className={styles.columns}>
        <div className={styles.mainColumn}>
          {/* Progress Graph — ALWAYS VISIBLE */}
          <section className={`${styles.section} motion-slide-up`} style={{ '--i': 6 }} aria-labelledby="progress-heading">
            <div className={styles.sectionHeader}>
              <h2 id="progress-heading" className={styles.sectionLabel}>Progress</h2>
              <MetricToggle options={METRIC_OPTIONS} activeValue={activeMetric} onChange={setActiveMetric} />
            </div>
            <ExerciseChips exercises={exercises} selectedId={chartExerciseId} onSelect={setChartExerciseId} label="Chart exercise" />

            <div className={styles.chartHeadline} aria-live="polite">
              {latestPoint ? (
                <>
                  <span className={styles.chartValue}>
                    <AnimatedNumber value={latestPoint.value} duration={550} />
                    <span className={styles.chartUnit}>{chartUnit}</span>
                  </span>
                  {chartDelta !== null && chartDelta !== 0 && (
                    <span key={`${chartExerciseId}-${activeMetric}`} className={chartDelta > 0 ? styles.deltaUp : styles.deltaDown}>
                      {chartDelta > 0 ? '+' : '−'}{Math.abs(chartDelta).toLocaleString('en-US')} since first session
                    </span>
                  )}
                </>
              ) : (
                <span className={styles.chartEmptyHeadline}>No {chartExercise?.name ?? ''} sessions yet</span>
              )}
            </div>

            <ProgressChart data={chartData} unit={chartUnit} />
            <p key={insight} className={styles.insight}>{insight}</p>
          </section>

          {/* Strength Overview */}
          {strengthData.length > 0 && (
            <section className={`${styles.section} motion-slide-up`} style={{ '--i': 7 }} aria-labelledby="strength-heading">
              <h2 id="strength-heading" className={styles.sectionLabel}>Strength</h2>
              <ul className={styles.strengthList}>
                {strengthData.map((ex, i) => (
                  <li key={ex.id} className={`${styles.strengthRow} motion-fade-in`} style={{ '--i': 8 + i }}>
                    <button type="button" className={styles.strengthButton} onClick={() => setChartExerciseId(ex.id)} aria-label={`Show ${ex.name} progress`}>
                      <span className={styles.strengthLeft}>
                        <span className={styles.strengthName}>{ex.name}</span>
                        {ex.progressPct !== null ? (
                          <span className={Number(ex.progressPct) >= 0 ? styles.progressUp : styles.progressDown}>
                            {Number(ex.progressPct) >= 0 ? '↑' : '↓'} {Math.abs(Number(ex.progressPct))}%
                          </span>
                        ) : ex.sessionCount === 1 ? (
                          <span className={styles.progressFirst}>First session</span>
                        ) : null}
                      </span>
                      <Sparkline values={ex.trend} />
                      <span className={styles.strengthValue}>
                        <AnimatedNumber value={ex.maxWeight} />
                        <span className={styles.strengthUnit}> lbs</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className={styles.sideColumn}>
          {/* Training Heatmap */}
          {hasData && (
            <section className={`${styles.section} motion-slide-up`} style={{ '--i': 7 }} aria-labelledby="activity-heading">
              <h2 id="activity-heading" className={styles.sectionLabel}>Training Activity</h2>
              <TrainingHeatmap workoutHistory={workoutHistory} />
            </section>
          )}

          {/* Personal Records */}
          {personalRecords.length > 0 && (
            <section className={`${styles.section} motion-slide-up`} style={{ '--i': 8 }} aria-labelledby="pr-heading">
              <h2 id="pr-heading" className={styles.sectionLabel}>Personal Records</h2>
              <ul className={styles.prList}>
                {personalRecords.map((pr, i) => (
                  <li key={pr.exerciseId} className={`${styles.prRow} motion-fade-in`} style={{ '--i': 9 + i }}>
                    <span className={styles.prLeft}>
                      <span className={styles.prName}>{pr.name}</span>
                      {pr.isNew && <span className={styles.prNew}>New</span>}
                    </span>
                    <span className={styles.prValue}>
                      <strong>{pr.weight}</strong> lbs × {pr.reps}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Recent Workouts */}
          {recentWorkouts.length > 0 && (
            <section className={`${styles.section} motion-slide-up`} style={{ '--i': 9 }} aria-labelledby="recent-heading">
              <h2 id="recent-heading" className={styles.sectionLabel}>Recent Workouts</h2>
              <ul className={styles.workoutTimeline}>
                {recentWorkouts.map((w, i) => (
                  <li key={w.id} className="motion-fade-in" style={{ '--i': 10 + i }}>
                    <button type="button" className={styles.workoutEntry} onClick={() => navigate('/workout-history')}>
                      <span className={styles.workoutDate}>{formatRelativeDate(w.date)}</span>
                      <span className={styles.workoutContent}>
                        <span className={styles.workoutFocus}>{w.sessionFocus}</span>
                        <span className={styles.workoutExercises}>{w.exerciseNames.join(' · ')}</span>
                        <span className={styles.workoutStats}>
                          {w.sets.length} set{w.sets.length !== 1 ? 's' : ''}
                          {w.heaviest > 0 ? ` · top ${w.heaviest} lbs` : ''}
                          {w.volume > 0 ? ` · ${w.volume.toLocaleString('en-US')} lbs volume` : ''}
                        </span>
                      </span>
                      <svg className={styles.chevron} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5" /></svg>
                    </button>
                  </li>
                ))}
              </ul>
              <Button variant="ghost" fullWidth className={styles.viewAll} onClick={() => navigate('/workout-history')}>View All Workouts</Button>
            </section>
          )}

          {!hasData && (
            <section className={`${styles.emptyState} motion-slide-up`} style={{ '--i': 7 }}>
              <p className={styles.emptyTitle}>Nothing logged yet</p>
              <p className={styles.emptyHint}>Your heatmap, records, and recent sessions will appear here after your first workout.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
