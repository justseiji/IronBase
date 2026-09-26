/**
 * Centralized PGlite database module for IronBase.
 * Singleton pattern — only one database instance is ever created.
 *
 * Responsibilities:
 * - Initialize PGlite with IndexedDB persistence
 * - Run migrations
 * - Seed defaults
 * - Expose the initialized instance
 */

import { PGlite } from '@electric-sql/pglite';
import { runMigrations } from './migrations.js';
import { seedDefaultExercises } from './seed.js';

/** @type {PGlite | null} */
let dbInstance = null;

/** @type {Promise<PGlite> | null} */
let initPromise = null;

/**
 * Get the initialized PGlite database instance.
 * First call initializes the database, runs migrations, and seeds defaults.
 * Subsequent calls return the same instance.
 *
 * @returns {Promise<PGlite>} The initialized database
 */
export async function getDb() {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = initializeDb();
  dbInstance = await initPromise;
  return dbInstance;
}

/**
 * Internal initialization — creates PGlite with IndexedDB persistence,
 * runs migrations, and seeds default exercises.
 */
async function initializeDb() {
  console.log('[IronBase] Initializing PGlite database...');

  const db = new PGlite('idb://ironbase-db');

  await runMigrations(db);
  await seedDefaultExercises(db);

  console.log('[IronBase] Database ready.');
  return db;
}

/**
 * Close the database connection. Primarily for testing.
 */
export async function closeDb() {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
    initPromise = null;
  }
}
