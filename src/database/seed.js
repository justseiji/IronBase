/**
 * Seed default exercises into PGlite.
 * Never overwrites existing data — only inserts if the exercise doesn't already exist.
 */

const DEFAULT_EXERCISES = [
  { id: 'ex-1', name: 'Squat', muscleGroup: 'Legs' },
  { id: 'ex-2', name: 'Bench Press', muscleGroup: 'Chest' },
  { id: 'ex-3', name: 'Deadlift', muscleGroup: 'Back' },
  { id: 'ex-4', name: 'Overhead Press', muscleGroup: 'Shoulders' },
  { id: 'ex-5', name: 'Barbell Row', muscleGroup: 'Back' },
];

/**
 * Seed the default exercises into the database.
 * Uses INSERT ... ON CONFLICT DO NOTHING to avoid overwriting existing data.
 *
 * @param {import('@electric-sql/pglite').PGlite} db - PGlite instance
 */
export async function seedDefaultExercises(db) {
  for (const ex of DEFAULT_EXERCISES) {
    await db.query(
      `INSERT INTO exercises (id, name, muscle_group, is_default)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (id) DO NOTHING`,
      [ex.id, ex.name, ex.muscleGroup]
    );
  }
}
