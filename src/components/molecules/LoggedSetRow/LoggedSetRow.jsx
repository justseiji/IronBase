import IconButton from '../../atoms/IconButton/IconButton';
import styles from './LoggedSetRow.module.css';

export default function LoggedSetRow({ set, onEdit, onDelete }) {
  return (
    <div className={styles.row}>
      <div className={styles.info}>
        <span className={styles.exercise}>{set.exerciseName}</span>
        <span className={styles.details}>
          {set.weight} lbs × {set.reps} reps{set.rpe ? ` @ RPE ${set.rpe}` : ''}
        </span>
      </div>
      <div className={styles.actions}>
        <IconButton onClick={onEdit} ariaLabel="Edit set" title="Edit">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" />
          </svg>
        </IconButton>
        <IconButton onClick={onDelete} ariaLabel="Delete set" title="Delete">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4M13 4v9.33a1.33 1.33 0 01-1.33 1.34H4.33A1.33 1.33 0 013 13.33V4" />
          </svg>
        </IconButton>
      </div>
    </div>
  );
}
