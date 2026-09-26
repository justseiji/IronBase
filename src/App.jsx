import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppShell from './layout/AppShell';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import WorkoutLogPage from './pages/WorkoutLogPage/WorkoutLogPage';
import ExerciseHistoryPage from './pages/ExerciseHistoryPage/ExerciseHistoryPage';
import WorkoutHistoryPage from './pages/WorkoutHistoryPage/WorkoutHistoryPage';
import { getExercises } from './repositories/exerciseRepository';
import { getWorkouts, createWorkout, deleteWorkout } from './repositories/workoutRepository';
import { migrateLocalStorageToPGlite } from './database/migrateLocalStorage';
import { startSyncEngine } from './services/syncEngine';

export default function App() {
  const [exercises, setExercises] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from PGlite on mount
  useEffect(() => {
    async function loadData() {
      try {
        // Run migration from localStorage to PGlite (idempotent)
        await migrateLocalStorageToPGlite();
        
        // Fetch primary data from PGlite repositories
        const dbExercises = await getExercises();
        const dbWorkouts = await getWorkouts();
        
        setExercises(dbExercises);
        setWorkoutHistory(dbWorkouts);
      } catch (err) {
        console.error('[IronBase] Failed to load data from PGlite:', err);
      } finally {
        setIsLoaded(true);
        startSyncEngine();
      }
    }
    loadData();

    const handleDataUpdate = async () => {
      try {
        const dbExercises = await getExercises();
        const dbWorkouts = await getWorkouts();
        setExercises(dbExercises);
        setWorkoutHistory(dbWorkouts);
      } catch (err) {
        console.error('[IronBase] Failed to reload data on sync:', err);
      }
    };
    
    window.addEventListener('ironbase-data-updated', handleDataUpdate);
    return () => {
      window.removeEventListener('ironbase-data-updated', handleDataUpdate);
    };
  }, []);

  async function handleSaveWorkout(workout) {
    try {
      await createWorkout(workout);
      const dbWorkouts = await getWorkouts();
      setWorkoutHistory(dbWorkouts);
    } catch (err) {
      console.error('[IronBase] Failed to save workout:', err);
    }
  }

  async function handleDeleteWorkout(workoutId) {
    try {
      await deleteWorkout(workoutId);
      const dbWorkouts = await getWorkouts();
      setWorkoutHistory(dbWorkouts);
    } catch (err) {
      console.error('[IronBase] Failed to delete workout:', err);
    }
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
