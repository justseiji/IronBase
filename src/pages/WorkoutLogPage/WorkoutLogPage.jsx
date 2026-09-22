import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkoutHeader from '../../components/organisms/WorkoutHeader/WorkoutHeader';
import SetEntryPanel from '../../components/organisms/SetEntryPanel/SetEntryPanel';
import LoggedSetsList from '../../components/organisms/LoggedSetsList/LoggedSetsList';
import WorkoutActions from '../../components/organisms/WorkoutActions/WorkoutActions';
import styles from './WorkoutLogPage.module.css';

function getTodayString() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export default function WorkoutLogPage({ exercises, onSaveWorkout }) {
  const navigate = useNavigate();

  const [date, setDate] = useState(getTodayString());
  const [sessionFocus, setSessionFocus] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [loggedSets, setLoggedSets] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  const isEditing = editingIndex !== null;

  function handleAddSet() {
    if (!selectedExerciseId || !weight || Number(weight) <= 0 || !reps || Number(reps) <= 0) return;

    const exerciseName = exercises.find(e => e.id === selectedExerciseId)?.name || '';

    const newSet = {
      id: crypto.randomUUID ? crypto.randomUUID() : `set-${Date.now()}-${Math.random()}`,
      exerciseId: selectedExerciseId,
      exerciseName,
      weight: Number(weight),
      reps: Number(reps),
      rpe: rpe ? Number(rpe) : null,
    };

    if (isEditing) {
      setLoggedSets(prev => prev.map((s, i) => i === editingIndex ? { ...newSet, id: s.id } : s));
      setEditingIndex(null);
    } else {
      setLoggedSets(prev => [...prev, newSet]);
    }

    // Reset inputs but keep exercise selected
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
        exerciseId,
        weight,
        reps,
        rpe,
      })),
    };

    onSaveWorkout(workout);
    navigate('/');
  }

  const canSave = loggedSets.length > 0 && date && sessionFocus;

  return (
    <div className={styles.page}>
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
    </div>
  );
}
