import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppShell from './layout/AppShell';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import WorkoutLogPage from './pages/WorkoutLogPage/WorkoutLogPage';
import ExerciseHistoryPage from './pages/ExerciseHistoryPage/ExerciseHistoryPage';
import WorkoutHistoryPage from './pages/WorkoutHistoryPage/WorkoutHistoryPage';
import { loadIronBaseData, saveIronBaseData } from './utils/storage';
import defaultExercises from './data/defaultExercises';

export default function App() {
  const [exercises, setExercises] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted data on mount
  useEffect(() => {
    const saved = loadIronBaseData();
    if (saved) {
      setExercises(saved.exercises);
      setWorkoutHistory(saved.workoutHistory);
    } else {
      setExercises(defaultExercises);
      setWorkoutHistory([]);
    }
    setIsLoaded(true);
  }, []);

  // Persist whenever exercises or workoutHistory change (after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    saveIronBaseData({ exercises, workoutHistory });
  }, [exercises, workoutHistory, isLoaded]);

  function handleSaveWorkout(workout) {
    setWorkoutHistory(prev => [...prev, workout]);
  }

  function handleDeleteWorkout(workoutId) {
    setWorkoutHistory(prev => prev.filter(w => w.id !== workoutId));
  }

  // Don't render until data is loaded to prevent flash of empty state
  if (!isLoaded) return null;

  return (
    <AppShell>
      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              exercises={exercises}
              workoutHistory={workoutHistory}
            />
          }
        />
        <Route
          path="/log"
          element={
            <WorkoutLogPage
              exercises={exercises}
              workoutHistory={workoutHistory}
              onSaveWorkout={handleSaveWorkout}
            />
          }
        />
        <Route
          path="/exercise-history"
          element={
            <ExerciseHistoryPage
              exercises={exercises}
              workoutHistory={workoutHistory}
            />
          }
        />
        <Route
          path="/workout-history"
          element={
            <WorkoutHistoryPage
              exercises={exercises}
              workoutHistory={workoutHistory}
              onDeleteWorkout={handleDeleteWorkout}
            />
          }
        />
      </Routes>
    </AppShell>
  );
}
