import IconButton from '../../atoms/IconButton/IconButton';
import { cleanNumber } from '../../../utils/numbers';
import styles from './LoggedSetRow.module.css';

export default function LoggedSetRow({ set, number, onEdit, onDelete, isEditing = false, isExiting = false, flashKey = 0 }) {
  const rowClasses = [
    styles.item,
    isEditing ? styles.editing : '',
    isExiting ? styles.exiting : '',
  ].filter(Boolean).join(' ');

  return (
    <li className={rowClasses} aria-hidden={isExiting || undefined}>
      <div className={styles.collapse}>
        <div className={styles.row}>
          {flashKey > 0 && <span key={flashKey} className={styles.flash} aria-hidden="true" />}
          <span className={styles.number} aria-hidden="true">{number}</span>
          <div className={styles.info}>
            <span className={styles.exercise}>
              {set.exerciseName}
              <span className="visually-hidden">, set {number}</span>
            </span>
            <span className={styles.details}>
              <strong>{cleanNumber(set.weight)}</strong> lbs × <strong>{cleanNumber(set.reps)}</strong>
              {set.rpe ? <span className={styles.rpe}>RPE {cleanNumber(set.rpe)}</span> : null}
            </span>
          </div>
          <div className={styles.actions}>
            <IconButton onClick={onEdit} ariaLabel={`Edit ${set.exerciseName} set ${number}`} title="Edit">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" />
              </svg>
            </IconButton>
            <IconButton onClick={onDelete} ariaLabel={`Delete ${set.exerciseName} set ${number}`} title="Delete" className={styles.delete}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4M13 4v9.33a1.33 1.33 0 01-1.33 1.34H4.33A1.33 1.33 0 013 13.33V4" />
              </svg>
            </IconButton>
          </div>
        </div>
      </div>
    </li>
  );
}
