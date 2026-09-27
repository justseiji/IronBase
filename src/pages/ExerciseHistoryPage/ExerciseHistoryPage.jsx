import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import AnimatedNumber from '../../components/atoms/AnimatedNumber/AnimatedNumber';
import ExerciseChips from '../../components/molecules/ExerciseChips/ExerciseChips';
import MetricToggle from '../../components/molecules/MetricToggle/MetricToggle';
import ProgressChart from '../../components/molecules/ProgressChart/ProgressChart';
import { cleanNumber } from '../../utils/numbers';
import { formatDateWithYear } from '../../utils/dateFormatters';
import { calcE1RM } from '../../services/e1rmService';
import { getSetsForExercise, computeSessionMetrics, computeChartData, generateProgressInsight } from '../../services/analyticsService';
import styles from './ExerciseHistoryPage.module.css';

const METRIC_OPTIONS = [
  { value: 'weight', label: 'Weight' },
  { value: 'volume', label: 'Volume' },
  { value: 'e1rm', label: 'Est. 1RM' },
];

function bestSetOf(sets) {
  return sets.reduce((best, s) => (!best || cleanNumber(s.weight) > cleanNumber(best.weight) ? s : best), null);
}

function Delta({ value, unit }) {
  if (value === 0) return <span className={styles.deltaSame}>No change</span>;
  return (
    <span className={value > 0 ? styles.deltaUp : styles.deltaDown}>
      {value > 0 ? '+' : '−'}{Math.abs(value).toLocaleString('en-US')}{unit ? ` ${unit}` : ''}
    </span>
  );
}

