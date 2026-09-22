import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkoutHeader from '../../components/organisms/WorkoutHeader/WorkoutHeader';
import SetEntryPanel from '../../components/organisms/SetEntryPanel/SetEntryPanel';
import LoggedSetsList from '../../components/organisms/LoggedSetsList/LoggedSetsList';
import WorkoutActions from '../../components/organisms/WorkoutActions/WorkoutActions';
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

  const isEditing = editingIndex !== null;

  // Find previous session's best set for selected exercise
  const previousSet = useMemo(() => {
    if (!selectedExerciseId) return null;
    // Get all sets for this exercise across history, grouped by date
    const sessions = {};
    workoutHistory.forEach(w => {
      w.sets.forEach(s => {
        if (s.exerciseId === selectedExerciseId) {
          if (!sessions[w.date]) sessions[w.date] = [];
          sessions[w.date].push(s);
        }
      });
    });
    const dates = Object.keys(sessions).sort();
    if (dates.length === 0) return null;
    const lastDate = dates[dates.length - 1];
    const lastSets = sessions[lastDate];
    // Return the heaviest set from the most recent session
    return lastSets.reduce((best, s) => {
      if (!best || Number(s.weight) > Number(best.weight)) return s;
      return best;
    }, null);
  }, [workoutHistory, selectedExerciseId]);

  // Compute PR for selected exercise (heaviest weight ever logged in history)
  const currentPR = useMemo(() => {
    if (!selectedExerciseId) return 0;
    let max = 0;
    workoutHistory.forEach(w => {
      w.sets.forEach(s => {
        if (s.exerciseId === selectedExerciseId && Number(s.weight) > max) {
          max = Number(s.weight);
        }
      });
    });
    // Also check current session logged sets
    loggedSets.forEach(s => {
      if (s.exerciseId === selectedExerciseId && s.weight > max) {
        max = s.weight;
      }
    });
    return max;
  }, [workoutHistory, selectedExerciseId, loggedSets]);

  // Comparison text
  const comparison = useMemo(() => {
    if (!previousSet || !weight || !selectedExerciseId) return null;
    const w = Number(weight);
    const r = Number(reps) || 0;
    const prevW = Number(previousSet.weight);
    const prevR = Number(previousSet.reps);
    if (w <= 0) return null;

    const parts = [];
    if (w > prevW) parts.push(`+${w - prevW} lbs from previous`);
    else if (w < prevW) parts.push(`${w - prevW} lbs from previous`);
    else parts.push('Same weight');

    if (r > 0 && prevR > 0) {
      if (r > prevR) parts.push(`+${r - prevR} rep${r - prevR !== 1 ? 's' : ''}`);
      else if (r < prevR) parts.push(`${r - prevR} rep${Math.abs(r - prevR) !== 1 ? 's' : ''}`);
    }

    return parts.join(' · ');
  }, [previousSet, weight, reps, selectedExerciseId]);

  function handleAddSet() {
    if (!selectedExerciseId || !weight || Number(weight) <= 0 || !reps || Number(reps) <= 0) return;

    const exerciseName = exercises.find(e => e.id === selectedExerciseId)?.name || '';
    const w = Number(weight);

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
