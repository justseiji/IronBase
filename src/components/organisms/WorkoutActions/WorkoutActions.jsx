import Button from '../../atoms/Button/Button';
import styles from './WorkoutActions.module.css';

export default function WorkoutActions({ onSave, disabled = false, status = 'idle', hint, isError = false }) {
  const label = status === 'success' ? 'Workout saved' : 'Save Workout';
  return (
    <div className={`${styles.actions} motion-slide-up`} style={{ '--i': 4 }}>
      <Button variant="primary" size="lg" onClick={onSave} disabled={disabled && status === 'idle'} fullWidth status={status}>
        {label}
      </Button>
      <p className={`${styles.hint} ${isError ? styles.error : ''}`} aria-live="polite">
        {status === 'success' ? <span className="visually-hidden">Workout saved</span> : hint}
      </p>
    </div>
  );
}