export default function ExerciseHistoryPage({ exercises = [], workoutHistory = [] }) {
  const navigate = useNavigate();
  const [selectedExerciseId, setSelectedExerciseId] = useState(exercises[0]?.id || '');
  const [activeMetric, setActiveMetric] = useState('weight');

  const selectedExercise = exercises.find(e => e.id === selectedExerciseId);

  const allSets = useMemo(() => getSetsForExercise(workoutHistory, selectedExerciseId), [workoutHistory, selectedExerciseId]);
  const sessionData = useMemo(() => computeSessionMetrics(allSets), [allSets]);
  const chartData = useMemo(() => computeChartData(sessionData, activeMetric), [sessionData, activeMetric]);
  const chartUnit = activeMetric === 'volume' ? 'lbs·reps' : 'lbs';

  const bestSet = useMemo(() => bestSetOf(allSets), [allSets]);

  const bestE1RM = useMemo(() => {
    if (allSets.length === 0) return 0;
    return cleanNumber(Math.max(...allSets.map(s => calcE1RM(cleanNumber(s.weight), Number(s.reps)))));
  }, [allSets]);

  const maxVolume = sessionData.length > 0 ? Math.max(...sessionData.map(s => s.totalVolume)) : 0;

  // Progress percentage (first session vs last session max weight)
  const progressPct = useMemo(() => {
    if (sessionData.length < 2) return null;
    const first = sessionData[0].maxWeight;
    const last = sessionData[sessionData.length - 1].maxWeight;
    if (first === 0) return null;
    return cleanNumber(((last - first) / first) * 100);
  }, [sessionData]);

  // Latest session against the one before it
  const comparison = useMemo(() => {
    if (sessionData.length < 2) return null;
    const latest = sessionData[sessionData.length - 1];
    const previous = sessionData[sessionData.length - 2];
    const latestBest = bestSetOf(latest.sets);
    const previousBest = bestSetOf(previous.sets);
    return {
      latest, previous, latestBest, previousBest,
      weightDelta: cleanNumber(latest.maxWeight - previous.maxWeight),
      volumeDelta: cleanNumber(latest.totalVolume - previous.totalVolume),
      e1rmDelta: cleanNumber(latest.maxE1RM - previous.maxE1RM),
    };
  }, [sessionData]);

  // Sessions newest-first, flagged when they set a new heaviest weight
  const history = useMemo(() => {
    const flagged = [];
    let runningMax = 0;
    for (let i = 0; i < sessionData.length; i++) {
      const s = sessionData[i];
      flagged.push({ ...s, isPR: i > 0 && s.maxWeight > runningMax, isFirst: i === 0 });
      runningMax = Math.max(runningMax, s.maxWeight);
    }
    return flagged.reverse();
  }, [sessionData]);

  const hasData = allSets.length > 0;
  const insight = useMemo(() => generateProgressInsight(sessionData, selectedExercise?.name), [sessionData, selectedExercise]);
  const latestPoint = chartData[chartData.length - 1];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={`${styles.kicker} motion-slide-up`}>Exercise History</span>
        <div className="motion-slide-up" style={{ '--i': 1 }}>
          <ExerciseChips exercises={exercises} selectedId={selectedExerciseId} onSelect={setSelectedExerciseId} />
        </div>

        <div key={selectedExerciseId} className={styles.titleBlock}>
          <h1 className={styles.exerciseName}>{selectedExercise?.name ?? 'Exercise'}</h1>
          {hasData ? (
            <div className={styles.exerciseStats}>
              <span className={styles.bestSetLabel}>
                Best set <strong>{cleanNumber(bestSet?.weight)} lbs × {cleanNumber(bestSet?.reps)}</strong>
              </span>
              {progressPct !== null && (
                <span className={progressPct >= 0 ? styles.progressUp : styles.progressDown}>
                  {progressPct >= 0 ? '↑' : '↓'} {Math.abs(progressPct)}% since first session
                </span>
              )}
            </div>
          ) : (
            <p className={styles.bestSetLabel}>No sessions logged yet.</p>
          )}
        </div>
      </header>

      <section className={`${styles.section} motion-slide-up`} style={{ '--i': 2 }} aria-labelledby="progression-heading">
        <div className={styles.sectionHeader}>
          <h2 id="progression-heading" className={styles.sectionLabel}>Progression</h2>
          <MetricToggle options={METRIC_OPTIONS} activeValue={activeMetric} onChange={setActiveMetric} />
        </div>
        {latestPoint && (
          <div className={styles.chartHeadline}>
            <span className={styles.chartValue}>
              <AnimatedNumber value={latestPoint.value} duration={550} />
              <span className={styles.chartUnit}>{chartUnit}</span>
            </span>
            <span className={styles.chartCaption}>latest session</span>
          </div>
        )}
        <ProgressChart data={chartData} unit={chartUnit} />
        {hasData && <p key={insight} className={styles.insight}>{insight}</p>}
      </section>

      {!hasData && (
        <section className={`${styles.emptyState} motion-slide-up`} style={{ '--i': 3 }}>
          <p className={styles.emptyTitle}>No {selectedExercise?.name ?? ''} sessions yet</p>
          <p className={styles.emptyHint}>Log a set of {selectedExercise?.name ?? 'this exercise'} and your records, comparisons, and history will build here.</p>
          <Button variant="secondary" onClick={() => navigate('/log')}>Log Workout</Button>
        </section>
      )}

      {comparison && (
        <section key={`cmp-${selectedExerciseId}`} className={`${styles.section} motion-slide-up`} style={{ '--i': 3 }} aria-labelledby="compare-heading">
          <h2 id="compare-heading" className={styles.sectionLabel}>Latest vs Previous Session</h2>
          <div className={styles.compare}>
            <div className={styles.compareCol}>
              <span className={styles.compareDate}>{formatDateWithYear(comparison.latest.date)}</span>
              <span className={styles.compareValue}>{cleanNumber(comparison.latestBest.weight)} <small>lbs × {cleanNumber(comparison.latestBest.reps)}</small></span>
            </div>
            <div className={styles.compareCol}>
              <span className={styles.compareDate}>{formatDateWithYear(comparison.previous.date)}</span>
              <span className={`${styles.compareValue} ${styles.compareMuted}`}>{cleanNumber(comparison.previousBest.weight)} <small>lbs × {cleanNumber(comparison.previousBest.reps)}</small></span>
            </div>
          </div>
          <dl className={styles.deltaRow}>
            <div><dt>Top weight</dt><dd><Delta value={comparison.weightDelta} unit="lbs" /></dd></div>
            <div><dt>Volume</dt><dd><Delta value={comparison.volumeDelta} /></dd></div>
            <div><dt>Est. 1RM</dt><dd><Delta value={comparison.e1rmDelta} unit="lbs" /></dd></div>
          </dl>
        </section>
      )}

      {hasData && (
        <>
          <section className={`${styles.section} motion-slide-up`} style={{ '--i': 4 }} aria-labelledby="records-heading">
            <h2 id="records-heading" className={styles.sectionLabel}>Personal Records</h2>
            <dl className={styles.prGrid}>
              <div className={styles.prCell}>
                <dt>Heaviest</dt>
                <dd><AnimatedNumber value={cleanNumber(bestSet?.weight)} /><span className={styles.prUnit}>lbs</span></dd>
              </div>
              <div className={styles.prCell}>
                <dt>Est. 1RM</dt>
                <dd><AnimatedNumber value={bestE1RM} /><span className={styles.prUnit}>lbs</span></dd>
              </div>
              <div className={styles.prCell}>
                <dt>Max volume</dt>
                <dd><AnimatedNumber value={maxVolume} /><span className={styles.prUnit}>lbs·reps</span></dd>
              </div>
            </dl>
            <p className={styles.footnote}>Est. 1RM uses the Epley formula on your best logged set.</p>
          </section>

          <section key={`hist-${selectedExerciseId}`} className={styles.section} aria-labelledby="sessions-heading">
            <h2 id="sessions-heading" className={styles.sectionLabel}>Session History</h2>
            <ol className={styles.sessions}>
              {history.map((session, i) => (
                <li key={session.date} className={`${styles.session} motion-slide-up`} style={{ '--i': Math.min(i, 10) + 4 }}>
                  <div className={styles.sessionHead}>
                    <span className={styles.sessionDate}>{formatDateWithYear(session.date)}</span>
                    {session.isPR && <span className={styles.prBadge}>PR</span>}
                    {session.isFirst && <span className={styles.firstBadge}>First</span>}
                    <span className={styles.sessionVolume}>{session.totalVolume.toLocaleString('en-US')} lbs·reps</span>
                  </div>
                  <div className={styles.setChips}>
                    {session.sets.map((s, j) => (
                      <span key={s.id || j} className={`${styles.setChip} ${cleanNumber(s.weight) === session.maxWeight ? styles.setChipTop : ''}`}>
                        {cleanNumber(s.weight)}<span className={styles.times}>×</span>{cleanNumber(s.reps)}
                        {s.rpe ? <span className={styles.chipRpe}>@{cleanNumber(s.rpe)}</span> : null}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
