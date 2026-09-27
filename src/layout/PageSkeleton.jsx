import styles from './PageSkeleton.module.css';

export default function PageSkeleton({ message, error }) {
  if (error) {
    return (
      <div className={styles.error} role="alert">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.skeleton} aria-busy="true" aria-label="Loading">
      {message && <p className={styles.message} role="status">{message}</p>}
      <span className="skeleton" style={{ width: '58%', height: 40 }} />
      <div className={styles.metrics}>
        {[0, 1, 2].map(i => (
          <div key={i} className={styles.metric}>
            <span className="skeleton" style={{ width: '60%', height: 12 }} />
            <span className="skeleton" style={{ width: '80%', height: 28 }} />
          </div>
        ))}
      </div>
      <span className="skeleton" style={{ width: '100%', height: 220, borderRadius: 14 }} />
      {[0, 1, 2].map(i => (
        <span key={i} className="skeleton" style={{ width: `${88 - i * 14}%`, height: 18 }} />
      ))}
    </div>
  );
}
