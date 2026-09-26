/**
 * Sync Engine for IronBase.
 * Handles background pushing of pending mutations in the local sync_queue to the remote API.
 */

import { getDb } from '../database/db.js';

const API_BASE_URL = 'http://localhost:3001/api';
const SYNC_INTERVAL_MS = 5000;
const PULL_INTERVAL_MS = 15000;
const MAX_ATTEMPTS = 5;

let isSyncing = false;
let syncTimer = null;
let pullTimer = null;

export const syncState = {
  status: 'idle', // 'idle' | 'syncing' | 'offline' | 'error'
  listeners: [],
  setStatus(newStatus) {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.listeners.forEach(l => l(newStatus));
  },
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
};

/**
 * Start the background sync loop.
 */
export function startSyncEngine() {
  if (syncTimer) return;
  console.log('[Sync Engine] Started');
  
  // Push changes every 5 seconds
  syncTimer = setInterval(processSyncQueue, SYNC_INTERVAL_MS);
  // Pull changes every 15 seconds
  pullTimer = setInterval(pullServerData, PULL_INTERVAL_MS);
  
  // Trigger immediately on start
  processSyncQueue();
  pullServerData();
}

/**
 * Stop the background sync loop.
 */
export function stopSyncEngine() {
  if (syncTimer) {
    clearInterval(syncTimer);
    clearInterval(pullTimer);
    syncTimer = null;
    pullTimer = null;
    console.log('[Sync Engine] Stopped');
  }
}

/**
 * Pull latest data from server.
 */
async function pullServerData() {
  if (isSyncing) return;
  
  try {
    isSyncing = true;
    syncState.setStatus('syncing');
    
    const res = await fetch(`${API_BASE_URL}/workouts`);
    if (!res.ok) throw new Error(`Pull failed: ${res.status}`);
    
    const serverWorkouts = await res.json();
    const db = await getDb();
    
    await db.transaction(async (tx) => {
      for (const w of serverWorkouts) {
        // Upsert workout
        await tx.query(
          `INSERT INTO workouts (id, date, session_focus, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (id) DO UPDATE SET 
             date = EXCLUDED.date, 
             session_focus = EXCLUDED.session_focus,
             updated_at = NOW(),
             deleted_at = NULL`,
          [w.id, w.date, w.sessionFocus]
        );
        
        // Delete existing sets to replace them
        await tx.query('DELETE FROM logged_sets WHERE workout_id = $1', [w.id]);
        
        // Insert sets
        if (w.sets && w.sets.length > 0) {
          for (let i = 0; i < w.sets.length; i++) {
            const s = w.sets[i];
            await tx.query(
              `INSERT INTO logged_sets (id, workout_id, exercise_id, weight, reps, rpe, set_order)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [s.id, w.id, s.exerciseId, s.weight, s.reps, s.rpe || null, i]
            );
          }
        }
      }
    });
    
    // Check if there's an active App to notify data changes
    window.dispatchEvent(new Event('ironbase-data-updated'));
    
    syncState.setStatus('idle');
  } catch (err) {
    // Determine if it's a network error (offline)
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      syncState.setStatus('offline');
    } else {
      console.error('[Sync Engine] Pull error:', err);
      syncState.setStatus('error');
    }
  } finally {
    isSyncing = false;
  }
}

/**
 * Process all pending items in the sync_queue.
 */
async function processSyncQueue() {
  if (isSyncing) return;
  
  try {
    const db = await getDb();
    
    // Get pending operations
    const res = await db.query(`
      SELECT * FROM sync_queue 
      WHERE status = 'pending' AND attempts < $1
      ORDER BY created_at ASC
    `, [MAX_ATTEMPTS]);

    if (res.rows.length === 0) return;

    isSyncing = true;
    syncState.setStatus('syncing');

    console.log(`[Sync Engine] Processing ${res.rows.length} pending operations`);

    let allSuccess = true;
    for (const item of res.rows) {
      const success = await processItem(db, item);
      if (!success) allSuccess = false;
    }
    
    syncState.setStatus(allSuccess ? 'idle' : 'offline');
  } catch (err) {
    console.error('[Sync Engine] Error processing queue', err);
    syncState.setStatus('error');
  } finally {
    isSyncing = false;
  }
}

/**
 * Process a single sync queue item.
 */
async function processItem(db, item) {
  const { id, entity_type, entity_id, operation, payload, attempts } = item;
  let success = false;

  try {
    if (entity_type === 'workout') {
      if (operation === 'UPSERT') {
        const data = JSON.parse(payload);
        const res = await fetch(`${API_BASE_URL}/workouts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        success = true;
      } 
      else if (operation === 'DELETE') {
        const res = await fetch(`${API_BASE_URL}/workouts/${entity_id}`, {
          method: 'DELETE'
        });
        if (!res.ok && res.status !== 404) throw new Error(`API Error: ${res.status}`);
        success = true;
      }
    }

    if (success) {
      // Mark as completed
      await db.query('UPDATE sync_queue SET status = $1 WHERE id = $2', ['completed', id]);
      console.log(`[Sync Engine] Successfully synced ${operation} for ${entity_type} ${entity_id}`);
      return true;
    }
    return false;
  } catch (err) {
    console.warn(`[Sync Engine] Failed to sync ${id} (Attempt ${attempts + 1})`, err);
    
    const newStatus = attempts + 1 >= MAX_ATTEMPTS ? 'failed' : 'pending';
    await db.query(`
      UPDATE sync_queue 
      SET attempts = attempts + 1, last_attempt_at = NOW(), status = $1 
      WHERE id = $2
    `, [newStatus, id]);
    return false;
  }
}
