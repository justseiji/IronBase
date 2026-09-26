/**
 * Versioned database migrations for IronBase.
 * Each migration has a version number, name, and up SQL.
 * Migrations are tracked in the `schema_migrations` table.
 * They run once and are never re-applied.
 */

export const migrations = [
  {
    version: 1,
    name: '001_initial_schema',
    up: `
      -- Users table (for eventual multi-device sync)
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Exercises library
      CREATE TABLE IF NOT EXISTS exercises (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        muscle_group TEXT NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );

      -- Workouts
      CREATE TABLE IF NOT EXISTS workouts (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        date DATE NOT NULL,
        session_focus TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        synced_at TIMESTAMPTZ
      );

      -- Logged sets (each set belongs to a workout and references an exercise)
      CREATE TABLE IF NOT EXISTS logged_sets (
        id TEXT PRIMARY KEY,
        workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
        exercise_id TEXT NOT NULL REFERENCES exercises(id),
        weight REAL NOT NULL,
        reps INTEGER NOT NULL,
        rpe REAL,
        set_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        synced_at TIMESTAMPTZ
      );

      -- Sync queue (durable, survives refresh/restart)
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        payload TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        attempts INTEGER NOT NULL DEFAULT 0,
        last_attempt_at TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'pending'
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
      CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);
      CREATE INDEX IF NOT EXISTS idx_workouts_deleted ON workouts(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_logged_sets_workout_id ON logged_sets(workout_id);
      CREATE INDEX IF NOT EXISTS idx_logged_sets_exercise_id ON logged_sets(exercise_id);
      CREATE INDEX IF NOT EXISTS idx_logged_sets_deleted ON logged_sets(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
    `,
  },
];

/**
 * Run all pending migrations against the provided PGlite instance.
 * Creates the schema_migrations tracking table if it doesn't exist.
 *
 * @param {import('@electric-sql/pglite').PGlite} db - PGlite instance
 */
export async function runMigrations(db) {
  // Ensure migration tracking table exists
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Determine which migrations have already run
  const applied = await db.query('SELECT version FROM schema_migrations ORDER BY version');
  const appliedVersions = new Set(applied.rows.map(r => r.version));

  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) {
      continue;
    }

    console.log(`[IronBase] Running migration ${migration.name}...`);
    await db.exec(migration.up);
    await db.query(
      'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
      [migration.version, migration.name]
    );
    console.log(`[IronBase] Migration ${migration.name} applied.`);
  }
}
