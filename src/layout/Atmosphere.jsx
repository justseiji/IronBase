import { useEffect, useRef } from 'react';
import useReducedMotion from '../hooks/useReducedMotion';
import { startDustField } from './dustField';
import styles from './Atmosphere.module.css';

/**
 * Fixed backdrop behind every screen: soft haze, grain, and floating dust.
 * Purely decorative; it never receives pointer events or focus.
 */
export default function Atmosphere() {
  const canvasRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startDustField(canvas, { animate: !reducedMotion });
  }, [reducedMotion]);

  return (
    <div className={styles.atmosphere} aria-hidden="true">
      <div className={`${styles.layer} ${styles.glow}`} />
      <div className={`${styles.layer} ${styles.arc}`} />
      <div className={`${styles.layer} ${styles.warmth}`} />
      <div className={styles.grain} />
      <canvas ref={canvasRef} className={styles.dust} />
    </div>
  );
}
