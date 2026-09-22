import Select from '../../atoms/Select/Select';
import styles from './ExerciseSelector.module.css';

export default function ExerciseSelector({ exercises, selectedExerciseId, onSelectExercise }) {
  const options = exercises.map(ex => ({
    value: ex.id,
    label: ex.name,
  }));

  return (
    <div className={styles.selector}>
      <Select
        id="exercise-select"
        label="Exercise"
        value={selectedExerciseId}
        onChange={onSelectExercise}
        options={options}
        placeholder="Choose exercise…"
      />
    </div>
  );
}
