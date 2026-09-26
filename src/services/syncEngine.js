/**
 * Sync Engine for IronBase.
 * Handles background pushing of pending mutations in the local sync_queue to the remote API.
 */

import { getDb } from '../database/db.js';

const API_BASE_URL = 'http://localhost:3001/api';
const SYNC_INTERVAL_MS = 5000;
const MAX_ATTEMPTS = 5;

let isSyncing = false;
let syncTimer = null;

/**
 * Start the background sync loop.
 */
export function startSyncEngine() {
  if (syncTimer) return;
  console.log('[Sync Engine] Started');
  syncTimer = setInterval(processSyncQueue, SYNC_INTERVAL_MS);
  // Trigger immediately on start
  processSyncQueue();
}

/**
 * Stop the background sync loop.
 */
export function stopSyncEngine() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log('[Sync Engine] Stopped');
  }
}

/**
 * Process all pending items in the sync_queue.
 */
async function processSyncQueue() {
  if (isSyncing) return;
  
  try {
    isSyncing = true;
    const db = await getDb();
    
    // Get pending operations, ordered by created_at
    const res = await db.query(`
      SELECT * FROM sync_queue 
      WHERE status = 'pending' AND attempts < $1
      ORDER BY created_at ASC
    `, [MAX_ATTEMPTS]);

    if (res.rows.length === 0) {
      isSyncing = false;
      return;
    }

    console.log(`[Sync Engine] Processing ${res.rows.length} pending operations`);

    for (const item of res.rows) {
      await processItem(db, item);
    }
  } catch (err) {
    console.error('[Sync Engine] Error processing queue', err);
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
    }
  } catch (err) {
    console.warn(`[Sync Engine] Failed to sync ${id} (Attempt ${attempts + 1})`, err);
    
    const newStatus = attempts + 1 >= MAX_ATTEMPTS ? 'failed' : 'pending';
    await db.query(`
      UPDATE sync_queue 
      SET attempts = attempts + 1, last_attempt_at = NOW(), status = $1 
      WHERE id = $2
    `, [newStatus, id]);
  }
}
