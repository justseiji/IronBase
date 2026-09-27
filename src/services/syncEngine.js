/**
 * Sync Engine for IronBase.
 * Pushes the local sync_queue to the API, then pulls the account's server
 * state into the local database. One cycle runs at a time.
 */

import { getDb } from '../database/db.js';
import { apiRequest } from './apiClient.js';
import { normalizeDate } from '../repositories/workoutRepository.js';

const SYNC_INTERVAL_MS = 10000;
const MAX_ATTEMPTS = 5;

let timer = null;
let generation = 0;
let inFlight = null;

export const syncState = {
  status: 'synced', // 'synced' | 'syncing' | 'offline' | 'error'
  pending: 0,
  lastSyncedAt: null,
  listeners: new Set(),
  set(patch) {
    let changed = false;
    for (const key of Object.keys(patch)) {
      if (this[key] !== patch[key]) {
        this[key] = patch[key];
        changed = true;
      }
    }
    if (changed) this.listeners.forEach(l => l(this.snapshot()));
  },
  snapshot() {
    return { status: this.status, pending: this.pending, lastSyncedAt: this.lastSyncedAt };
  },
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
};

class UnauthorizedError extends Error {}
class CancelledError extends Error {}

function handleOnline() {
  syncNow();
}

function handleOffline() {
  syncState.set({ status: 'offline' });
}

export function startSyncEngine() {
  if (timer) return;
  generation++;
  timer = setInterval(syncNow, SYNC_INTERVAL_MS);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
}

export function stopSyncEngine() {
  generation++;
  if (timer) clearInterval(timer);
  timer = null;
  inFlight = null;
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  syncState.set({ status: 'synced', pending: 0, lastSyncedAt: null });
}

/**
 * Run a sync cycle now (or join the one already running).
 * Resolves once local and server state have been reconciled or the attempt failed.
 */
export function syncNow() {
  if (!timer) return Promise.resolve();
  if (!inFlight) {
    const gen = generation;
    inFlight = runCycle(gen).catch(err => {
      if (gen === generation) console.error('[Sync Engine]', err);
    }).finally(() => {
      if (gen === generation) inFlight = null;
    });
  }
  return inFlight;
}

async function refreshPending(db) {
  const res = await db.query(`SELECT count(*)::int AS n FROM sync_queue WHERE status = 'pending'`);
  const failed = await db.query(`SELECT count(*)::int AS n FROM sync_queue WHERE status = 'failed'`);
  return { pending: res.rows[0].n, failed: failed.rows[0].n };
}

async function runCycle(gen) {
  // Capture the database once: if the account changes mid-cycle, writes go
  // to the (closed) original handle and fail instead of crossing accounts.
  const db = await getDb();
  const assertCurrent = () => {
    if (gen !== generation) throw new CancelledError();
  };

  const counts = await refreshPending(db);
  if (!navigator.onLine) {
    syncState.set({ status: 'offline', pending: counts.pending });
    return;
  }

  syncState.set({ status: 'syncing', pending: counts.pending });
  try {
    await pushQueue(db, assertCurrent);
    await pullServerData(db, assertCurrent);
    const after = await refreshPending(db);
    syncState.set({
      status: after.failed > 0 ? 'error' : 'synced',
      pending: after.pending,
      lastSyncedAt: new Date(),
    });
  } catch (err) {
    if (err instanceof CancelledError) return;
    const after = await refreshPending(db).catch(() => counts);
    if (err instanceof UnauthorizedError) {
      syncState.set({ status: 'error', pending: after.pending });
      window.dispatchEvent(new Event('ironbase-unauthorized'));
    } else if (err.network) {
      syncState.set({ status: 'offline', pending: after.pending });
    } else {
      console.error('[Sync Engine] Sync failed:', err);
      syncState.set({ status: 'error', pending: after.pending });
    }
  }
}

async function send(item) {
  try {
    if (item.operation === 'UPSERT') {
      await apiRequest('/workouts', { method: 'POST', body: JSON.parse(item.payload) });
    } else if (item.operation === 'DELETE') {
      await apiRequest(`/workouts/${encodeURIComponent(item.entity_id)}`, { method: 'DELETE' });
    }
  } catch (err) {
    // Already gone on the server — the delete's goal is met.
    if (item.operation === 'DELETE' && err.status === 404) return;
    throw err;
  }
}

