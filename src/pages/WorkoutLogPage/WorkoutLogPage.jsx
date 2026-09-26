import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkoutHeader from '../../components/organisms/WorkoutHeader/WorkoutHeader';
import SetEntryPanel from '../../components/organisms/SetEntryPanel/SetEntryPanel';
import LoggedSetsList from '../../components/organisms/LoggedSetsList/LoggedSetsList';
import WorkoutActions from '../../components/organisms/WorkoutActions/WorkoutActions';
import FormGuide from '../../components/molecules/FormGuide/FormGuide';
import formGuides from '../../data/formGuides';
import { cleanNumber } from '../../utils/numbers';
import { computeExercisePR, findPreviousSet, computeSetComparison } from '../../services/prService';
import styles from './WorkoutLogPage.module.css';

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

export default function WorkoutLogPage({ exercises, workoutHistory = [], onSaveWorkout }) {
  const navigate = useNavigate();

  const [date, setDate] = useState(getTodayString());
  const [sessionFocus, setSessionFocus] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [loggedSets, setLoggedSets] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newPR, setNewPR] = useState(null);
  const [showFormGuide, setShowFormGuide] = useState(false);

  const isEditing = editingIndex !== null;
  const hasFormGuide = !!formGuides[selectedExerciseId];

  // Find previous session's best set for selected exercise
  const previousSet = useMemo(() => {
    return findPreviousSet(workoutHistory, selectedExerciseId);
  }, [workoutHistory, selectedExerciseId]);

  // Compute PR for selected exercise (heaviest weight ever logged in history)
  const currentPR = useMemo(() => {
    return computeExercisePR(workoutHistory, selectedExerciseId, loggedSets);
  }, [workoutHistory, selectedExerciseId, loggedSets]);

  // Comparison text
  const comparison = useMemo(() => {
    if (!selectedExerciseId) return null;
    return computeSetComparison(previousSet, weight, reps);
  }, [previousSet, weight, reps, selectedExerciseId]);

  function handleAddSet() {
    if (!selectedExerciseId || !weight || Number(weight) <= 0 || !reps || Number(reps) <= 0) return;

    const exerciseName = exercises.find(e => e.id === selectedExerciseId)?.name || '';
    const w = cleanNumber(weight);

    const newSet = {
      id: crypto.randomUUID ? crypto.randomUUID() : `set-${Date.now()}-${Math.random()}`,
      exerciseId: selectedExerciseId,
      exerciseName,
      weight: w,
      reps: Number(reps),
      rpe: rpe ? Number(rpe) : null,
    };

    // Check for PR
    if (w > currentPR && currentPR > 0) {
      setNewPR({ exerciseName, weight: w, reps: Number(reps) });
      setTimeout(() => setNewPR(null), 3000);
    }

    if (isEditing) {
      setLoggedSets(prev => prev.map((s, i) => i === editingIndex ? { ...newSet, id: s.id } : s));
      setEditingIndex(null);
    } else {
      setLoggedSets(prev => [...prev, newSet]);
    }

    setWeight('');
    setReps('');
    setRpe('');
  }

  function handleEditSet(index) {
    const set = loggedSets[index];
    setSelectedExerciseId(set.exerciseId);
    setWeight(String(set.weight));
    setReps(String(set.reps));
    setRpe(set.rpe ? String(set.rpe) : '');
    setEditingIndex(index);
  }

  function handleDeleteSet(index) {
    setLoggedSets(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setWeight('');
      setReps('');
      setRpe('');
    }
  }

  function handleCancelEdit() {
    setEditingIndex(null);
    setWeight('');
    setReps('');
    setRpe('');
  }

  function handleSaveWorkout() {
    if (loggedSets.length === 0 || !date || !sessionFocus) return;

    const workout = {
      id: crypto.randomUUID ? crypto.randomUUID() : `workout-${Date.now()}`,
      date,
      sessionFocus,
      sets: loggedSets.map(({ exerciseId, weight, reps, rpe }) => ({
        exerciseId, weight, reps, rpe,
      })),
    };

    onSaveWorkout(workout);
    navigate('/');
  }

  const canSave = loggedSets.length > 0 && date && sessionFocus;

  return (
    <div className={styles.page}>
      {/* PR Toast */}
      {newPR && (
        <div className={styles.prToast}>
          <span className={styles.prToastLabel}>New Best</span>
          <span className={styles.prToastValue}>{newPR.exerciseName} — {newPR.weight} lbs × {newPR.reps}</span>
        </div>
      )}

      <WorkoutHeader
        date={date}
        onDateChange={e => setDate(e.target.value)}
        sessionFocus={sessionFocus}
        onSessionFocusChange={e => setSessionFocus(e.target.value)}
      />

      <SetEntryPanel
        exercises={exercises}
        selectedExerciseId={selectedExerciseId}
        onSelectExercise={e => setSelectedExerciseId(e.target.value)}
        weight={weight}
        onWeightChange={e => setWeight(e.target.value)}
        reps={reps}
        onRepsChange={e => setReps(e.target.value)}
        rpe={rpe}
        onRpeChange={e => setRpe(e.target.value)}
        onAddSet={handleAddSet}
        isEditing={isEditing}
        onCancelEdit={handleCancelEdit}
        previousSet={previousSet}
        comparison={comparison}
        hasFormGuide={hasFormGuide}
        onOpenFormGuide={() => setShowFormGuide(true)}
      />

      <div className={styles.logSection}>
        <LoggedSetsList
          sets={loggedSets}
          onEditSet={handleEditSet}
          onDeleteSet={handleDeleteSet}
          editingIndex={editingIndex}
        />
      </div>

      <WorkoutActions onSave={handleSaveWorkout} disabled={!canSave} />

      <FormGuide
        exerciseId={selectedExerciseId}
        isOpen={showFormGuide}
        onClose={() => setShowFormGuide(false)}
      />
    </div>
  );
}
