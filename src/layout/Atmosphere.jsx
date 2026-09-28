import { useEffect, useRef } from 'react';
import useReducedMotion from '../hooks/useReducedMotion';
import { startDustField } from './dustField';
import { startHazeDrift } from './hazeDrift';
import styles from './Atmosphere.module.css';

/**
 * Fixed backdrop behind every screen: slowly drifting haze, grain, and
 * floating dust. Purely decorative; it never receives pointer events or focus.
 */
export default function Atmosphere() {
  const canvasRef = useRef(null);
  const glowRef = useRef(null);
  const arcRef = useRef(null);
  const veilRef = useRef(null);
  const warmthRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Where the light currently is, so dust brightens as the haze passes over it.
    const light = { x: 0, y: 0 };
    const stopHaze = reducedMotion
      ? () => {}
      : startHazeDrift({ glow: glowRef.current, arc: arcRef.current, veil: veilRef.current, warmth: warmthRef.current }, light);
    const stopDust = startDustField(canvas, { animate: !reducedMotion, light });
    return () => {
      stopHaze();
      stopDust();
    };
  }, [reducedMotion]);

  return (
    <div className={styles.atmosphere} aria-hidden="true">
      <div ref={glowRef} className={`${styles.layer} ${styles.glow}`} />
      <div ref={arcRef} className={`${styles.layer} ${styles.arc}`} />
      <div ref={veilRef} className={`${styles.layer} ${styles.veil}`} />
      <div ref={warmthRef} className={`${styles.layer} ${styles.warmth}`} />
      <div className={styles.grain} />
      <canvas ref={canvasRef} className={styles.dust} />
    </div>
  );
}
