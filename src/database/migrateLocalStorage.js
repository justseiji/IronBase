import { loadIronBaseData, saveIronBaseData } from '../utils/storage.js';
import { getDb } from './db.js';

/**
 * Migrates existing data from localStorage into PGlite.
 * Ensures data is only migrated once by checking a flag in localStorage.
 */
export async function migrateLocalStorageToPGlite() {
  const data = loadIronBaseData();
  
  // If already migrated or no data to migrate, skip
  if (!data || data.migratedToPGlite) {
    return;
  }

  console.log('[IronBase] Migrating localStorage data to PGlite...');
  const db = await getDb();

  await db.transaction(async (tx) => {
    // Migrate Exercises (if any custom ones were added, though default is currently hardcoded)
    if (data.exercises && data.exercises.length > 0) {
      for (const ex of data.exercises) {
        await tx.query(
          `INSERT INTO exercises (id, name, muscle_group, is_default)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO NOTHING`,
          [ex.id, ex.name, ex.muscleGroup, false]
        );
      }
    }

    // Migrate Workouts and Sets
    if (data.workoutHistory && data.workoutHistory.length > 0) {
      for (const w of data.workoutHistory) {
        // Insert workout if not exists
        await tx.query(
          `INSERT INTO workouts (id, date, session_focus)
           VALUES ($1, $2, $3)
           ON CONFLICT (id) DO NOTHING`,
          [w.id, w.date, w.sessionFocus]
        );

        // Insert sets for the workout
        if (w.sets && w.sets.length > 0) {
          for (let i = 0; i < w.sets.length; i++) {
            const s = w.sets[i];
            const setId = s.id || (crypto && crypto.randomUUID ? crypto.randomUUID() : `set-${Date.now()}-${Math.random()}`);
            await tx.query(
              `INSERT INTO logged_sets (id, workout_id, exercise_id, weight, reps, rpe, set_order)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (id) DO NOTHING`,
              [setId, w.id, s.exerciseId, s.weight, s.reps, s.rpe || null, i]
            );
          }
        }
      }
    }
  });

  // Mark as migrated
  data.migratedToPGlite = true;
  saveIronBaseData(data);
  console.log('[IronBase] Migration from localStorage to PGlite complete.');
}
