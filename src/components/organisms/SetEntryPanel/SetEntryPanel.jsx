import ExerciseSelector from '../../molecules/ExerciseSelector/ExerciseSelector';
import SetInputRow from '../../molecules/SetInputRow/SetInputRow';
import { cleanNumber } from '../../../utils/numbers';
import styles from './SetEntryPanel.module.css';

export default function SetEntryPanel({ exercises, selectedExerciseId, onSelectExercise, weight, onWeightChange, reps, onRepsChange, rpe, onRpeChange, onAddSet, isEditing, onCancelEdit, previousSet, comparison, hasFormGuide, onOpenFormGuide }) {
  return (
    <div className={styles.panel}>
      <ExerciseSelector
        exercises={exercises}
        selectedExerciseId={selectedExerciseId}
        onSelectExercise={onSelectExercise}
      />

      {hasFormGuide && selectedExerciseId && (
        <button
          className={styles.formGuideLink}
          onClick={onOpenFormGuide}
          type="button"
        >
          Form Guide →
        </button>
      )}

      {previousSet && (
        <div className={styles.previousSession}>
          <span className={styles.prevLabel}>Previous session</span>
          <span className={styles.prevValue}>
            {cleanNumber(previousSet.weight)} lbs × {cleanNumber(previousSet.reps)}{previousSet.rpe ? ` @ RPE ${cleanNumber(previousSet.rpe)}` : ''}
          </span>
        </div>
      )}

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

      {comparison && (
        <div className={styles.comparison}>
          {comparison}
        </div>
      )}
    </div>
  );
}
