import { getDb, readLegacyWorkouts, deleteLegacyDb } from './db.js';
import { importWorkouts } from '../repositories/workoutRepository.js';
import { LEGACY_DRAFT_KEY, draftKeyFor } from '../utils/drafts.js';

const LEGACY_STORAGE_KEY = 'ironbase-data';

function readLocalStorageData() {
  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!data || data.migratedToPGlite || !Array.isArray(data.workoutHistory)) return { exercises: [], workouts: [] };
    return { exercises: data.exercises || [], workouts: data.workoutHistory };
  } catch {
    return { exercises: [], workouts: [] };
  }
}

/**
 * Data logged before accounts existed lives in a device-wide database (and,
 * for very old installs, localStorage). The first account to sign in on the
 * device adopts it: it is copied into that account's database, queued for
 * sync, and the shared copy is removed.
 */
let inProgress = null;

export function adoptLegacyData(userId) {
  if (!inProgress) inProgress = adopt(userId).finally(() => { inProgress = null; });
  return inProgress;
}

function adoptDraft(userId) {
  try {
    const draft = localStorage.getItem(LEGACY_DRAFT_KEY);
    if (draft === null) return;
    if (localStorage.getItem(draftKeyFor(userId)) === null) localStorage.setItem(draftKeyFor(userId), draft);
    localStorage.removeItem(LEGACY_DRAFT_KEY);
  } catch {
    // Storage unavailable.
  }
}

async function adopt(userId) {
  adoptDraft(userId);
  const fromStorage = readLocalStorageData();
  const fromDb = await readLegacyWorkouts();
  if (!fromStorage && fromDb === null) return 0;

  const db = await getDb();
  for (const ex of fromStorage?.exercises ?? []) {
    await db.query(
      `INSERT INTO exercises (id, name, muscle_group, is_default)
       VALUES ($1, $2, $3, false)
       ON CONFLICT (id) DO NOTHING`,
      [ex.id, ex.name, ex.muscleGroup]
    );
  }

  const workouts = [...(fromStorage?.workouts ?? []), ...(fromDb ?? [])]
    .filter(w => w.date && w.sessionFocus && Array.isArray(w.sets) && w.sets.length > 0);
  if (workouts.length > 0) await importWorkouts(workouts);

  if (fromStorage) localStorage.removeItem(LEGACY_STORAGE_KEY);
  if (fromDb !== null) await deleteLegacyDb();
  return workouts.length;
}
