import { useEffect, useMemo, useState } from 'react';
import useReducedMotion from '../../../hooks/useReducedMotion';
import { MOVEMENTS, GROUND, PLATE_R, HEAD_R, easeInOut, phaseStart, frameFor } from './movements';
import styles from './MovementDemo.module.css';

// Which side of the plate the direction arrow sits on, away from the body.
const ARROW_SIDE = { squat: -1, deadlift: 1, row: 1, overhead: 1, bench: -1 };

function locate(phases, time) {
  let start = 0;
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    if (time < start + phase.ms || i === phases.length - 1) {
      const local = Math.min(1, Math.max(0, (time - start) / phase.ms));
      return { index: i, local, phase };
    }
    start += phase.ms;
  }
  return { index: 0, local: 0, phase: phases[0] };
}

function progressAt(phase, local) {
  return phase.from + (phase.to - phase.from) * easeInOut(local);
}

const line = (a, b) => ({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });

/**
 * Looping side-view demonstration of a lift, with its steps.
 * Plays automatically unless the user prefers reduced motion, in which case
 * it rests on each step's key position and the user moves between steps.
 */
export default function MovementDemo({ movementId, steps, name }) {
  const movement = MOVEMENTS[movementId];
  const { phases, pose } = movement;
  const total = useMemo(() => phases.reduce((sum, ph) => sum + ph.ms, 0), [phases]);
  const reducedMotion = useReducedMotion();
  // null until the user presses play/pause; until then, motion preference decides.
  const [playChoice, setPlayChoice] = useState(null);
  const playing = playChoice ?? !reducedMotion;
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!playing) return;
    let frame;
    let last = null;
    const tick = (now) => {
      // Cap the step so a backgrounded tab resumes where it left off.
      if (last !== null) setTime(t => (t + Math.min(now - last, 100)) % total);
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, total]);

  const frame = useMemo(() => frameFor(pose), [pose]);

  // The full bar path, drawn faintly so the range of motion is always visible.
  const barPath = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 40; i++) {
      const { bar } = pose(i / 40);
      points.push(`${bar.x.toFixed(1)},${bar.y.toFixed(1)}`);
    }
    return points.join(' ');
  }, [pose]);

  const { index, local, phase } = locate(phases, time);
  const p = progressAt(phase, local);
  const b = pose(p);
  const moving = phase.from !== phase.to;

  // Direction of travel beside the plate. It is always positioned (during a
  // hold it points the way the next movement goes) and only fades in while
  // the bar is actually moving.
  const heading = moving ? phase : phases[(index + 1) % phases.length];
  const sign = heading.to > heading.from ? 1 : -1;
  const ahead = pose(Math.min(1, Math.max(0, p + sign * 0.03))).bar;
  const behind = pose(Math.min(1, Math.max(0, p - sign * 0.03))).bar;
  const arrow = {
    x: b.bar.x + ARROW_SIDE[movementId] * (PLATE_R + 12),
    y: b.bar.y,
    angle: (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI,
  };

  function showStep(i) {
    setPlayChoice(false);
    setTime(phaseStart(phases, i) + phases[i].ms / 2);
  }

  function togglePlay() {
    setPlayChoice(!playing);
  }

  return (
    <div className={styles.demo}>
      <div className={styles.stage}>
        <svg
          className={styles.figure}
          viewBox={`${frame.x.toFixed(1)} ${frame.y.toFixed(1)} ${frame.w.toFixed(1)} ${frame.h.toFixed(1)}`}
          role="img"
          aria-label={`Side-view demonstration of the ${name}. Current step: ${index + 1}, ${steps[index].title}.`}
          onClick={togglePlay}
        >
          <line className={styles.floor} x1={frame.x} y1={GROUND} x2={frame.x + frame.w} y2={GROUND} />

          {b.bench && (
            <g className={styles.bench}>
              <rect x={b.bench.left} y={b.bench.top} width={b.bench.right - b.bench.left} height="7" rx="3" />
              <line x1={b.bench.left + 14} y1={b.bench.top + 7} x2={b.bench.left + 14} y2={GROUND} />
              <line x1={b.bench.right - 14} y1={b.bench.top + 7} x2={b.bench.right - 14} y2={GROUND} />
            </g>
          )}

          <polyline className={styles.path} points={barPath} />
          <circle className={styles.plate} cx={b.bar.x} cy={b.bar.y} r={PLATE_R} />

          <g className={styles.body}>
            <line className={styles.foot} {...line(b.heel, b.toe)} />
            <line className={styles.shin} {...line(b.ankle, b.knee)} />
            <line className={styles.thigh} {...line(b.knee, b.hip)} />
            <line className={styles.torso} {...line(b.hip, b.shoulder)} />
            <line className={styles.neck} {...line(b.shoulder, b.head)} />
            <circle className={styles.head} cx={b.head.x} cy={b.head.y} r={HEAD_R} />
            <line className={styles.upperArm} {...line(b.shoulder, b.elbow)} />
            <line className={styles.forearm} {...line(b.elbow, b.hand)} />
            <circle className={styles.hand} cx={b.hand.x} cy={b.hand.y} r="3.5" />
          </g>

          <circle className={styles.barEnd} cx={b.bar.x} cy={b.bar.y} r="3" />

          <g className={`${styles.arrow} ${moving ? styles.arrowVisible : ''}`} transform={`translate(${arrow.x} ${arrow.y}) rotate(${arrow.angle})`}>
            <path d="M-7 0 H5 M0 -5 L6 0 L0 5" />
          </g>
        </svg>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.playButton}
            onClick={togglePlay}
            aria-label={playing ? 'Pause demonstration' : 'Play demonstration'}
          >
            {playing ? (
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9M11 3.5v9" /></svg>
            ) : (
              <svg viewBox="0 0 16 16" aria-hidden="true"><path className={styles.playIcon} d="M5 3.2v9.6L12.5 8z" /></svg>
            )}
          </button>
          <div className={styles.progress} aria-hidden="true">
            {phases.map((ph, i) => (
              <span key={i} className={styles.segment} style={{ flexGrow: ph.ms }}>
                <span
                  className={styles.segmentFill}
                  style={{ transform: `scaleX(${i < index ? 1 : i === index ? local : 0})` }}
                />
              </span>
            ))}
          </div>
        </div>
      </div>

      <ol className={styles.steps}>
        {steps.map((step, i) => (
          <li key={step.title}>
            <button
              type="button"
              className={`${styles.step} ${i === index ? styles.stepActive : ''}`}
              onClick={() => showStep(i)}
              aria-current={i === index ? 'step' : undefined}
            >
              <span className={styles.stepNumber} aria-hidden="true">{i + 1}</span>
              <span className={styles.stepText}>
                <span className={styles.stepTitle}>{step.title}</span>
                <span className={styles.stepDetail}>{step.text}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
