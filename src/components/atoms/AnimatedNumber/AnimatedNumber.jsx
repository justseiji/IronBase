import { useEffect, useRef } from 'react';
import { cleanNumber } from '../../../utils/numbers';
import { prefersReducedMotion } from '../../../hooks/useReducedMotion';

function decimalsOf(value) {
  const str = String(cleanNumber(value));
  const dot = str.indexOf('.');
  return dot === -1 ? 0 : str.length - dot - 1;
}

function format(value, decimals) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

/**
 * Renders a number that eases toward new values. Frames are written straight
 * to the DOM so counting never re-renders React.
 */
export default function AnimatedNumber({ value, duration = 700, className }) {
  const target = cleanNumber(value);
  const ref = useRef(null);
  const shownRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const decimals = decimalsOf(target);
    const from = shownRef.current;

    if (prefersReducedMotion() || from === target) {
      shownRef.current = target;
      el.textContent = format(target, decimals);
      return;
    }

    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const current = from + (target - from) * easeOutCubic(t);
      shownRef.current = current;
      el.textContent = format(t === 1 ? target : Number(current.toFixed(decimals)), decimals);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      <span ref={ref} aria-hidden="true">{format(0, 0)}</span>
      <span className="visually-hidden">{format(target, decimalsOf(target))}</span>
    </span>
  );
}