async function pushQueue(db, assertCurrent) {
  const res = await db.query(`
    SELECT * FROM sync_queue
    WHERE status = 'pending' AND entity_type = 'workout'
    ORDER BY created_at ASC
  `);

  for (const item of res.rows) {
    assertCurrent();
    try {
      await send(item);
      await db.query(`UPDATE sync_queue SET status = 'completed', last_attempt_at = NOW() WHERE id = $1`, [item.id]);
    } catch (err) {
      if (err.status === 401) throw new UnauthorizedError();
      // Connectivity problems don't count against the item; it simply waits.
      if (err.network) throw err;
      const status = item.attempts + 1 >= MAX_ATTEMPTS ? 'failed' : 'pending';
      console.warn(`[Sync Engine] ${item.operation} ${item.entity_id} rejected (${err.status}): ${err.message}`);
      await db.query(
        `UPDATE sync_queue SET attempts = attempts + 1, last_attempt_at = NOW(), status = $1 WHERE id = $2`,
        [status, item.id]
      );
    }
  }
}

function signature(w) {
  const sets = w.deleted ? '' : w.sets.map(s => [s.id, s.exerciseId, Number(s.weight), Number(s.reps), s.rpe == null ? '' : Number(s.rpe)].join(':')).join(',');
  return [w.date, w.sessionFocus, w.deleted ? 1 : 0, sets].join('|');
}

async function readLocalSignatures(db) {
  const workouts = await db.query('SELECT id, date, session_focus, deleted_at FROM workouts');
  const sets = await db.query(
    `SELECT id, workout_id, exercise_id, weight, reps, rpe FROM logged_sets
     WHERE deleted_at IS NULL ORDER BY set_order ASC, created_at ASC`
  );
  const setsByWorkout = {};
  for (const s of sets.rows) {
    (setsByWorkout[s.workout_id] ||= []).push({ id: s.id, exerciseId: s.exercise_id, weight: s.weight, reps: s.reps, rpe: s.rpe });
  }
  const map = new Map();
  for (const w of workouts.rows) {
    map.set(w.id, signature({
      date: normalizeDate(w.date),
      sessionFocus: w.session_focus,
      deleted: w.deleted_at !== null,
      sets: setsByWorkout[w.id] || [],
    }));
  }
  return map;
}

async function pullServerData(db, assertCurrent) {
  let serverWorkouts;
  try {
    serverWorkouts = await apiRequest('/workouts');
  } catch (err) {
    if (err.status === 401) throw new UnauthorizedError();
    throw err;
  }
  assertCurrent();

  const pendingRes = await db.query(`SELECT DISTINCT entity_id FROM sync_queue WHERE status = 'pending'`);
  const pendingIds = new Set(pendingRes.rows.map(r => r.entity_id));
  const local = await readLocalSignatures(db);

  // Local edits that haven't reached the server yet win over the server copy.
  const changed = serverWorkouts.filter(w => !pendingIds.has(w.id) && local.get(w.id) !== signature(w) && !(w.deleted && !local.has(w.id)));
  if (changed.length === 0) return;

  assertCurrent();
  await db.transaction(async (tx) => {
    for (const w of changed) {
      if (w.deleted) {
        await tx.query('UPDATE workouts SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1', [w.id]);
        await tx.query('UPDATE logged_sets SET deleted_at = NOW(), updated_at = NOW() WHERE workout_id = $1', [w.id]);
        continue;
      }
      await tx.query(
        `INSERT INTO workouts (id, date, session_focus, updated_at, synced_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           date = EXCLUDED.date,
           session_focus = EXCLUDED.session_focus,
           updated_at = NOW(),
           synced_at = NOW(),
           deleted_at = NULL`,
        [w.id, w.date, w.sessionFocus]
      );
      await tx.query('DELETE FROM logged_sets WHERE workout_id = $1', [w.id]);
      for (let i = 0; i < w.sets.length; i++) {
        const s = w.sets[i];
        await tx.query(
          `INSERT INTO logged_sets (id, workout_id, exercise_id, weight, reps, rpe, set_order, synced_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [s.id, w.id, s.exerciseId, s.weight, s.reps, s.rpe || null, i]
        );
      }
    }
  });

  window.dispatchEvent(new Event('ironbase-data-updated'));
}
