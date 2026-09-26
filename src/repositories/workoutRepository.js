import { getDb } from '../database/db.js';

/**
 * Retrieve all active workouts and their associated sets.
 * 
 * @returns {Promise<Array>} Array of workout objects with embedded sets
 */
export async function getWorkouts() {
  const db = await getDb();
  
  // Fetch workouts
  const workoutsRes = await db.query(`
    SELECT id, date, session_focus 
    FROM workouts 
    WHERE deleted_at IS NULL 
    ORDER BY date DESC, created_at DESC
  `);
  
  // Fetch all sets for undeleted workouts
  const setsRes = await db.query(`
    SELECT ls.id, ls.workout_id, ls.exercise_id, ls.weight, ls.reps, ls.rpe, e.name as exercise_name
    FROM logged_sets ls
    JOIN exercises e ON ls.exercise_id = e.id
    WHERE ls.deleted_at IS NULL 
      AND ls.workout_id IN (SELECT id FROM workouts WHERE deleted_at IS NULL)
    ORDER BY ls.set_order ASC, ls.created_at ASC
  `);

  // Group sets by workout ID
  const setsByWorkout = {};
  for (const row of setsRes.rows) {
    if (!setsByWorkout[row.workout_id]) setsByWorkout[row.workout_id] = [];
    setsByWorkout[row.workout_id].push({
      id: row.id,
      exerciseId: row.exercise_id,
      exerciseName: row.exercise_name,
      weight: row.weight,
      reps: row.reps,
      rpe: row.rpe
    });
  }

  // Combine workouts with their sets
  return workoutsRes.rows.map(row => {
    // Format date properly: PGlite date types may be returned as Date objects or strings
    let formattedDate = row.date;
    if (row.date instanceof Date) {
      formattedDate = row.date.toISOString().split('T')[0];
    } else if (typeof row.date === 'string' && row.date.includes('T')) {
      formattedDate = row.date.split('T')[0];
    }

    return {
      id: row.id,
      date: formattedDate,
      sessionFocus: row.session_focus,
      sets: setsByWorkout[row.id] || []
    };
  });
}

/**
 * Save a new workout along with its sets.
 * 
 * @param {Object} workout - The workout object to save
 * @returns {Promise<void>}
 */
export async function createWorkout(workout) {
  const db = await getDb();
  
  await db.transaction(async (tx) => {
    // Insert workout
    await tx.query(
      `INSERT INTO workouts (id, date, session_focus)
       VALUES ($1, $2, $3)`,
      [workout.id, workout.date, workout.sessionFocus]
    );

    // Insert sets
    for (let i = 0; i < workout.sets.length; i++) {
      const set = workout.sets[i];
      const setId = set.id || (crypto && crypto.randomUUID ? crypto.randomUUID() : \`set-\${Date.now()}-\${Math.random()}\`);
      await tx.query(
        `INSERT INTO logged_sets (id, workout_id, exercise_id, weight, reps, rpe, set_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [setId, workout.id, set.exerciseId, set.weight, set.reps, set.rpe || null, i]
      );
    }
  });
}

/**
 * Soft delete a workout and its associated sets.
 * 
 * @param {string} id - The workout ID to delete
 * @returns {Promise<void>}
 */
export async function deleteWorkout(id) {
  const db = await getDb();
  
  await db.transaction(async (tx) => {
    await tx.query(
      'UPDATE workouts SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
      [id]
    );
    await tx.query(
      'UPDATE logged_sets SET deleted_at = NOW(), updated_at = NOW() WHERE workout_id = $1',
      [id]
    );
  });
}
