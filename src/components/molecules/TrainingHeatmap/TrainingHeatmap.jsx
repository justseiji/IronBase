import { useState, useMemo, useRef, useCallback } from 'react';
import { cleanNumber } from '../../../utils/numbers';
import styles from './TrainingHeatmap.module.css';

function formatDateLabel(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDayLabel(dayIndex) {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayIndex];
}

export default function TrainingHeatmap({ workoutHistory = [] }) {
  const [activeCell, setActiveCell] = useState(null);
  const containerRef = useRef(null);

  const { grid, tooltipData, intensityLevels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    // Generate 84 days (12 weeks) ending today
    const days = [];
    const dayOfWeek = (today.getDay() + 6) % 7; // Mon=0
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (11 * 7 + dayOfWeek));

    for (let i = 0; i < 84; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const data = workoutMap[dateStr];
      days.push({
        date: d,
        dateStr,
        volume: data?.volume || 0,
        sets: data?.sets || 0,
        exerciseCount: data?.exercises?.size || 0,
        hasWorkout: !!data,
      });
    }

    // Calculate intensity thresholds from non-zero volumes
    const volumes = days.filter(d => d.volume > 0).map(d => d.volume).sort((a, b) => a - b);
    const q1 = volumes[Math.floor(volumes.length * 0.33)] || 0;
    const q2 = volumes[Math.floor(volumes.length * 0.66)] || 0;

    // Arrange into weeks (columns) × days (rows)
    const grid = [];
    for (let week = 0; week < 12; week++) {
      const col = [];
      for (let day = 0; day < 7; day++) {
        const idx = week * 7 + day;
        const d = days[idx];
        let level = 0;
        if (d.volume > 0) {
          if (d.volume <= q1) level = 1;
          else if (d.volume <= q2) level = 2;
          else level = 3;
        }
        col.push({ ...d, level });
      }
      grid.push(col);
    }

    return { grid, tooltipData: null, intensityLevels: { q1, q2 } };
  }, [workoutHistory]);

  const handleCellInteraction = useCallback((cell, e) => {
    if (!cell.hasWorkout) {
      setActiveCell(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    let left = rect.left - (containerRect?.left || 0) + rect.width / 2;
    // Clamp tooltip position
    left = Math.max(60, Math.min(left, (containerRect?.width || 300) - 60));
    setActiveCell({
      ...cell,
      tooltipLeft: left,
      tooltipTop: rect.top - (containerRect?.top || 0) - 8,
    });
  }, []);

  return (
    <div className={styles.heatmap} ref={containerRef} onMouseLeave={() => setActiveCell(null)}>
      <div className={styles.grid}>
        <div className={styles.dayLabels}>
          {[0, 2, 4].map(i => (
            <span key={i} className={styles.dayLabel} style={{ gridRow: i + 1 }}>
              {getDayLabel(i)}
            </span>
          ))}
        </div>
        <div className={styles.cells}>
          {grid.map((week, wi) => (
            <div key={wi} className={styles.weekCol}>
              {week.map((cell, di) => (
                <div
                  key={di}
                  className={`${styles.cell} ${styles['level' + cell.level]}`}
                  onMouseEnter={(e) => handleCellInteraction(cell, e)}
                  onClick={(e) => handleCellInteraction(cell, e)}
                  title={cell.hasWorkout ? formatDateLabel(cell.date) : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {activeCell && (
        <div
          className={styles.tooltip}
          style={{ left: activeCell.tooltipLeft, top: activeCell.tooltipTop }}
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
