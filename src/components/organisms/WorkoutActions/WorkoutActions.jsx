import Button from '../../atoms/Button/Button';
import styles from './WorkoutActions.module.css';

export default function WorkoutActions({ onSave, disabled = false }) {
  return (
    <div className={styles.actions}>
      <Button variant="primary" onClick={onSave} disabled={disabled} fullWidth>
        Save Workout
      </Button>
    </div>
  );
}
