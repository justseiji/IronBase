import { useState, useMemo, useRef } from 'react';
import { cleanNumber } from '../../../utils/numbers';
import { toLocalDateString } from '../../../utils/dateFormatters';
import styles from './TrainingHeatmap.module.css';

const WEEKS = 12;

function formatDateLabel(d) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getDayLabel(dayIndex) {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayIndex];
}

export default function TrainingHeatmap({ workoutHistory = [] }) {
  const [activeCell, setActiveCell] = useState(null);
  const containerRef = useRef(null);

  const { grid, activeDays } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = toLocalDateString(today);

    // Build date-to-workout map
    const workoutMap = {};
    workoutHistory.forEach(w => {
      const key = w.date;
      if (!workoutMap[key]) workoutMap[key] = { sets: 0, volume: 0, exercises: new Set() };
      w.sets.forEach(s => {
        workoutMap[key].sets++;
        workoutMap[key].volume = cleanNumber(workoutMap[key].volume + cleanNumber(s.weight) * Number(s.reps));
        workoutMap[key].exercises.add(s.exerciseId);
      });
    });

    // Generate WEEKS weeks ending with the current week (Mon-first)
    const days = [];
    const dayOfWeek = (today.getDay() + 6) % 7;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - ((WEEKS - 1) * 7 + dayOfWeek));

    for (let i = 0; i < WEEKS * 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = toLocalDateString(d);
      const data = workoutMap[dateStr];
      days.push({
        date: d,
        dateStr,
        volume: data?.volume || 0,
        sets: data?.sets || 0,
        exerciseCount: data?.exercises?.size || 0,
        hasWorkout: !!data,
        isToday: dateStr === todayStr,
        isFuture: d > today,
      });
    }

    // Intensity relative to the heaviest day in view
    const maxVolume = Math.max(0, ...days.map(d => d.volume));

    const grid = [];
    for (let week = 0; week < WEEKS; week++) {
      const col = [];
      for (let day = 0; day < 7; day++) {
        const d = days[week * 7 + day];
        let level = 0;
        if (d.hasWorkout) {
          const ratio = maxVolume > 0 ? d.volume / maxVolume : 1;
          level = ratio > 0.66 ? 3 : ratio > 0.33 ? 2 : 1;
        }
        col.push({ ...d, level });
      }
      grid.push(col);
    }

    return { grid, activeDays: days.filter(d => d.hasWorkout).length };
  }, [workoutHistory]);

  function showCell(cell, target) {
    if (!cell.hasWorkout) {
      setActiveCell(null);
      return;
    }
    const rect = target.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    const half = 76;
    let left = rect.left - containerRect.left + rect.width / 2;
    left = Math.max(half, Math.min(left, containerRect.width - half));
    setActiveCell({ ...cell, tooltipLeft: left, tooltipTop: rect.top - containerRect.top - 8 });
  }

  return (
    <div className={styles.heatmap} ref={containerRef} onMouseLeave={() => setActiveCell(null)}>
      <div className={styles.grid}>
        <div className={styles.dayLabels} aria-hidden="true">
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <span key={i} className={styles.dayLabel}>{i % 2 === 0 ? getDayLabel(i) : ''}</span>
          ))}
        </div>
        <div className={styles.cells} role="group" aria-label={`Training activity, last ${WEEKS} weeks: ${activeDays} training days`}>
          {grid.map((week, wi) => (
            <div key={wi} className={styles.weekCol} style={{ '--col': wi }}>
              {week.map(cell => {
                const selected = activeCell?.dateStr === cell.dateStr;
                const classes = [
                  styles.cell,
                  styles['level' + cell.level],
                  cell.isToday ? styles.today : '',
                  cell.isFuture ? styles.future : '',
                  selected ? styles.selected : '',
                ].filter(Boolean).join(' ');

                if (!cell.hasWorkout) {
                  return <div key={cell.dateStr} className={classes} onMouseEnter={() => setActiveCell(null)} />;
                }
                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    className={classes}
                    aria-label={`${formatDateLabel(cell.date)}: ${cell.sets} sets, ${cleanNumber(cell.volume).toLocaleString()} pounds volume`}
                    aria-pressed={selected}
                    onMouseEnter={e => showCell(cell, e.currentTarget)}
                    onFocus={e => showCell(cell, e.currentTarget)}
                    onBlur={() => setActiveCell(null)}
                    onClick={e => (selected ? setActiveCell(null) : showCell(cell, e.currentTarget))}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.legend} aria-hidden="true">
        <span>Less</span>
        {[0, 1, 2, 3].map(l => <span key={l} className={`${styles.legendCell} ${styles['level' + l]}`} />)}
        <span>More</span>
      </div>

      {activeCell && (
        <div
          key={activeCell.dateStr}
          className={styles.tooltip}
          style={{ left: activeCell.tooltipLeft, top: activeCell.tooltipTop }}
          aria-hidden="true"
        >
          <div className={styles.tooltipDate}>{formatDateLabel(activeCell.date)}</div>
          <div className={styles.tooltipStats}>
            {activeCell.exerciseCount} exercise{activeCell.exerciseCount !== 1 ? 's' : ''} · {activeCell.sets} set{activeCell.sets !== 1 ? 's' : ''}
          </div>
          <div className={styles.tooltipVolume}>
            {cleanNumber(activeCell.volume).toLocaleString()} lbs·reps
          </div>
        </div>
      )}
    </div>
  );
}
