import ExerciseSelector from '../../molecules/ExerciseSelector/ExerciseSelector';
import SetInputRow from '../../molecules/SetInputRow/SetInputRow';
import styles from './SetEntryPanel.module.css';

export default function SetEntryPanel({ exercises, selectedExerciseId, onSelectExercise, weight, onWeightChange, reps, onRepsChange, rpe, onRpeChange, onAddSet, isEditing, onCancelEdit }) {
  return (
    <div className={styles.panel}>
      <ExerciseSelector
        exercises={exercises}
        selectedExerciseId={selectedExerciseId}
        onSelectExercise={onSelectExercise}
      />
      <SetInputRow
        weight={weight}
        onWeightChange={onWeightChange}
        reps={reps}
        onRepsChange={onRepsChange}
        rpe={rpe}
        onRpeChange={onRpeChange}
        onAddSet={onAddSet}
        isEditing={isEditing}
        onCancelEdit={onCancelEdit}
      />
    </div>
  );
}
