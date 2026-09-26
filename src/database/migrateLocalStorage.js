import { getDb } from './db.js';

const LEGACY_STORAGE_KEY = 'ironbase-data';

/**
 * Migrates existing data from localStorage into PGlite.
 * Deletes the legacy localStorage key upon successful migration.
 */
export async function migrateLocalStorageToPGlite() {
  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return;

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error('[IronBase] Failed to parse legacy localStorage data', err);
    return;
  }

  // If already migrated or invalid shape, just remove it
  if (!data || data.migratedToPGlite || !Array.isArray(data.workoutHistory)) {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
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

  // Clean up obsolete localStorage to free space
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  console.log('[IronBase] Migration from localStorage to PGlite complete.');
}
