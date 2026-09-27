import useSyncStatus, { SYNC_LABELS } from '../../../hooks/useSyncStatus';
import styles from './SyncStatusIndicator.module.css';

export default function SyncStatusIndicator() {
  const { status, pending } = useSyncStatus();
  const detail = status === 'offline' && pending > 0 ? `${pending} change${pending !== 1 ? 's' : ''} saved on this device` : null;

  return (
    <div className={`${styles.indicator} ${styles[status]}`} role="status" title={detail || SYNC_LABELS[status]}>
      <span className={styles.dot} aria-hidden="true" />
      <span key={status} className={styles.label}>{SYNC_LABELS[status]}</span>
      {detail && <span className="visually-hidden">, {detail}</span>}
    </div>
  );
}
