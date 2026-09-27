import TextInput from '../../atoms/TextInput/TextInput';
import Label from '../../atoms/Label/Label';
import ExerciseChips from '../ExerciseChips/ExerciseChips';
import styles from './WorkoutMetaFields.module.css';

const SESSION_OPTIONS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body'].map(v => ({ id: v, name: v }));

export default function WorkoutMetaFields({ date, onDateChange, sessionFocus, onSessionFocusChange }) {
  return (
    <div className={styles.fields}>
      <TextInput
        id="workout-date"
        label="Date"
        type="date"
        value={date}
        onChange={onDateChange}
        className={styles.date}
      />
      <div className={styles.focus}>
        <Label>Session Focus</Label>
        <ExerciseChips
          exercises={SESSION_OPTIONS}
          selectedId={sessionFocus}
          onSelect={onSessionFocusChange}
          label="Session focus"
        />
      </div>
    </div>
  );
}
