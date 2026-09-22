import NumberInput from '../../atoms/NumberInput/NumberInput';
import Button from '../../atoms/Button/Button';
import styles from './SetInputRow.module.css';

export default function SetInputRow({ weight, onWeightChange, reps, onRepsChange, rpe, onRpeChange, onAddSet, isEditing = false, onCancelEdit }) {
  return (
    <div className={styles.row}>
      <div className={styles.inputs}>
        <NumberInput
          id="weight-input"
          label="Weight (lbs)"
          value={weight}
          onChange={onWeightChange}
          min={0}
          step={2.5}
          placeholder="0"
        />
        <NumberInput
          id="reps-input"
          label="Reps"
          value={reps}
          onChange={onRepsChange}
          min={1}
          max={100}
          step={1}
          placeholder="0"
        />
        <NumberInput
          id="rpe-input"
          label="RPE"
          value={rpe}
          onChange={onRpeChange}
          min={1}
          max={10}
          step={0.5}
          placeholder="7"
        />
      </div>
      <div className={styles.actions}>
        <Button variant="primary" onClick={onAddSet} fullWidth>
          {isEditing ? 'Update Set' : 'Add Set'}
        </Button>
        {isEditing && (
          <Button variant="secondary" onClick={onCancelEdit}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
