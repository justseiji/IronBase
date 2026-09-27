import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppShell from './layout/AppShell';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import WorkoutLogPage from './pages/WorkoutLogPage/WorkoutLogPage';
import ExerciseHistoryPage from './pages/ExerciseHistoryPage/ExerciseHistoryPage';
import WorkoutHistoryPage from './pages/WorkoutHistoryPage/WorkoutHistoryPage';
import AuthPage from './pages/AuthPage/AuthPage';
import PageSkeleton from './layout/PageSkeleton';
import { useAuth } from './auth/useAuth';
import { openUserDb } from './database/db';
import { adoptLegacyData } from './database/adoptLegacyData';
import { getExercises } from './repositories/exerciseRepository';
import { getWorkouts, createWorkout, deleteWorkout } from './repositories/workoutRepository';
import { startSyncEngine, stopSyncEngine, syncNow } from './services/syncEngine';

const INITIAL_SYNC_TIMEOUT_MS = 8000;

function Workspace({ user }) {
  const [exercises, setExercises] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [phase, setPhase] = useState('loading'); // 'loading' | 'ready' | 'failed'
  const [isFirstSync, setIsFirstSync] = useState(false);

  const reload = useCallback(async () => {
    const [dbExercises, dbWorkouts] = await Promise.all([getExercises(), getWorkouts()]);
    setExercises(dbExercises);
    setWorkoutHistory(dbWorkouts);
    return dbWorkouts;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      await openUserDb(user.id);
      await adoptLegacyData(user.id);
      if (cancelled) return;
      startSyncEngine();

      let workouts = await getWorkouts();
      if (workouts.length === 0 && navigator.onLine) {
        // A fresh device: wait briefly for the account's data to arrive before
        // showing an empty dashboard.
        if (!cancelled) setIsFirstSync(true);
        await Promise.race([syncNow(), new Promise(r => setTimeout(r, INITIAL_SYNC_TIMEOUT_MS))]);
      } else {
        syncNow();
      }
      if (cancelled) return;
      await reload();
      if (!cancelled) setPhase('ready');
    }

    boot().catch(err => {
      console.error('[IronBase] Failed to open local data:', err);
      if (!cancelled) setPhase('failed');
    });

    const handleDataUpdate = () => {
      reload().catch(err => console.error('[IronBase] Failed to reload data on sync:', err));
    };
    window.addEventListener('ironbase-data-updated', handleDataUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener('ironbase-data-updated', handleDataUpdate);
      stopSyncEngine();
    };
  }, [user.id, reload]);

  const handleSaveWorkout = useCallback(async (workout) => {
    await createWorkout(workout);
    await reload();
    syncNow();
  }, [reload]);

  const handleDeleteWorkout = useCallback(async (workoutId) => {
    try {
      await deleteWorkout(workoutId);
      await reload();
      syncNow();
    } catch (err) {
      console.error('[IronBase] Failed to delete workout:', err);
    }
  }, [reload]);

  let content;
  if (phase === 'loading') {
    content = <PageSkeleton message={isFirstSync ? 'Syncing your workouts…' : null} />;
  } else if (phase === 'failed') {
    content = <PageSkeleton error="IronBase couldn’t open this device’s workout data. Reload to try again." />;
  } else {
    content = (
      <Routes>
        <Route path="/" element={<DashboardPage exercises={exercises} workoutHistory={workoutHistory} />} />
        <Route
          path="/log"
          element={<WorkoutLogPage userId={user.id} exercises={exercises} workoutHistory={workoutHistory} onSaveWorkout={handleSaveWorkout} />}
        />
        <Route path="/exercise-history" element={<ExerciseHistoryPage exercises={exercises} workoutHistory={workoutHistory} />} />
        <Route
          path="/workout-history"
          element={<WorkoutHistoryPage exercises={exercises} workoutHistory={workoutHistory} onDeleteWorkout={handleDeleteWorkout} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return <AppShell>{content}</AppShell>;
}

export default function App() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'checking') {
    return <div className="launch" aria-busy="true" />;
  }

  if (status === 'signedOut') {
    if (location.pathname !== '/auth') {
      return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
    }
    return <AuthPage />;
  }

  if (location.pathname === '/auth') {
    return <Navigate to={location.state?.from || '/'} replace />;
  }

  return <Workspace key={user.id} user={user} />;
}
