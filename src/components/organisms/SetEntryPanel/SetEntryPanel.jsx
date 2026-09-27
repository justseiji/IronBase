import ExerciseSelector from '../../molecules/ExerciseSelector/ExerciseSelector';
import SetInputRow from '../../molecules/SetInputRow/SetInputRow';
import { cleanNumber } from '../../../utils/numbers';
import styles from './SetEntryPanel.module.css';

export default function SetEntryPanel({ exercises, selectedExerciseId, onSelectExercise, weight, onWeightChange, reps, onRepsChange, rpe, onRpeChange, onAddSet, isEditing, onCancelEdit, previousSet, comparison, hasFormGuide, onOpenFormGuide }) {
  return (
    <section
      id="set-entry"
      className={`${styles.panel} ${isEditing ? styles.editing : ''} motion-slide-up`}
      style={{ '--i': 2 }}
      aria-label={isEditing ? 'Edit set' : 'Add a set'}
    >
      <div className={styles.topRow}>
        <span className={styles.panelTitle}>{isEditing ? 'Editing set' : 'New set'}</span>
        {hasFormGuide && selectedExerciseId && (
          <button className={styles.formGuideLink} onClick={onOpenFormGuide} type="button">
            Form guide
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5" /></svg>
          </button>
        )}
      </div>

      <ExerciseSelector
        exercises={exercises}
        selectedExerciseId={selectedExerciseId}
        onSelectExercise={onSelectExercise}
      />

      <div className={`${styles.reveal} ${previousSet ? styles.revealOpen : ''}`}>
        <div className={styles.revealInner}>
          {previousSet && (
            <div key={selectedExerciseId} className={styles.previousSession}>
              <span className={styles.prevLabel}>Previous session</span>
              <span className={styles.prevValue}>
                {cleanNumber(previousSet.weight)} lbs × {cleanNumber(previousSet.reps)}{previousSet.rpe ? ` @ RPE ${cleanNumber(previousSet.rpe)}` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

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

      <div className={styles.comparisonSlot} aria-live="polite">
        {comparison && (
          <span key={comparison.text} className={`${styles.comparison} ${styles[comparison.tone]}`}>
            {comparison.text}
          </span>
        )}
      </div>
    </section>
  );
}
