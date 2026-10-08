import styles from './LogoMark.module.css';

// Same dumbbell as public/favicon.svg, so the app and the browser tab share one logo.
export default function LogoMark({ className = '' }) {
  return (
    <svg className={`${styles.mark} ${className}`} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect className={styles.tile} width="32" height="32" rx="7" />
      <g className={styles.plates}>
        <rect x="4" y="10" width="4" height="12" rx="1.5" />
        <rect x="24" y="10" width="4" height="12" rx="1.5" />
        <rect x="8" y="12.5" width="3" height="7" rx="1" />
        <rect x="21" y="12.5" width="3" height="7" rx="1" />
      </g>
      <rect className={styles.bar} x="11" y="14.75" width="10" height="2.5" rx="1.25" />
    </svg>
  );
}
