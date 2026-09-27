import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Toast.module.css';

export default function Toast({ title, children, duration = 2800, tone = 'success' }) {
  const [phase, setPhase] = useState('in');

  useEffect(() => {
    const leave = setTimeout(() => setPhase('out'), duration);
    const remove = setTimeout(() => setPhase('gone'), duration + 260);
    return () => {
      clearTimeout(leave);
      clearTimeout(remove);
    };
  }, [duration]);

  if (phase === 'gone') return null;

  return createPortal(
    <div className={`${styles.toast} ${styles[tone]} ${phase === 'out' ? styles.out : ''}`} role="status">
      <span className={styles.icon} aria-hidden="true">
        {tone === 'success' ? (
          <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        ) : (
          <svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" /></svg>
        )}
      </span>
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {children && <span className={styles.body}>{children}</span>}
      </span>
    </div>,
    document.body
  );
}
