import TextInput from '../../atoms/TextInput/TextInput';
import Select from '../../atoms/Select/Select';
import styles from './WorkoutMetaFields.module.css';

const sessionOptions = [
  { value: 'Push', label: 'Push' },
  { value: 'Pull', label: 'Pull' },
  { value: 'Legs', label: 'Legs' },
  { value: 'Upper', label: 'Upper' },
  { value: 'Lower', label: 'Lower' },
  { value: 'Full Body', label: 'Full Body' },
];

export default function WorkoutMetaFields({ date, onDateChange, sessionFocus, onSessionFocusChange }) {
  return (
    <div className={styles.fields}>
      <TextInput
        id="workout-date"
        label="Date"
        type="date"
        value={date}
        onChange={onDateChange}
      />
      <Select
        id="session-focus"
        label="Session Focus"
        value={sessionFocus}
        onChange={onSessionFocusChange}
        options={sessionOptions}
        placeholder="Choose focus…"
      />
    </div>
  );
}
