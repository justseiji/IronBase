/**
 * Centralized PGlite database module for IronBase.
 *
 * Each signed-in account gets its own IndexedDB-backed PGlite database, so
 * one account's local data is never readable while another is signed in on
 * the same device. Only one database is open at a time.
 */

import { PGlite } from '@electric-sql/pglite';
import { runMigrations } from './migrations.js';
import { seedDefaultExercises } from './seed.js';

const LEGACY_DB_NAME = 'ironbase-db';

/** @type {{ userId: string, promise: Promise<PGlite> } | null} */
let current = null;

function dbNameFor(userId) {
  return `ironbase-db-${userId}`;
}

async function initializeDb(dataDir) {
  const db = new PGlite(dataDir);
  await runMigrations(db);
  await seedDefaultExercises(db);
  return db;
}

/**
 * Open (or switch to) the local database belonging to `userId`.
 */
export function openUserDb(userId) {
  if (current?.userId === userId) return current.promise;
  // `current` is claimed synchronously so concurrent callers share one
  // instance; two PGlite instances on the same IndexedDB would corrupt it.
  const previous = current?.promise;
  const promise = (async () => {
    if (previous) await closeHandle(previous);
    return initializeDb(`idb://${dbNameFor(userId)}`);
  })();
  current = { userId, promise };
  promise.catch(() => {
    if (current?.promise === promise) current = null;
  });
  return promise;
}

async function closeHandle(promise) {
  try {
    const db = await promise;
    await db.close();
  } catch {
    // A database that failed to open has nothing to close.
  }
}

/**
 * Get the signed-in account's database.
 *
 * @returns {Promise<PGlite>}
 */
export async function getDb() {
  if (!current) throw new Error('No local database is open (not signed in)');
  return current.promise;
}

export function getOpenUserId() {
  return current?.userId ?? null;
}

export async function closeDb() {
  if (!current) return;
  const { promise } = current;
  current = null;
  await closeHandle(promise);
}

function deleteIndexedDb(name) {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
}

/**
 * Permanently remove an account's local database from this device.
 */
export async function deleteUserDb(userId) {
  if (current?.userId === userId) await closeDb();
  await deleteIndexedDb(`/pglite/${dbNameFor(userId)}`);
}

async function legacyDbExists() {
  if (typeof indexedDB.databases !== 'function') return true;
  const dbs = await indexedDB.databases();
  return dbs.some(d => d.name === `/pglite/${LEGACY_DB_NAME}`);
}

/**
 * Read workouts from the pre-accounts shared database, if one exists on this
 * device. Returns null when there is nothing to adopt.
 */
export async function readLegacyWorkouts() {
  if (!(await legacyDbExists())) return null;
  const legacy = new PGlite(`idb://${LEGACY_DB_NAME}`);
  try {
    const hasTable = await legacy.query(`SELECT to_regclass('public.workouts') AS t`);
    if (!hasTable.rows[0]?.t) return [];
    const workouts = await legacy.query(
      'SELECT id, date, session_focus FROM workouts WHERE deleted_at IS NULL ORDER BY date ASC'
    );
    const sets = await legacy.query(
      `SELECT workout_id, exercise_id, weight, reps, rpe FROM logged_sets
       WHERE deleted_at IS NULL ORDER BY set_order ASC, created_at ASC`
    );
    return workouts.rows.map(w => ({
      date: w.date,
      sessionFocus: w.session_focus,
      sets: sets.rows
        .filter(s => s.workout_id === w.id)
        .map(s => ({ exerciseId: s.exercise_id, weight: s.weight, reps: s.reps, rpe: s.rpe })),
    }));
  } finally {
    await legacy.close();
  }
}

export async function deleteLegacyDb() {
  await deleteIndexedDb(`/pglite/${LEGACY_DB_NAME}`);
}
