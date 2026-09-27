import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkoutHeader from '../../components/organisms/WorkoutHeader/WorkoutHeader';
import SetEntryPanel from '../../components/organisms/SetEntryPanel/SetEntryPanel';
import LoggedSetsList from '../../components/organisms/LoggedSetsList/LoggedSetsList';
import WorkoutActions from '../../components/organisms/WorkoutActions/WorkoutActions';
import FormGuide from '../../components/molecules/FormGuide/FormGuide';
import Toast from '../../components/molecules/Toast/Toast';
import formGuides from '../../data/formGuides';
import { cleanNumber } from '../../utils/numbers';
import { toLocalDateString } from '../../utils/dateFormatters';
import { draftKeyFor } from '../../utils/drafts';
import { newId } from '../../repositories/workoutRepository';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';
import { computeExercisePR, findPreviousSet, computeSetComparison } from '../../services/prService';
import styles from './WorkoutLogPage.module.css';

function readDraft(key) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : {};
  } catch (err) {
    console.error('Failed to parse draft from localStorage', err);
    return {};
  }
}

export default function WorkoutLogPage({ userId, exercises, workoutHistory = [], onSaveWorkout }) {
  const navigate = useNavigate();
  const draftKey = draftKeyFor(userId);
  const [draft] = useState(() => readDraft(draftKey));

  const [date, setDate] = useState(draft.date ?? toLocalDateString());
  const [sessionFocus, setSessionFocus] = useState(draft.sessionFocus ?? '');
  const [selectedExerciseId, setSelectedExerciseId] = useState(draft.selectedExerciseId ?? '');
  const [weight, setWeight] = useState(draft.weight ?? '');
  const [reps, setReps] = useState(draft.reps ?? '');
  const [rpe, setRpe] = useState(draft.rpe ?? '');
  const [loggedSets, setLoggedSets] = useState(() => (draft.loggedSets ?? []).map(s => ({ ...s, id: s.id || newId() })));
  const [editingId, setEditingId] = useState(null);
  const [flash, setFlash] = useState({ id: null, n: 0 });
  const [newPR, setNewPR] = useState(null);
  const [showFormGuide, setShowFormGuide] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saveError, setSaveError] = useState(null);
  const savedRef = useRef(false);

  // Persist draft on every change (until the workout is saved)
  useEffect(() => {
    if (savedRef.current) return;
    const next = { date, sessionFocus, selectedExerciseId, weight, reps, rpe, loggedSets };
    try {
      localStorage.setItem(draftKey, JSON.stringify(next));
    } catch {
      // Draft persistence is best-effort.
    }
  }, [draftKey, date, sessionFocus, selectedExerciseId, weight, reps, rpe, loggedSets]);

  const isEditing = editingId !== null;
  const hasFormGuide = !!formGuides[selectedExerciseId];

  const previousSet = useMemo(() => findPreviousSet(workoutHistory, selectedExerciseId), [workoutHistory, selectedExerciseId]);

  const currentPR = useMemo(
    () => computeExercisePR(workoutHistory, selectedExerciseId, loggedSets.filter(s => s.id !== editingId)),
    [workoutHistory, selectedExerciseId, loggedSets, editingId]
  );

  const comparison = useMemo(() => {
    if (!selectedExerciseId) return null;
    const text = computeSetComparison(previousSet, weight, reps);
    if (!text) return null;
    const diff = cleanNumber(weight) - cleanNumber(previousSet.weight);
    const repDiff = (Number(reps) || 0) - Number(previousSet.reps);
    const tone = diff > 0 || (diff === 0 && repDiff > 0) ? 'up' : diff < 0 ? 'down' : 'same';
    return { text, tone };
  }, [previousSet, weight, reps, selectedExerciseId]);

  const summary = useMemo(() => {
    const exerciseIds = new Set(loggedSets.map(s => s.exerciseId));
    const volume = loggedSets.reduce((sum, s) => sum + cleanNumber(s.weight) * Number(s.reps), 0);
    return { sets: loggedSets.length, exercises: exerciseIds.size, volume: cleanNumber(volume) };
  }, [loggedSets]);

  function resetInputs() {
    setWeight('');
    setReps('');
    setRpe('');
  }

  function handleAddSet() {
    if (!selectedExerciseId || !weight || Number(weight) <= 0 || !reps || Number(reps) <= 0) return;

    const exerciseName = exercises.find(e => e.id === selectedExerciseId)?.name || '';
    const w = cleanNumber(weight);
    const entry = {
      exerciseId: selectedExerciseId,
      exerciseName,
      weight: w,
      reps: Number(reps),
      rpe: rpe ? Number(rpe) : null,
    };

    if (w > currentPR && currentPR > 0) {
      setNewPR({ exerciseName, weight: w, reps: Number(reps), n: Date.now() });
    }

    if (isEditing) {
      setLoggedSets(prev => prev.map(s => (s.id === editingId ? { ...entry, id: s.id } : s)));
      setFlash(f => ({ id: editingId, n: f.n + 1 }));
      setEditingId(null);
    } else {
      setLoggedSets(prev => [...prev, { ...entry, id: newId() }]);
    }
    resetInputs();
  }

  function handleEditSet(id) {
    const set = loggedSets.find(s => s.id === id);
    if (!set) return;
    setSelectedExerciseId(set.exerciseId);
    setWeight(String(set.weight));
    setReps(String(set.reps));
    setRpe(set.rpe ? String(set.rpe) : '');
    setEditingId(id);
    document.getElementById('weight-input')?.focus({ preventScroll: true });
    document.getElementById('set-entry')?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  function handleDeleteSet(id) {
    setLoggedSets(prev => prev.filter(s => s.id !== id));
    if (editingId === id) {
      setEditingId(null);
      resetInputs();
    }
  }

  function handleCancelEdit() {
    setEditingId(null);
    resetInputs();
  }

  async function handleSaveWorkout() {
    if (loggedSets.length === 0 || !date || !sessionFocus || saveStatus !== 'idle') return;

    const workout = {
      id: newId(),
      date,
      sessionFocus,
      sets: loggedSets.map(({ id, exerciseId, weight, reps, rpe }) => ({ id, exerciseId, weight, reps, rpe })),
    };

    setSaveStatus('loading');
    setSaveError(null);
    try {
      await onSaveWorkout(workout);
    } catch (err) {
      console.error('[IronBase] Failed to save workout:', err);
      setSaveStatus('idle');
      setSaveError('Couldn’t save this workout. Your sets are still here — try again.');
      return;
    }

    savedRef.current = true;
    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    setSaveStatus('success');
    setTimeout(() => {
      navigate('/', { state: { savedWorkout: { sessionFocus, setCount: workout.sets.length } } });
    }, prefersReducedMotion() ? 150 : 650);
  }

  const canSave = loggedSets.length > 0 && date && sessionFocus;
  const missing = loggedSets.length === 0 ? 'Add at least one set to save.' : !sessionFocus ? 'Choose a session focus to save.' : null;

  return (
    <div className={styles.page}>
      {newPR && (
        <Toast key={newPR.n} title="New best" tone="highlight" duration={3000}>
          {newPR.exerciseName} — {newPR.weight} lbs × {newPR.reps}
        </Toast>
      )}

      <WorkoutHeader
        date={date}
        onDateChange={e => setDate(e.target.value)}
        sessionFocus={sessionFocus}
        onSessionFocusChange={setSessionFocus}
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

      <LoggedSetsList
        sets={loggedSets}
        summary={summary}
        onEditSet={handleEditSet}
        onDeleteSet={handleDeleteSet}
        editingId={editingId}
        flash={flash}
      />

      <WorkoutActions
        onSave={handleSaveWorkout}
        disabled={!canSave}
        status={saveStatus}
        hint={saveError || (saveStatus === 'idle' ? missing : null)}
        isError={!!saveError}
      />

      <FormGuide
        exerciseId={selectedExerciseId}
        isOpen={showFormGuide}
        onClose={() => setShowFormGuide(false)}
      />
    </div>
  );
}
