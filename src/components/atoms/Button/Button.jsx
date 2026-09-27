import styles from './Button.module.css';

/**
 * @param {'idle'|'loading'|'success'} status - loading/success swap the label
 * for an indicator in place, so the button never changes size.
 */
export default function Button({ children, onClick, variant = 'secondary', type = 'button', disabled = false, className = '', fullWidth = false, status = 'idle', size = 'md' }) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    status !== 'idle' ? styles[status] : '',
    className
  ].filter(Boolean).join(' ');

  const busy = status === 'loading';

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || status !== 'idle'}
      aria-busy={busy || undefined}
    >
      <span className={styles.label}>{children}</span>
      <span className={styles.loader} aria-hidden="true">
        <span /><span /><span />
      </span>
      <svg className={styles.check} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </button>
  );
}
