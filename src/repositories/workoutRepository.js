import { getDb } from '../database/db.js';

export function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * PGlite may return DATE columns as Date objects (UTC midnight) or strings.
 */
export function normalizeDate(value) {
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (typeof value === 'string' && value.includes('T')) return value.split('T')[0];
  return value;
}

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

  return workoutsRes.rows.map(row => ({
    id: row.id,
    date: normalizeDate(row.date),
    sessionFocus: row.session_focus,
    sets: setsByWorkout[row.id] || []
  }));
}

async function insertWorkout(tx, workout) {
  const sets = workout.sets.map(set => ({
    id: set.id || newId(),
    exerciseId: set.exerciseId,
    weight: set.weight,
    reps: set.reps,
    rpe: set.rpe ?? null,
  }));

  await tx.query(
    `INSERT INTO workouts (id, date, session_focus)
     VALUES ($1, $2, $3)`,
    [workout.id, workout.date, workout.sessionFocus]
  );

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    await tx.query(
      `INSERT INTO logged_sets (id, workout_id, exercise_id, weight, reps, rpe, set_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [set.id, workout.id, set.exerciseId, set.weight, set.reps, set.rpe || null, i]
    );
  }

  // The queued payload must carry the same set ids the server will store.
  const payload = { id: workout.id, date: workout.date, sessionFocus: workout.sessionFocus, sets };
  await tx.query(
    `INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, status)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [newId(), 'workout', workout.id, 'UPSERT', JSON.stringify(payload), 'pending']
  );
}

/**
 * Save a new workout along with its sets.
 *
 * @param {Object} workout - The workout object to save
 * @returns {Promise<void>}
 */
export async function createWorkout(workout) {
  const db = await getDb();
  await db.transaction(tx => insertWorkout(tx, workout));
}

/**
 * Adopt workouts from another local source (e.g. the pre-accounts database)
 * into the signed-in account. Fresh ids are assigned so they never collide
 * with rows already in the cloud.
 */
export async function importWorkouts(workouts) {
  const db = await getDb();
  await db.transaction(async (tx) => {
    for (const w of workouts) {
      await insertWorkout(tx, {
        id: newId(),
        date: normalizeDate(w.date),
        sessionFocus: w.sessionFocus,
        sets: w.sets.map(s => ({ ...s, id: newId() })),
      });
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

    await tx.query(
      `INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [newId(), 'workout', id, 'DELETE', null, 'pending']
    );
  });
}

/**
 * Number of local changes not yet confirmed by the server.
 */
export async function getUnsyncedCount() {
  const db = await getDb();
  const res = await db.query(`SELECT count(*)::int AS n FROM sync_queue WHERE status <> 'completed'`);
  return res.rows[0].n;
}
